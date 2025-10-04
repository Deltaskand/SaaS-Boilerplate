import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Tests E2E pour l'authentification
 * Niveau NASA : tests complets du flow d'authentification
 */
describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let refreshToken: string;

  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'Test@1234',
    firstName: 'Test',
    lastName: 'User',
    gdprConsent: true,
    marketingConsent: false,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Appliquer la même config que main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/auth/signup (POST)', () => {
    it('devrait créer un nouvel utilisateur avec succès', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe(testUser.email);
          expect(res.body.user).not.toHaveProperty('password');

          // Sauvegarder les tokens pour les tests suivants
          accessToken = res.body.accessToken;
          refreshToken = res.body.refreshToken;
        });
    });

    it('devrait rejeter une inscription sans consentement RGPD', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          ...testUser,
          email: `test2-${Date.now()}@example.com`,
          gdprConsent: false,
        })
        .expect(400);
    });

    it('devrait rejeter un email invalide', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          ...testUser,
          email: 'invalid-email',
        })
        .expect(400);
    });

    it('devrait rejeter un mot de passe faible', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          ...testUser,
          email: `test3-${Date.now()}@example.com`,
          password: 'weak',
        })
        .expect(400);
    });

    it('devrait rejeter une inscription en double', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send(testUser)
        .expect(409); // Conflict
    });
  });

  describe('/api/v1/auth/signin (POST)', () => {
    it('devrait connecter un utilisateur avec succès', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/signin')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body.user.email).toBe(testUser.email);
        });
    });

    it('devrait rejeter des credentials invalides', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/signin')
        .send({
          email: testUser.email,
          password: 'WrongPassword@123',
        })
        .expect(401);
    });

    it('devrait rejeter un utilisateur inexistant', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/signin')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test@1234',
        })
        .expect(401);
    });
  });

  describe('/api/v1/auth/refresh (POST)', () => {
    it('devrait rafraîchir le token avec succès', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
        });
    });

    it('devrait rejeter un refresh token invalide', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('/api/v1/auth/signout (DELETE)', () => {
    it('devrait rejeter sans token d\'authentification', () => {
      return request(app.getHttpServer()).delete('/api/v1/auth/signout').expect(401);
    });

    it('devrait déconnecter l\'utilisateur avec succès', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/auth/signout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });
  });

  describe('/api/v1/users/me (GET)', () => {
    let newAccessToken: string;

    beforeAll(async () => {
      // Se reconnecter pour obtenir un nouveau token
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signin')
        .send({
          email: testUser.email,
          password: testUser.password,
        });
      newAccessToken = response.body.accessToken;
    });

    it('devrait rejeter sans token d\'authentification', () => {
      return request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
    });

    it('devrait récupérer le profil utilisateur avec succès', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe(testUser.email);
          expect(res.body.firstName).toBe(testUser.firstName);
          expect(res.body).not.toHaveProperty('password');
          expect(res.body).not.toHaveProperty('refreshToken');
        });
    });
  });

  describe('Rate Limiting', () => {
    it('devrait appliquer le rate limiting sur /signup', async () => {
      const email = `ratelimit-${Date.now()}@example.com`;

      // Faire 4 requêtes (limite = 3)
      for (let i = 0; i < 4; i++) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/signup')
          .send({
            ...testUser,
            email: `${i}-${email}`,
          });

        if (i < 3) {
          expect([201, 409]).toContain(response.status);
        } else {
          expect(response.status).toBe(429); // Too Many Requests
        }
      }
    });
  });
});
