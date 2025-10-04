import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { User, UserStatus } from '../users/entities/user.entity';
import { SignUpDto, SignInDto, AuthResponseDto } from './dto/auth.dto';
import { LoggerService } from '@/common/services/logger.service';

/**
 * Interface pour le payload JWT
 */
interface IJwtPayload {
  sub: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

/**
 * Service d'authentification
 * - JWT avec access + refresh tokens
 * - Hash Argon2id pour les mots de passe
 * - Protection brute-force
 * - Audit logs RGPD
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('AuthService');
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  async signUp(signUpDto: SignUpDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName, gdprConsent, marketingConsent } = signUpDto;

    // Vérifier si le consentement RGPD est donné
    if (!gdprConsent) {
      throw new BadRequestException('GDPR consent is required');
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Créer le nouvel utilisateur
    const user = this.userRepository.create({
      email,
      password,
      firstName,
      lastName,
      gdprConsent,
      gdprConsentDate: new Date(),
      marketingConsent: marketingConsent || false,
      marketingConsentDate: marketingConsent ? new Date() : null,
    });

    await this.userRepository.save(user);

    // Audit log
    this.logger.audit('USER_SIGNUP', user.id, {
      email: user.email,
      gdprConsent: true,
      marketingConsent: marketingConsent || false,
    });

    // Générer les tokens
    return this.generateAuthResponse(user);
  }

  /**
   * Connexion utilisateur
   */
  async signIn(signInDto: SignInDto, ip: string): Promise<AuthResponseDto> {
    const { email, password } = signInDto;

    // Récupérer l'utilisateur avec le mot de passe
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'firstName', 'lastName', 'role', 'subscriptionPlan', 'status', 'failedLoginAttempts', 'lockedUntil'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Vérifier si le compte est verrouillé
    if (user.isLocked()) {
      this.logger.warn(`Login attempt on locked account: ${email}`, { ip });
      throw new UnauthorizedException('Account is locked. Please try again later.');
    }

    // Vérifier si le compte est actif
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Incrémenter les tentatives échouées
      user.incrementFailedLoginAttempts();
      await this.userRepository.save(user);

      this.logger.warn(`Failed login attempt for user: ${email}`, { ip, attempts: user.failedLoginAttempts });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Réinitialiser les tentatives échouées
    user.resetFailedLoginAttempts();

    // Mettre à jour la dernière connexion
    user.lastLoginAt = new Date();
    user.lastLoginIp = ip;
    await this.userRepository.save(user);

    // Audit log
    this.logger.audit('USER_LOGIN', user.id, {
      email: user.email,
      ip,
    });

    // Générer les tokens
    return this.generateAuthResponse(user);
  }

  /**
   * Rafraîchir l'access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      // Vérifier le refresh token
      const payload = this.jwtService.verify<IJwtPayload>(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Récupérer l'utilisateur
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        select: ['id', 'email', 'firstName', 'lastName', 'role', 'subscriptionPlan', 'refreshToken'],
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Vérifier que le refresh token correspond
      const isRefreshTokenValid = await argon2.verify(user.refreshToken || '', refreshToken);
      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Générer de nouveaux tokens
      return this.generateAuthResponse(user);
    } catch (error) {
      this.logger.error('Refresh token validation failed', (error as Error).stack);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Déconnexion utilisateur
   */
  async signOut(userId: string): Promise<void> {
    await this.userRepository.update(userId, { refreshToken: null });

    this.logger.audit('USER_LOGOUT', userId, {});
  }

  /**
   * Générer la réponse d'authentification avec tokens
   */
  private async generateAuthResponse(user: User): Promise<AuthResponseDto> {
    // Générer l'access token
    const accessToken = this.generateAccessToken(user);

    // Générer le refresh token
    const refreshToken = this.generateRefreshToken(user);

    // Hasher et stocker le refresh token
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.userRepository.update(user.id, { refreshToken: hashedRefreshToken });

    return {
      accessToken,
      refreshToken,
      tokenType: 'bearer',
      expiresIn: this.parseExpiration(
        this.configService.get<string>('jwt.accessExpiration', '15m'),
      ),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
      },
    };
  }

  /**
   * Générer un access token
   */
  private generateAccessToken(user: User): string {
    const payload: IJwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.accessExpiration'),
    });
  }

  /**
   * Générer un refresh token
   */
  private generateRefreshToken(user: User): string {
    const payload: IJwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh',
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiration'),
    });
  }

  /**
   * Parser l'expiration en secondes
   */
  private parseExpiration(expiration: string): number {
    const unit = expiration.slice(-1);
    const value = parseInt(expiration.slice(0, -1), 10);

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 900; // 15 minutes par défaut
    }
  }
}
