import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService, UpdateProfileDto } from './users.service';
import { User, UserRole } from './entities/user.entity';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserId, Roles } from '@/common/decorators';

/**
 * Controller de gestion des utilisateurs
 * - Profil utilisateur
 * - RGPD (export, anonymisation, suppression)
 * - Admin (gestion des comptes)
 */
@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Récupérer le profil de l'utilisateur courant
   */
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  async getProfile(@CurrentUser() user: User): Promise<User> {
    return user;
  }

  /**
   * Mettre à jour le profil de l'utilisateur courant
   */
  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
  })
  async updateProfile(
    @CurrentUserId() userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    return this.usersService.updateProfile(userId, updateProfileDto);
  }

  /**
   * Supprimer le compte de l'utilisateur courant (soft delete)
   */
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete current user account (soft delete)' })
  @ApiResponse({
    status: 204,
    description: 'Account deleted successfully',
  })
  async deleteAccount(@CurrentUserId() userId: string): Promise<void> {
    await this.usersService.deleteAccount(userId);
  }

  /**
   * RGPD: Droit à l'oubli - Anonymiser les données utilisateur
   */
  @Delete('me/anonymize')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'GDPR: Right to be forgotten - Anonymize user data' })
  @ApiResponse({
    status: 204,
    description: 'User data anonymized successfully',
  })
  async anonymizeUser(@CurrentUserId() userId: string): Promise<void> {
    await this.usersService.anonymizeUser(userId);
  }

  /**
   * RGPD: Exporter les données utilisateur
   */
  @Get('me/export')
  @ApiOperation({ summary: 'GDPR: Export user data' })
  @ApiResponse({
    status: 200,
    description: 'User data exported successfully',
  })
  async exportUserData(@CurrentUserId() userId: string): Promise<Record<string, unknown>> {
    return this.usersService.exportUserData(userId);
  }

  /**
   * Admin: Lister tous les utilisateurs
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Admin: List all users' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
  })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ): Promise<{ users: User[]; total: number }> {
    return this.usersService.findAll(page, limit);
  }

  /**
   * Admin: Récupérer un utilisateur par ID
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Admin: Get user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
  })
  async findById(@Param('id') id: string): Promise<User> {
    return this.usersService.findById(id);
  }

  /**
   * Admin: Suspendre un compte utilisateur
   */
  @Put(':id/suspend')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Admin: Suspend user account' })
  @ApiResponse({
    status: 204,
    description: 'Account suspended successfully',
  })
  async suspendAccount(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ): Promise<void> {
    await this.usersService.suspendAccount(id, reason);
  }

  /**
   * Admin: Activer un compte utilisateur
   */
  @Put(':id/activate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Admin: Activate user account' })
  @ApiResponse({
    status: 204,
    description: 'Account activated successfully',
  })
  async activateAccount(@Param('id') id: string): Promise<void> {
    await this.usersService.activateAccount(id);
  }
}
