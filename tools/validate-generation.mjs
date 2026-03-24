import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  buildDomainSummary,
  getDslFiles,
  parseDslFiles,
  parseOverrides,
} from './dsl-summary.mjs';

const rootDir = process.cwd();
const args = new Set(process.argv.slice(2));
const artifactsOnly = args.has('--artifacts-only');
const runRuntime = args.has('--run-runtime');

const failures = [];
const warnings = [];

function assertCondition(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

function warn(message) {
  warnings.push(message);
}

function read(relativePath) {
  return readFileSync(path.join(rootDir, relativePath), 'utf8');
}

function readIfExists(relativePath) {
  const filePath = path.join(rootDir, relativePath);
  if (!existsSync(filePath)) {
    return null;
  }

  return readFileSync(filePath, 'utf8');
}

function requireFile(relativePath) {
  assertCondition(existsSync(path.join(rootDir, relativePath)), `Missing file: ${relativePath}`);
}

function requireFiles(relativePaths) {
  relativePaths.forEach(requireFile);
}

function requireContent(relativePath, pattern, message) {
  const contents = readIfExists(relativePath);
  assertCondition(Boolean(contents), `Missing file: ${relativePath}`);
  if (!contents) {
    return;
  }

  assertCondition(pattern.test(contents), `${message} (${relativePath})`);
}

function parseJson(relativePath) {
  const raw = readIfExists(relativePath);
  if (!raw) {
    failures.push(`Missing file: ${relativePath}`);
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    failures.push(`Invalid JSON in ${relativePath}: ${error.message}`);
    return null;
  }
}

function kebabCase(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

function getRealmArtifactPath() {
  const rootFiles = readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);

  const realmArtifacts = rootFiles.filter((entry) => /-realm\.json$/i.test(entry));
  assertCondition(realmArtifacts.length === 1, 'Expected exactly one root-level *-realm.json artifact');

  return realmArtifacts[0] ?? null;
}

function getWorkspaceInfo() {
  return {
    server: {
      dir: path.join(rootDir, 'server'),
      packagePath: 'server/package.json',
      scaffoldFiles: [
        'server/package.json',
        'server/tsconfig.json',
        'server/tsconfig.build.json',
        'server/nest-cli.json',
        'server/src/main.ts',
        'server/src/app.module.ts',
      ],
    },
    client: {
      dir: path.join(rootDir, 'client'),
      packagePath: 'client/package.json',
      scaffoldFiles: [
        'client/package.json',
        'client/index.html',
        'client/tsconfig.json',
        'client/tsconfig.node.json',
        'client/vite.config.ts',
        'client/src/main.tsx',
        'client/src/vite-env.d.ts',
      ],
    },
  };
}

function validateBuildChecks() {
  requireFiles([
    'README.md',
    'package.json',
    'domain/dsl-spec.md',
    'domain-summary.json',
    'server/prisma/schema.prisma',
    'server/.env.example',
    'client/.env.example',
    'prompts/general-prompt.md',
    'prompts/auth-rules.md',
    'prompts/backend-rules.md',
    'prompts/frontend-rules.md',
    'prompts/runtime-rules.md',
    'prompts/validation-rules.md',
  ]);

  const dslFiles = getDslFiles(rootDir).map((filePath) => path.relative(rootDir, filePath).replaceAll('\\', '/'));
  assertCondition(dslFiles.length > 0, 'Expected at least one domain/*.dsl file');

  const actualSummaryRaw = readIfExists('domain-summary.json');
  if (actualSummaryRaw) {
    const expectedSummary = JSON.stringify(buildDomainSummary(rootDir), null, 2);
    assertCondition(
      actualSummaryRaw.trim() === expectedSummary,
      'domain-summary.json is out of date. Run `npm run generate:domain-summary`.',
    );
  }

  try {
    const { entities } = parseDslFiles(rootDir);
    parseOverrides(rootDir, entities);
  } catch (error) {
    failures.push(`Override validation failed: ${error.message}`);
  }

  const { server, client } = getWorkspaceInfo();
  requireFiles(server.scaffoldFiles);
  requireFiles(client.scaffoldFiles);

  const serverPackage = parseJson(server.packagePath);
  if (serverPackage) {
    assertCondition(serverPackage.scripts?.build === 'nest build', 'server/package.json must keep `build = nest build`');
    assertCondition(serverPackage.scripts?.start === 'nest start', 'server/package.json must keep `start = nest start`');
    assertCondition(serverPackage.scripts?.['start:dev'] === 'nest start --watch', 'server/package.json must keep `start:dev = nest start --watch`');
    assertCondition(Boolean(serverPackage.scripts?.['start:prod']), 'server/package.json must define a start:prod script');
    assertCondition(Boolean(serverPackage.dependencies?.['@nestjs/core']), 'server/package.json must keep Nest runtime dependencies');
  }

  const clientPackage = parseJson(client.packagePath);
  if (clientPackage) {
    assertCondition(clientPackage.scripts?.dev === 'vite', 'client/package.json must keep `dev = vite`');
    assertCondition(clientPackage.scripts?.build === 'vite build', 'client/package.json must keep `build = vite build`');
    assertCondition(clientPackage.scripts?.preview === 'vite preview', 'client/package.json must keep `preview = vite preview`');
    assertCondition(Boolean(clientPackage.devDependencies?.vite), 'client/package.json must keep Vite as a dev dependency');
    assertCondition(Boolean(clientPackage.devDependencies?.['@vitejs/plugin-react']), 'client/package.json must keep @vitejs/plugin-react as a dev dependency');
  }
}

function validateAuthChecks() {
  requireFiles([
    'client/src/auth/keycloak.ts',
    'client/src/auth/authProvider.ts',
    'client/src/dataProvider.ts',
    'client/src/config/env.ts',
    'client/src/main.tsx',
    'client/src/App.tsx',
    'server/src/auth/auth.module.ts',
    'server/src/auth/auth.service.ts',
    'server/src/auth/guards/jwt-auth.guard.ts',
    'server/src/auth/guards/roles.guard.ts',
    'server/src/auth/decorators/public.decorator.ts',
    'server/src/auth/decorators/roles.decorator.ts',
  ]);

  requireContent(
    'client/src/auth/keycloak.ts',
    /onLoad:\s*'login-required'/,
    'Frontend auth must initialize Keycloak with login-required',
  );
  requireContent(
    'client/src/auth/keycloak.ts',
    /pkceMethod:\s*'S256'/,
    'Frontend auth must use PKCE S256',
  );
  requireContent(
    'client/src/auth/keycloak.ts',
    /updateToken\(/,
    'Frontend auth must refresh access tokens through the Keycloak adapter',
  );

  const keycloakSource = readIfExists('client/src/auth/keycloak.ts') ?? '';
  assertCondition(
    !/loadUserProfile\(/.test(keycloakSource),
    'Frontend auth must not call keycloak.loadUserProfile()',
  );

  requireContent(
    'client/src/dataProvider.ts',
    /Authorization', `Bearer \$\{token\}`/,
    'dataProvider must attach bearer tokens in the shared request seam',
  );

  const authProvider = readIfExists('client/src/auth/authProvider.ts') ?? '';
  assertCondition(
    /status === 401/.test(authProvider) && /status === 403/.test(authProvider),
    'authProvider must distinguish 401 and 403 semantics',
  );

  const authService = readIfExists('server/src/auth/auth.service.ts') ?? '';
  assertCondition(
    /jwtVerify/.test(authService) && /KEYCLOAK_ISSUER_URL/.test(authService) && /KEYCLOAK_AUDIENCE/.test(authService),
    'Backend auth must verify JWTs with issuer and audience',
  );
  assertCondition(/realm_access/.test(authService), 'Backend auth must extract roles from realm_access.roles');
  assertCondition(/KEYCLOAK_JWKS_URL/.test(authService), 'Backend auth must support explicit KEYCLOAK_JWKS_URL');
  assertCondition(/\.well-known\/openid-configuration/.test(authService), 'Backend auth must try OIDC discovery before fallback certs');
  assertCondition(/protocol\/openid-connect\/certs/.test(authService), 'Backend auth must keep Keycloak certs fallback resolution');
}

function validateNaturalKeyChecks() {
  const summary = parseJson('domain-summary.json');
  if (!summary) {
    return;
  }

  const naturalKeyEntities = summary.entities.filter((entity) => entity.primaryKey !== 'id');

  for (const entity of naturalKeyEntities) {
    const moduleName = kebabCase(entity.name);
    const controllerPath = `server/src/modules/${moduleName}/${moduleName}.controller.ts`;
    const servicePath = `server/src/modules/${moduleName}/${moduleName}.service.ts`;
    const controller = readIfExists(controllerPath) ?? '';
    const service = readIfExists(servicePath) ?? '';

    assertCondition(Boolean(controller), `Missing file: ${controllerPath}`);
    assertCondition(Boolean(service), `Missing file: ${servicePath}`);
    if (!controller || !service) {
      continue;
    }

    assertCondition(
      controller.includes(`@Get(':${entity.primaryKey}')`) &&
        controller.includes(`@Patch(':${entity.primaryKey}')`) &&
        controller.includes(`@Delete(':${entity.primaryKey}')`),
      `${entity.name} controller must use :${entity.primaryKey} route params`,
    );

    assertCondition(
      service.includes(`id: item.${entity.primaryKey}`) || service.includes(`id: record.${entity.primaryKey}`),
      `${entity.name} service must map the natural key to React Admin id`,
    );

    assertCondition(
      service.includes(`const { id, ${entity.primaryKey}: _pk`) || service.includes(`const { id: _pk, ${entity.primaryKey}`),
      `${entity.name} update path must sanitize id and primary key from Prisma update data`,
    );

    assertCondition(
      /sortField\s*===\s*'id'/.test(service) || /sortField\s*===\s*"id"/.test(service),
      `${entity.name} natural-key sort must map React Admin id sorting back to the real primary key`,
    );
    assertCondition(
      !service.includes("query._sort || 'id'"),
      `${entity.name} natural-key sort must not fall back to the physical id field`,
    );
  }
}

function validateRealmChecks() {
  const realmArtifactName = getRealmArtifactPath();
  if (!realmArtifactName) {
    return;
  }

  const artifact = parseJson(realmArtifactName);
  if (!artifact) {
    return;
  }

  const realmRoles = artifact.roles?.realm?.map((role) => role.name) ?? [];
  const frontendClient = artifact.clients?.find((client) => client.clientId?.endsWith('-frontend'));
  const backendClient = artifact.clients?.find((client) => client.clientId?.endsWith('-backend'));
  const audienceScope = artifact.clientScopes?.find((scope) => scope.name === 'api-audience');

  ['admin', 'editor', 'viewer'].forEach((role) => {
    assertCondition(realmRoles.includes(role), `Realm artifact must define realm role ${role}`);
  });

  assertCondition(Boolean(frontendClient), 'Realm artifact must define the frontend SPA client');
  assertCondition(Boolean(backendClient), 'Realm artifact must define the backend resource client');
  assertCondition(Boolean(audienceScope), 'Realm artifact must define the api-audience client scope');

  if (frontendClient) {
    assertCondition(frontendClient.publicClient === true, 'Frontend realm client must be public');
    assertCondition(
      frontendClient.standardFlowEnabled === true &&
        frontendClient.implicitFlowEnabled === false &&
        frontendClient.directAccessGrantsEnabled === false,
      'Frontend realm client must use standard flow only',
    );
    assertCondition(
      frontendClient.attributes?.['pkce.code.challenge.method'] === 'S256',
      'Frontend realm client must enforce PKCE S256',
    );

    const mapperNames = new Set((frontendClient.protocolMappers ?? []).map((mapper) => mapper.name));
    ['sub', 'preferred_username', 'email', 'name', 'realm roles'].forEach((mapperName) => {
      assertCondition(mapperNames.has(mapperName), `Frontend realm client must include protocol mapper ${mapperName}`);
    });
  }

  if (backendClient && audienceScope) {
    const audienceMapper = (audienceScope.protocolMappers ?? []).find(
      (mapper) => mapper.protocolMapper === 'oidc-audience-mapper',
    );
    assertCondition(Boolean(audienceMapper), 'api-audience scope must include an audience mapper');
    assertCondition(
      audienceMapper?.config?.['included.client.audience'] === backendClient.clientId,
      'api-audience scope must deliver the backend audience/client id',
    );
    assertCondition(backendClient.bearerOnly === true, 'Backend realm client must be bearer-only');
  }
}

function validateRuntimeContractChecks() {
  requireFile('docker-compose.yml');
  const compose = readIfExists('docker-compose.yml') ?? '';
  assertCondition(/image:\s*postgres:16/.test(compose), 'docker-compose must provision postgres:16');
  assertCondition(!/keycloak/i.test(compose), 'docker-compose must remain PostgreSQL-only');

  const serverEnvExample = readIfExists('server/.env.example') ?? '';
  assertCondition(
    /KEYCLOAK_ISSUER_URL="https:\/\/sso\.greact\.ru\/realms\/toir"/.test(serverEnvExample),
    'server/.env.example must keep the working Keycloak issuer example',
  );
  assertCondition(
    /KEYCLOAK_AUDIENCE="?toir-backend"?/.test(serverEnvExample),
    'server/.env.example must keep the working backend audience example',
  );
  assertCondition(
    /CORS_ALLOWED_ORIGINS="http:\/\/localhost:5173,https:\/\/toir-frontend\.greact\.ru"/.test(serverEnvExample),
    'server/.env.example must keep the working CORS example with the production frontend domain',
  );
  assertCondition(
    !/KEYCLOAK_ISSUER_URL=http:\/\/localhost:8080\/realms\/toir/.test(serverEnvExample),
    'server/.env.example must not regress to localhost Keycloak as the baseline issuer example',
  );

  const clientEnvExample = readIfExists('client/.env.example') ?? '';
  assertCondition(
    /VITE_KEYCLOAK_URL=https:\/\/sso\.greact\.ru/.test(clientEnvExample),
    'client/.env.example must keep the working domain-based Keycloak URL example',
  );
  assertCondition(
    /VITE_KEYCLOAK_REALM=toir/.test(clientEnvExample) && /VITE_KEYCLOAK_CLIENT_ID=toir-frontend/.test(clientEnvExample),
    'client/.env.example must keep the working realm and frontend client examples',
  );
  assertCondition(
    !/VITE_KEYCLOAK_URL=http:\/\/localhost:8080/.test(clientEnvExample),
    'client/.env.example must not regress to localhost Keycloak as the baseline example',
  );

  const healthController = readIfExists('server/src/health/health.controller.ts') ?? '';
  assertCondition(Boolean(healthController), 'Missing file: server/src/health/health.controller.ts');
  if (healthController) {
    assertCondition(
      /@Public\(\)/.test(healthController) && /@Controller\('health'\)/.test(healthController),
      '/health must stay public',
    );
  }
}

function runCommand(command, commandArgs, workdir, failureLabel) {
  const runtimeEnv = { ...process.env };
  const envExamplePath = path.join(workdir, '.env.example');
  if (existsSync(envExamplePath)) {
    const envExample = readFileSync(envExamplePath, 'utf8');
    for (const line of envExample.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const separator = trimmed.indexOf('=');
      if (separator <= 0) {
        continue;
      }

      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim().replace(/^"|"$/g, '');
      if (!(key in runtimeEnv)) {
        runtimeEnv[key] = value;
      }
    }
  }

  const commandLine = [command, ...commandArgs].join(' ');
  const result = spawnSync(commandLine, {
    cwd: workdir,
    encoding: 'utf8',
    stdio: 'pipe',
    shell: true,
    env: runtimeEnv,
  });

  if (result.error) {
    failures.push(`${failureLabel}: ${commandLine}\n${result.error.message}`);
    return false;
  }

  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    const stdout = result.stdout?.trim();
    failures.push(
      `${failureLabel}: ${commandLine}${stderr ? `\n${stderr}` : stdout ? `\n${stdout}` : ''}`,
    );
    return false;
  }

  return true;
}

function maybeValidateWorkspaceBuild(relativeDir) {
  const workspaceDir = path.join(rootDir, relativeDir);
  if (!existsSync(path.join(workspaceDir, 'package.json'))) {
    failures.push(`Missing file: ${relativeDir}/package.json`);
    return;
  }

  if (!existsSync(path.join(workspaceDir, 'node_modules'))) {
    warn(`Skipped build verification for ${relativeDir}: install dependencies in ${relativeDir}/ to validate workspace buildability.`);
    return;
  }

  runCommand('npm', ['run', 'build'], workspaceDir, `Build verification failed in ${relativeDir}`);
}

function validateBuildExecutionChecks() {
  maybeValidateWorkspaceBuild('server');
  maybeValidateWorkspaceBuild('client');
}

function validateRuntimeExecutionChecks() {
  const serverDir = path.join(rootDir, 'server');
  if (!existsSync(path.join(serverDir, 'node_modules'))) {
    failures.push(
      'Runtime validation requires installed backend dependencies. Run `npm install` in server/ before `npm run validate:generation:runtime`.',
    );
    return;
  }

  runCommand('npx', ['prisma', 'generate'], serverDir, 'Prisma generate failed');
  runCommand(
    'npx',
    ['prisma', 'migrate', 'dev', '--name', 'baseline', '--skip-generate'],
    serverDir,
    'Prisma migrate failed',
  );
  runCommand('npx', ['prisma', 'db', 'seed'], serverDir, 'Prisma seed failed');
}

validateBuildChecks();
validateAuthChecks();
validateNaturalKeyChecks();
validateRealmChecks();
validateRuntimeContractChecks();

if (!artifactsOnly) {
  validateBuildExecutionChecks();
}

if (!artifactsOnly && runRuntime) {
  validateRuntimeExecutionChecks();
} else if (!artifactsOnly) {
  warn('Runtime command execution skipped. Use --run-runtime after installing dependencies and starting the local database.');
}

for (const warning of warnings) {
  console.warn(`WARN: ${warning}`);
}

if (failures.length > 0) {
  console.error('Generation validation failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Generation validation passed.');
