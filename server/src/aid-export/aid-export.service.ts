import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { execFile } from 'child_process';
import { access, readFile, unlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const LARGE_BUFFER = 64 * 1024 * 1024;

export type OpenApiExportMode = 'deterministic' | 'llm';

export type AppGeneratorBundle = {
  entityCount: number;
  enumCount: number;
  files: Record<string, string>;
};

@Injectable()
export class AidExportService {
  /**
   * Путь к tools/api-format-to-openapi/convert.mjs относительно cwd процесса (обычно каталог server/).
   */
  private resolveConvertScript(): string {
    return join(process.cwd(), '..', 'tools', 'api-format-to-openapi', 'convert.mjs');
  }

  /** Путь к generation/generate.mjs относительно cwd = server/. */
  private resolveGenerateScript(): string {
    return join(process.cwd(), '..', 'generation', 'generate.mjs');
  }

  async convertApiFormatToOpenApi(
    apiFormat: unknown,
    mode: OpenApiExportMode,
  ): Promise<Record<string, unknown>> {
    const script = this.resolveConvertScript();
    try {
      await access(script);
    } catch {
      throw new InternalServerErrorException(
        `Converter script not found at ${script}. Run the server with cwd = server/ from repo root.`,
      );
    }

    const id = randomUUID();
    const inPath = join(tmpdir(), `api-format-${id}.json`);
    const outPath = join(tmpdir(), `openapi-${id}.json`);

    try {
      await writeFile(inPath, JSON.stringify(apiFormat), 'utf8');
      const { stderr } = await execFileAsync(
        process.execPath,
        [script, '--in', inPath, '--out', outPath, '--mode', mode],
        {
          env: { ...process.env },
          maxBuffer: 16 * 1024 * 1024,
        },
      );
      if (stderr?.trim()) {
        // convert.mjs пишет ошибки в stderr при падении; при успехе обычно пусто
        console.warn('[aid-export]', stderr);
      }
      const raw = await readFile(outPath, 'utf8');
      return JSON.parse(raw) as Record<string, unknown>;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new InternalServerErrorException(`OpenAPI conversion failed: ${msg}`);
    } finally {
      await unlink(inPath).catch(() => undefined);
      await unlink(outPath).catch(() => undefined);
    }
  }

  /**
   * DSL → снимок сгенерированных файлов (без записи в репозиторий).
   * Использует `generation/generate.mjs --print-bundle-json`.
   */
  async generateAppBundle(dsl: string): Promise<AppGeneratorBundle> {
    const script = this.resolveGenerateScript();
    try {
      await access(script);
    } catch {
      throw new InternalServerErrorException(
        `Generator script not found at ${script}. Run the server with cwd = server/ from repo root.`,
      );
    }

    const id = randomUUID();
    const dslPath = join(tmpdir(), `domain-${id}.dsl`);

    try {
      await writeFile(dslPath, dsl, 'utf8');
      const { stdout, stderr } = await execFileAsync(
        process.execPath,
        [script, '--print-bundle-json', '--dsl', dslPath],
        {
          env: { ...process.env },
          maxBuffer: LARGE_BUFFER,
        },
      );
      if (stderr?.trim()) console.warn('[aid-export][generate]', stderr);
      const bundle = JSON.parse(stdout) as AppGeneratorBundle;
      if (!bundle.files || typeof bundle.files !== 'object') {
        throw new Error('Invalid bundle: missing files');
      }
      return bundle;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new InternalServerErrorException(`App generator (bundle) failed: ${msg}`);
    } finally {
      await unlink(dslPath).catch(() => undefined);
    }
  }

  /**
   * DSL → запись сгенерированного кода в рабочую копию репозитория (`--apply`).
   * Опасно для публичных эндпоинтов; включать только осознанно.
   */
  async generateAppApply(dsl: string): Promise<{ message: string }> {
    const script = this.resolveGenerateScript();
    try {
      await access(script);
    } catch {
      throw new InternalServerErrorException(
        `Generator script not found at ${script}. Run the server with cwd = server/ from repo root.`,
      );
    }

    const id = randomUUID();
    const dslPath = join(tmpdir(), `domain-${id}.dsl`);

    try {
      await writeFile(dslPath, dsl, 'utf8');
      const { stdout, stderr } = await execFileAsync(
        process.execPath,
        [script, '--apply', '--dsl', dslPath],
        {
          env: { ...process.env },
          maxBuffer: LARGE_BUFFER,
        },
      );
      if (stderr?.trim()) console.warn('[aid-export][generate-apply]', stderr);
      return { message: (stdout || 'ok').trim() };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new InternalServerErrorException(`App generator (apply) failed: ${msg}`);
    } finally {
      await unlink(dslPath).catch(() => undefined);
    }
  }
}
