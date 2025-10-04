import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../users/entities/user.entity';

/**
 * Interface pour le payload JWT décodé
 */
interface IJwtPayload {
  sub: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

/**
 * Stratégie JWT pour Passport
 * Valide le token et charge l'utilisateur
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  /**
   * Valider le payload JWT et retourner l'utilisateur
   */
  async validate(payload: IJwtPayload): Promise<User> {
    // Vérifier le type de token
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    // Charger l'utilisateur
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Vérifier que le compte est actif
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    // Vérifier que le compte n'est pas anonymisé
    if (user.anonymized) {
      throw new UnauthorizedException('Account has been anonymized');
    }

    return user;
  }
}
