const REQUIRED_ENV_KEYS = [
  'VITE_API_URL',
  'VITE_KEYCLOAK_URL',
  'VITE_KEYCLOAK_REALM',
  'VITE_KEYCLOAK_CLIENT_ID',
] as const;

type RequiredEnvKey = (typeof REQUIRED_ENV_KEYS)[number];

function readRequiredEnv(key: RequiredEnvKey): string {
  const value = import.meta.env[key];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  apiUrl: readRequiredEnv('VITE_API_URL'),
  keycloakUrl: readRequiredEnv('VITE_KEYCLOAK_URL'),
  keycloakRealm: readRequiredEnv('VITE_KEYCLOAK_REALM'),
  keycloakClientId: readRequiredEnv('VITE_KEYCLOAK_CLIENT_ID'),
} as const;

