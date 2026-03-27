import { IsISO8601, IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';

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
  @IsString({ message: 'repairKind: должно быть строкой' })
  repairKind?: string;
  @IsOptional()
  @IsString({ message: 'status: должно быть строкой' })
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
  @IsNumberString({}, { message: 'engineHoursAtRepair: должно быть числом' })
  engineHoursAtRepair?: string;
  @IsOptional()
  @IsString({ message: 'description: должно быть строкой' })
  description?: string;
  @IsOptional()
  @IsString({ message: 'notes: должно быть строкой' })
  notes?: string;
}
