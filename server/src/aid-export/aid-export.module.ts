import { Module } from '@nestjs/common';
import { AidExportController } from './aid-export.controller';
import { AidExportService } from './aid-export.service';

@Module({
  controllers: [AidExportController],
  providers: [AidExportService],
})
export class AidExportModule {}
