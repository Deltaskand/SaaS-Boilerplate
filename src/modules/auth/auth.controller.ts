import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  SignUpDto,
  SignInDto,
  RefreshTokenDto,
  AuthResponseDto,
} from './dto/auth.dto';
import { Public, CurrentUserId, IpAddress } from '@/common/decorators';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

/**
 * Controller d'authentification
 * - Inscription
 * - Connexion
 * - Refresh token
 * - Déconnexion
 * - Rate limiting activé
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Inscription d'un nouvel utilisateur
   */
  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requêtes par minute
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation errors',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - user already exists',
  })
  async signUp(@Body() signUpDto: SignUpDto): Promise<AuthResponseDto> {
    return this.authService.signUp(signUpDto);
  }

  /**
   * Connexion utilisateur
   */
  @Public()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requêtes par minute
  @ApiOperation({ summary: 'Sign in with credentials' })
  @ApiResponse({
    status: 200,
    description: 'Successfully signed in',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid credentials',
  })
  async signIn(
    @Body() signInDto: SignInDto,
    @IpAddress() ip: string,
  ): Promise<AuthResponseDto> {
    return this.authService.signIn(signInDto, ip);
  }

  /**
   * Rafraîchir l'access token
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requêtes par minute
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token successfully refreshed',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid refresh token',
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  /**
   * Déconnexion utilisateur
   */
  @UseGuards(JwtAuthGuard)
  @Delete('signout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sign out (invalidate refresh token)' })
  @ApiResponse({
    status: 204,
    description: 'Successfully signed out',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async signOut(@CurrentUserId() userId: string): Promise<void> {
    await this.authService.signOut(userId);
  }
}
