import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import * as argon2 from 'argon2';

/**
 * Enum pour les rôles utilisateurs
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
}

/**
 * Enum pour les plans de subscription
 */
export enum SubscriptionPlan {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

/**
 * Enum pour le statut utilisateur
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

/**
 * Entité User avec gestion complète RGPD
 * - Soft delete pour audit
 * - Consentements trackés
 * - Hash Argon2id pour mots de passe
 * - Indexes pour performance
 */
@Entity('users')
@Index(['email'], { unique: true })
@Index(['refreshToken'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  firstName: string;

  @Column({ type: 'varchar', length: 255 })
  lastName: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: SubscriptionPlan,
    default: SubscriptionPlan.FREE,
  })
  subscriptionPlan: SubscriptionPlan;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true, select: false })
  refreshToken: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  stripeCustomerId: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  stripeSubscriptionId: string | null;

  // RGPD: Consentements
  @Column({ type: 'boolean', default: false })
  gdprConsent: boolean;

  @Column({ type: 'timestamp', nullable: true })
  gdprConsentDate: Date | null;

  @Column({ type: 'boolean', default: false })
  marketingConsent: boolean;

  @Column({ type: 'timestamp', nullable: true })
  marketingConsentDate: Date | null;

  // RGPD: Données anonymisées
  @Column({ type: 'boolean', default: false })
  anonymized: boolean;

  @Column({ type: 'timestamp', nullable: true })
  anonymizedAt: Date | null;

  // Audit: Dernière connexion
  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  lastLoginIp: string | null;

  // Sécurité: Nombre de tentatives de connexion échouées
  @Column({ type: 'int', default: 0 })
  failedLoginAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lockedUntil: Date | null;

  // Timestamps automatiques
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Soft delete pour audit et RGPD
  @DeleteDateColumn()
  deletedAt: Date | null;

  /**
   * Hash du mot de passe avant insertion
   */
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password && !this.password.startsWith('$argon2id$')) {
      this.password = await argon2.hash(this.password, {
        type: argon2.argon2id,
        memoryCost: 65536, // 64 MB
        timeCost: 3,
        parallelism: 4,
      });
    }
  }

  /**
   * Vérifier le mot de passe
   */
  async comparePassword(password: string): Promise<boolean> {
    try {
      return await argon2.verify(this.password, password);
    } catch {
      return false;
    }
  }

  /**
   * Anonymiser les données utilisateur (RGPD)
   */
  anonymize(): void {
    this.email = `deleted_${this.id}@anonymized.local`;
    this.firstName = 'Anonymized';
    this.lastName = 'User';
    this.password = '';
    this.refreshToken = null;
    this.anonymized = true;
    this.anonymizedAt = new Date();
    this.status = UserStatus.DELETED;
  }

  /**
   * Vérifier si le compte est verrouillé
   */
  isLocked(): boolean {
    return this.lockedUntil !== null && this.lockedUntil > new Date();
  }

  /**
   * Incrémenter les tentatives de connexion échouées
   */
  incrementFailedLoginAttempts(): void {
    this.failedLoginAttempts += 1;

    // Verrouiller après 5 tentatives échouées
    if (this.failedLoginAttempts >= 5) {
      this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }
  }

  /**
   * Réinitialiser les tentatives de connexion
   */
  resetFailedLoginAttempts(): void {
    this.failedLoginAttempts = 0;
    this.lockedUntil = null;
  }
}
