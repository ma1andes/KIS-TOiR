import { IsISO8601, IsNotEmpty, IsNumberString, IsString, IsUUID } from 'class-validator';

export class CreateRepairOrderDto {
  @IsString({ message: 'number: должно быть строкой' })
  @IsNotEmpty({ message: 'number: обязательное поле' })
  number!: string;
  @IsUUID(undefined, { message: 'equipmentId: должно быть UUID' })
  @IsNotEmpty({ message: 'equipmentId: обязательное поле' })
  equipmentId!: string;
  @IsString({ message: 'repairKind: должно быть строкой' })
  @IsNotEmpty({ message: 'repairKind: обязательное поле' })
  repairKind!: string;
  @IsString({ message: 'status: должно быть строкой' })
  @IsNotEmpty({ message: 'status: обязательное поле' })
  status!: string;
  @IsISO8601({}, { message: 'plannedAt: должно содержать корректную дату' })
  @IsNotEmpty({ message: 'plannedAt: обязательное поле' })
  plannedAt!: string;
  @IsISO8601({}, { message: 'startedAt: должно содержать корректную дату' })
  startedAt?: string;
  @IsISO8601({}, { message: 'completedAt: должно содержать корректную дату' })
  completedAt?: string;
  @IsString({ message: 'contractor: должно быть строкой' })
  contractor?: string;
  @IsNumberString({}, { message: 'engineHoursAtRepair: должно быть числом' })
  engineHoursAtRepair?: string;
  @IsString({ message: 'description: должно быть строкой' })
  description?: string;
  @IsString({ message: 'notes: должно быть строкой' })
  notes?: string;
}
