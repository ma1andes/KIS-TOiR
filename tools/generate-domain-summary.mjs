import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildDomainSummary } from './dsl-summary.mjs';

const rootDir = process.cwd();
const outputPath = path.join(rootDir, 'domain-summary.json');

mkdirSync(path.dirname(outputPath), { recursive: true });

const summary = buildDomainSummary(rootDir);
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

console.log(`Generated ${path.relative(rootDir, outputPath)}`);
