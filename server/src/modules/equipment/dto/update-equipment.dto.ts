import { IsISO8601, IsIn, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateEquipmentDto {
  @IsOptional()
  @IsUUID(undefined, { message: 'id: должно быть UUID' })
  id?: string;
  @IsOptional()
  @IsString({ message: 'inventoryNumber: должно быть строкой' })
  inventoryNumber?: string;
  @IsOptional()
  @IsString({ message: 'serialNumber: должно быть строкой' })
  serialNumber?: string;
  @IsOptional()
  @IsString({ message: 'name: должно быть строкой' })
  name?: string;
  @IsOptional()
  @IsString({ message: 'equipmentTypeCode: должно быть строкой' })
  equipmentTypeCode?: string;
  @IsOptional()
  @IsIn(['Active', 'Repair', 'Reserve', 'WriteOff'], { message: 'status: недопустимое значение' })
  status?: string;
  @IsOptional()
  @IsString({ message: 'location: должно быть строкой' })
  location?: string;
  @IsOptional()
  @IsISO8601({}, { message: 'commissionedAt: должно содержать корректную дату' })
  commissionedAt?: string;
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'totalEngineHours: должно быть числом' })
  totalEngineHours?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'engineHoursSinceLastRepair: должно быть числом' })
  engineHoursSinceLastRepair?: number;
  @IsOptional()
  @IsISO8601({}, { message: 'lastRepairAt: должно содержать корректную дату' })
  lastRepairAt?: string;
  @IsOptional()
  @IsString({ message: 'notes: должно быть строкой' })
  notes?: string;
}
