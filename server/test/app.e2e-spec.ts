import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { AuthenticatedUser } from '../src/auth/interfaces/authenticated-user.interface';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from './../src/app.module';

describe('Auth and Health (e2e)', () => {
  let app: INestApplication;
  let authServiceMock: {
    verifyAccessToken: jest.Mock<Promise<AuthenticatedUser>, [string]>;
  };

  beforeAll(async () => {
    process.env.PORT = '3000';
    process.env.DATABASE_URL =
      process.env.DATABASE_URL ??
      'postgresql://postgres:postgres@localhost:5432/toir';
    process.env.CORS_ALLOWED_ORIGINS =
      process.env.CORS_ALLOWED_ORIGINS ??
      'http://localhost:5173,https://toir-frontend.greact.ru';
    process.env.KEYCLOAK_ISSUER_URL =
      process.env.KEYCLOAK_ISSUER_URL ?? 'https://sso.greact.ru/realms/toir';
    process.env.KEYCLOAK_AUDIENCE =
      process.env.KEYCLOAK_AUDIENCE ?? 'toir-backend';

    authServiceMock = {
      verifyAccessToken: jest.fn<Promise<AuthenticatedUser>, [string]>(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AuthService)
      .useValue(authServiceMock)
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    authServiceMock.verifyAccessToken.mockReset();
  });

  it('/health (GET) is public', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('/equipment (GET) requires authentication', () => {
    return request(app.getHttpServer()).get('/equipment').expect(401);
  });

  it('/equipment (POST) returns 403 for authenticated viewer role', async () => {
    authServiceMock.verifyAccessToken.mockResolvedValue({
      sub: 'viewer-user',
      username: 'viewer-user',
      roles: ['viewer'],
      claims: {
        sub: 'viewer-user',
        realm_access: {
          roles: ['viewer'],
        },
      },
    });

    await request(app.getHttpServer())
      .post('/equipment')
      .set('Authorization', 'Bearer viewer-token')
      .send({})
      .expect(403);
  });
});
