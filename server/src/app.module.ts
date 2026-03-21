import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { validateEnvironment } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { EquipmentTypeModule } from './modules/equipment-type/equipment-type.module';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { RepairOrderModule } from './modules/repair-order/repair-order.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    AuthModule,
    PrismaModule,
    HealthModule,
    EquipmentTypeModule,
    EquipmentModule,
    RepairOrderModule,
  ],
})
export class AppModule {}
