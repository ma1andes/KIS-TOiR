import { IsISO8601, IsIn, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateRepairOrderDto {
  @IsOptional()
  @IsUUID(undefined, { message: 'id: должно быть UUID' })
  id?: string;
  @IsOptional()
  @IsString({ message: 'number: должно быть строкой' })
  number?: string;
  @IsOptional()
  @IsUUID(undefined, { message: 'equipmentId: должно быть UUID' })
  equipmentId?: string;
  @IsOptional()
  @IsIn(['TO', 'TR', 'TRE', 'KR', 'AR', 'MP'], { message: 'repairKind: недопустимое значение' })
  repairKind?: string;
  @IsOptional()
  @IsIn(['Draft', 'Approved', 'InWork', 'Done', 'Cancelled'], { message: 'status: недопустимое значение' })
  status?: string;
  @IsOptional()
  @IsISO8601({}, { message: 'plannedAt: должно содержать корректную дату' })
  plannedAt?: string;
  @IsOptional()
  @IsISO8601({}, { message: 'startedAt: должно содержать корректную дату' })
  startedAt?: string;
  @IsOptional()
  @IsISO8601({}, { message: 'completedAt: должно содержать корректную дату' })
  completedAt?: string;
  @IsOptional()
  @IsString({ message: 'contractor: должно быть строкой' })
  contractor?: string;
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'engineHoursAtRepair: должно быть числом' })
  engineHoursAtRepair?: number;
  @IsOptional()
  @IsString({ message: 'description: должно быть строкой' })
  description?: string;
  @IsOptional()
  @IsString({ message: 'notes: должно быть строкой' })
  notes?: string;
}
