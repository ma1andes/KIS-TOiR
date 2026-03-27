import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEquipmentTypeDto {
  @IsString({ message: 'code: должно быть строкой' })
  @IsNotEmpty({ message: 'code: обязательное поле' })
  code?: string;
  @IsString({ message: 'name: должно быть строкой' })
  @IsNotEmpty({ message: 'name: обязательное поле' })
  name!: string;
  @IsString({ message: 'manufacturer: должно быть строкой' })
  manufacturer?: string;
  @Type(() => Number)
  @IsInt({ message: 'maintenanceIntervalHours: должно быть целым числом' })
  maintenanceIntervalHours?: number;
  @Type(() => Number)
  @IsInt({ message: 'overhaulIntervalHours: должно быть целым числом' })
  overhaulIntervalHours?: number;
}
