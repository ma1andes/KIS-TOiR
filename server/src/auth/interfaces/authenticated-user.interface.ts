import { JWTPayload } from 'jose';

export interface KeycloakJwtPayload extends JWTPayload {
  preferred_username?: string;
  name?: string;
  email?: string;
  realm_access?: {
    roles?: string[];
  };
}

export interface AuthenticatedUser {
  sub: string;
  username?: string;
  name?: string;
  email?: string;
  roles: string[];
  claims: KeycloakJwtPayload;
}

