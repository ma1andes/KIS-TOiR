import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { RuntimeEnvironment } from '../config/env.validation';
import {
  AuthenticatedUser,
  KeycloakJwtPayload,
} from './interfaces/authenticated-user.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly issuerUrl: string;
  private readonly audience: string;
  private readonly explicitJwksUrl?: string;

  private jwksResolverPromise: Promise<ReturnType<typeof createRemoteJWKSet>> | null =
    null;
  private jwksResolver: ReturnType<typeof createRemoteJWKSet> | null = null;

  constructor(
    private readonly configService: ConfigService<RuntimeEnvironment, true>,
  ) {
    this.issuerUrl = this.configService.getOrThrow('KEYCLOAK_ISSUER_URL');
    this.audience = this.configService.getOrThrow('KEYCLOAK_AUDIENCE');
    this.explicitJwksUrl = this.configService.get('KEYCLOAK_JWKS_URL');
  }

  async verifyAccessToken(token: string): Promise<AuthenticatedUser> {
    try {
      const jwksResolver = await this.getJwksResolver();

      const { payload } = await jwtVerify(token, jwksResolver, {
        issuer: this.issuerUrl,
        audience: this.audience,
      });

      return this.mapPayloadToUser(payload as KeycloakJwtPayload);
    } catch (error) {
      this.logger.warn(
        `JWT verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  private mapPayloadToUser(payload: KeycloakJwtPayload): AuthenticatedUser {
    if (!payload.sub) {
      throw new UnauthorizedException('Token subject is missing');
    }

    const roles = Array.isArray(payload.realm_access?.roles)
      ? payload.realm_access.roles.filter(
          (role): role is string => typeof role === 'string',
        )
      : [];

    return {
      sub: payload.sub,
      username: payload.preferred_username,
      name: payload.name,
      email: payload.email,
      roles,
      claims: payload,
    };
  }

  private async getJwksResolver() {
    if (this.jwksResolver) {
      return this.jwksResolver;
    }

    if (!this.jwksResolverPromise) {
      this.jwksResolverPromise = this.createJwksResolver()
        .then((resolver) => {
          this.jwksResolver = resolver;
          return resolver;
        })
        .finally(() => {
          this.jwksResolverPromise = null;
        });
    }

    return this.jwksResolverPromise;
  }

  private async createJwksResolver() {
    const jwksUrl = await this.resolveJwksUrl();
    this.logger.log(`Using JWKS URL: ${jwksUrl}`);
    return createRemoteJWKSet(new URL(jwksUrl));
  }

  private async resolveJwksUrl(): Promise<string> {
    if (this.explicitJwksUrl) {
      return this.explicitJwksUrl;
    }

    const issuer = this.issuerUrl.replace(/\/+$/, '');
    const discoveryUrl = `${issuer}/.well-known/openid-configuration`;

    try {
      const discoveryResponse = await fetch(discoveryUrl, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (discoveryResponse.ok) {
        const discoveryDocument = (await discoveryResponse.json()) as {
          jwks_uri?: string;
        };

        if (
          typeof discoveryDocument.jwks_uri === 'string' &&
          discoveryDocument.jwks_uri.trim().length > 0
        ) {
          return discoveryDocument.jwks_uri;
        }
      }
    } catch (error) {
      this.logger.warn(
        `OIDC discovery failed at ${discoveryUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    return `${issuer}/protocol/openid-connect/certs`;
  }
}

