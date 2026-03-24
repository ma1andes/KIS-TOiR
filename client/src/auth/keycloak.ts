import Keycloak, { KeycloakTokenParsed } from 'keycloak-js';
import { env } from '../config/env';

interface RealmAccessTokenParsed extends KeycloakTokenParsed {
  realm_access?: {
    roles: string[];
  };
}

const keycloak = new Keycloak({
  url: env.keycloakUrl,
  realm: env.keycloakRealm,
  clientId: env.keycloakClientId,
});

let keycloakInitPromise: Promise<void> | null = null;
let refreshInFlight: Promise<void> | null = null;

export function getKeycloak() {
  return keycloak;
}

export async function initKeycloak() {
  if (!keycloakInitPromise) {
    keycloakInitPromise = keycloak
      .init({
        onLoad: 'login-required',
        pkceMethod: 'S256',
        checkLoginIframe: false,
      })
      .then((authenticated) => {
        if (!authenticated) {
          return keycloak.login({ redirectUri: window.location.href });
        }
      });
  }

  await keycloakInitPromise;
}

async function refreshAccessToken(minValiditySeconds = 30) {
  if (!refreshInFlight) {
    refreshInFlight = keycloak
      .updateToken(minValiditySeconds)
      .then(() => undefined)
      .finally(() => {
        refreshInFlight = null;
      });
  }

  await refreshInFlight;
}

export async function getValidAccessToken(minValiditySeconds = 30): Promise<string> {
  await initKeycloak();

  if (!keycloak.authenticated) {
    await keycloak.login({ redirectUri: window.location.href });
    throw new Error('User is not authenticated');
  }

  await refreshAccessToken(minValiditySeconds);

  if (!keycloak.token) {
    throw new Error('Missing access token');
  }

  return keycloak.token;
}

export async function forceReauthentication() {
  keycloak.clearToken();
  await keycloak.login({ redirectUri: window.location.href });
}

export async function logoutFromKeycloak() {
  await keycloak.logout({ redirectUri: window.location.origin });
}

export function getRealmRoles(): string[] {
  const parsed = keycloak.tokenParsed as RealmAccessTokenParsed | undefined;
  const roles = parsed?.realm_access?.roles;
  return Array.isArray(roles) ? roles : [];
}

export function getIdentity() {
  const parsed = keycloak.tokenParsed as RealmAccessTokenParsed | undefined;
  const id = parsed?.sub ?? 'unknown';
  const fullName =
    parsed?.name ??
    parsed?.preferred_username ??
    parsed?.email ??
    'Unknown User';

  return { id, fullName };
}
