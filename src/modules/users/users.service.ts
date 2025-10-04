import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus, SubscriptionPlan } from './entities/user.entity';
import { LoggerService } from '@/common/services/logger.service';

/**
 * DTO pour mettre à jour le profil utilisateur
 */
export class UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  marketingConsent?: boolean;
}

/**
 * Service de gestion des utilisateurs
 * - CRUD complet
 * - Droit à l'oubli RGPD
 * - Anonymisation
 * - Audit logs
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('UsersService');
  }

  /**
   * Récupérer un utilisateur par ID
   */
  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.anonymized) {
      throw new NotFoundException('User has been anonymized');
    }

    return user;
  }

  /**
   * Récupérer un utilisateur par email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /**
   * Mettre à jour le profil utilisateur
   */
  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<User> {
    const user = await this.findById(userId);

    // Mettre à jour les champs
    if (updateProfileDto.firstName) {
      user.firstName = updateProfileDto.firstName;
    }

    if (updateProfileDto.lastName) {
      user.lastName = updateProfileDto.lastName;
    }

    // Gérer le consentement marketing
    if (updateProfileDto.marketingConsent !== undefined) {
      user.marketingConsent = updateProfileDto.marketingConsent;
      user.marketingConsentDate = updateProfileDto.marketingConsent ? new Date() : null;

      this.logger.audit('MARKETING_CONSENT_UPDATED', userId, {
        marketingConsent: updateProfileDto.marketingConsent,
      });
    }

    await this.userRepository.save(user);

    this.logger.audit('PROFILE_UPDATED', userId, {
      changes: updateProfileDto,
    });

    return user;
  }

  /**
   * Supprimer le compte utilisateur (soft delete)
   */
  async deleteAccount(userId: string): Promise<void> {
    const user = await this.findById(userId);

    // Soft delete
    await this.userRepository.softDelete(userId);

    this.logger.audit('ACCOUNT_DELETED', userId, {
      email: user.email,
    });
  }

  /**
   * Droit à l'oubli RGPD - Anonymiser l'utilisateur
   */
  async anonymizeUser(userId: string): Promise<void> {
    const user = await this.findById(userId);

    if (user.anonymized) {
      throw new BadRequestException('User is already anonymized');
    }

    // Anonymiser les données
    user.anonymize();
    await this.userRepository.save(user);

    this.logger.audit('USER_ANONYMIZED', userId, {
      reason: 'GDPR_RIGHT_TO_BE_FORGOTTEN',
    });
  }

  /**
   * Exporter les données utilisateur (RGPD)
   */
  async exportUserData(userId: string): Promise<Record<string, unknown>> {
    const user = await this.findById(userId);

    this.logger.audit('DATA_EXPORT_REQUESTED', userId, {});

    return {
      personalData: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
      },
      accountData: {
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        status: user.status,
        emailVerified: user.emailVerified,
      },
      gdprData: {
        gdprConsent: user.gdprConsent,
        gdprConsentDate: user.gdprConsentDate,
        marketingConsent: user.marketingConsent,
        marketingConsentDate: user.marketingConsentDate,
      },
      metadata: {
        lastLoginAt: user.lastLoginAt,
        lastLoginIp: user.lastLoginIp,
        updatedAt: user.updatedAt,
      },
    };
  }

  /**
   * Mettre à jour le plan de subscription
   */
  async updateSubscriptionPlan(userId: string, plan: SubscriptionPlan): Promise<User> {
    const user = await this.findById(userId);

    const oldPlan = user.subscriptionPlan;
    user.subscriptionPlan = plan;

    await this.userRepository.save(user);

    this.logger.audit('SUBSCRIPTION_PLAN_UPDATED', userId, {
      oldPlan,
      newPlan: plan,
    });

    return user;
  }

  /**
   * Suspendre un compte utilisateur (admin)
   */
  async suspendAccount(userId: string, reason: string): Promise<void> {
    const user = await this.findById(userId);

    user.status = UserStatus.SUSPENDED;
    await this.userRepository.save(user);

    this.logger.audit('ACCOUNT_SUSPENDED', userId, {
      reason,
    });
  }

  /**
   * Activer un compte utilisateur (admin)
   */
  async activateAccount(userId: string): Promise<void> {
    const user = await this.findById(userId);

    user.status = UserStatus.ACTIVE;
    user.resetFailedLoginAttempts();
    await this.userRepository.save(user);

    this.logger.audit('ACCOUNT_ACTIVATED', userId, {});
  }

  /**
   * Lister tous les utilisateurs (admin, avec pagination)
   */
  async findAll(page = 1, limit = 20): Promise<{ users: User[]; total: number }> {
    const [users, total] = await this.userRepository.findAndCount({
      where: { anonymized: false },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { users, total };
  }
}
