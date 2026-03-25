import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Headers,
  HttpCode,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AidExportService, OpenApiExportMode } from './aid-export.service';

/**
 * HTTP-экспортёры для AID: OpenAPI из api-format и генерация приложения из DSL.
 */
@Controller('aid/export')
export class AidExportController {
  constructor(
    private readonly aidExport: AidExportService,
    private readonly config: ConfigService,
  ) {}

  private assertExportKey(exportKey: string | undefined) {
    const requiredKey = this.config.get<string>('AID_EXPORT_API_KEY');
    if (requiredKey && exportKey !== requiredKey) {
      throw new UnauthorizedException('Invalid or missing X-AID-Export-Key');
    }
  }

  /**
   * POST /aid/export/openapi
   * Body: { "apiFormat": <объект api-format>, "mode"?: "deterministic" | "llm" }
   * Response: { "openapi": <OpenAPI 3.0.3 document> }
   *
   * mode=llm требует OPENAI_API_KEY в окружении сервера.
   *
   * Если задан AID_EXPORT_API_KEY, клиент должен передать заголовок X-AID-Export-Key с тем же значением.
   */
  @Post('openapi')
  @HttpCode(200)
  async exportOpenApi(
    @Body()
    body: { apiFormat?: unknown; mode?: string },
    @Headers('x-aid-export-key') exportKey?: string,
  ) {
    this.assertExportKey(exportKey);

    if (body == null || typeof body !== 'object' || body.apiFormat == null) {
      throw new BadRequestException('Body must be a JSON object with an "apiFormat" property');
    }
    if (typeof body.apiFormat !== 'object' || Array.isArray(body.apiFormat)) {
      throw new BadRequestException('"apiFormat" must be a JSON object');
    }

    const mode: OpenApiExportMode =
      body.mode === 'llm' ? 'llm' : 'deterministic';

    const openapi = await this.aidExport.convertApiFormatToOpenApi(
      body.apiFormat,
      mode,
    );
    return { openapi };
  }

  /**
   * POST /aid/export/app
   * Body: { "dsl": "<текст DSL как в examples/TOiR.domain.dsl>", "apply"?: boolean }
   *
   * По умолчанию `apply: false` — возвращается JSON с полем `files` (пути относительно корня репо → содержимое),
   * без записи на диск (безопасно для вызова из AID).
   *
   * `apply: true` перезаписывает файлы в **текущей** рабочей копии репозитория на машине, где крутится Nest.
   * Разрешено только если в окружении задано `AID_GENERATOR_ALLOW_APPLY=1` (или `true`).
   */
  @Post('app')
  @HttpCode(200)
  async exportApp(
    @Body()
    body: { dsl?: string; apply?: boolean },
    @Headers('x-aid-export-key') exportKey?: string,
  ) {
    this.assertExportKey(exportKey);

    if (body == null || typeof body !== 'object') {
      throw new BadRequestException('Body must be a JSON object');
    }
    if (typeof body.dsl !== 'string' || !body.dsl.trim()) {
      throw new BadRequestException('Body must include a non-empty string "dsl"');
    }

    const apply = body.apply === true;
    if (apply) {
      const allow = this.config.get<string>('AID_GENERATOR_ALLOW_APPLY');
      if (allow !== '1' && allow !== 'true') {
        throw new ForbiddenException(
          'apply=true is disabled. Set AID_GENERATOR_ALLOW_APPLY=1 on the server to allow writing generated files to disk.',
        );
      }
      const { message } = await this.aidExport.generateAppApply(body.dsl);
      return { applied: true, message };
    }

    const bundle = await this.aidExport.generateAppBundle(body.dsl);
    return {
      applied: false,
      entityCount: bundle.entityCount,
      enumCount: bundle.enumCount,
      files: bundle.files,
    };
  }
}
