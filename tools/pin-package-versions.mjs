/**
 * Записывает в package.json точные версии прямых зависимостей из package-lock.json (lockfile v3).
 * Использование: node tools/pin-package-versions.mjs server
 *                node tools/pin-package-versions.mjs client
 */
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
if (!dir || !['server', 'client'].includes(dir)) {
  console.error('Usage: node tools/pin-package-versions.mjs <server|client>');
  process.exit(1);
}

const root = path.resolve(process.cwd(), dir);
const lockPath = path.join(root, 'package-lock.json');
const pkgPath = path.join(root, 'package.json');

if (!fs.existsSync(lockPath)) {
  console.error(`Missing ${lockPath}. Run npm install in ${dir}/ first.`);
  process.exit(1);
}

const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

function pinSection(section) {
  if (!section) return;
  for (const name of Object.keys(section)) {
    const lockKey = `node_modules/${name}`;
    const entry = lock.packages?.[lockKey];
    if (!entry?.version) {
      console.error(`Missing lock entry for ${lockKey}`);
      process.exit(1);
    }
    section[name] = entry.version;
  }
}

pinSection(pkg.dependencies);
pinSection(pkg.devDependencies);

fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
console.log(`Pinned ${dir}/package.json from package-lock.json`);
