export interface RuntimeEnvironment {
  PORT: number;
  DATABASE_URL: string;
  CORS_ALLOWED_ORIGINS: string;
  KEYCLOAK_ISSUER_URL: string;
  KEYCLOAK_AUDIENCE: string;
  KEYCLOAK_JWKS_URL?: string;
}

function getRequiredString(
  config: Record<string, unknown>,
  key: keyof RuntimeEnvironment,
): string {
  const value = config[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value.trim();
}

function getOptionalString(
  config: Record<string, unknown>,
  key: keyof RuntimeEnvironment,
): string | undefined {
  const value = config[key];
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parsePort(value: unknown): number {
  if (value === undefined || value === null || value === '') {
    return 3000;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Environment variable PORT must be an integer between 1 and 65535');
  }

  return port;
}

export function validateEnvironment(
  config: Record<string, unknown>,
): RuntimeEnvironment {
  return {
    PORT: parsePort(config.PORT),
    DATABASE_URL: getRequiredString(config, 'DATABASE_URL'),
    CORS_ALLOWED_ORIGINS: getRequiredString(config, 'CORS_ALLOWED_ORIGINS'),
    KEYCLOAK_ISSUER_URL: getRequiredString(config, 'KEYCLOAK_ISSUER_URL'),
    KEYCLOAK_AUDIENCE: getRequiredString(config, 'KEYCLOAK_AUDIENCE'),
    KEYCLOAK_JWKS_URL: getOptionalString(config, 'KEYCLOAK_JWKS_URL'),
  };
}

