import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateEquipmentTypeDto {
  @IsOptional()
  @IsString({ message: 'id: должно быть строкой' })
  id?: string;
  @IsOptional()
  @IsString({ message: 'code: должно быть строкой' })
  code?: string;
  @IsOptional()
  @IsString({ message: 'name: должно быть строкой' })
  name?: string;
  @IsOptional()
  @IsString({ message: 'manufacturer: должно быть строкой' })
  manufacturer?: string;
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'maintenanceIntervalHours: должно быть целым числом' })
  maintenanceIntervalHours?: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'overhaulIntervalHours: должно быть целым числом' })
  overhaulIntervalHours?: number;
}
