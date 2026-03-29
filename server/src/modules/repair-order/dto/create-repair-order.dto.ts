import { IsISO8601, IsIn, IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRepairOrderDto {
  @IsString({ message: 'number: должно быть строкой' })
  @IsNotEmpty({ message: 'number: обязательное поле' })
  number!: string;
  @IsUUID(undefined, { message: 'equipmentId: должно быть UUID' })
  @IsNotEmpty({ message: 'equipmentId: обязательное поле' })
  equipmentId!: string;
  @IsIn(['TO', 'TR', 'TRE', 'KR', 'AR', 'MP'], { message: 'repairKind: недопустимое значение' })
  @IsNotEmpty({ message: 'repairKind: обязательное поле' })
  repairKind!: string;
  @IsIn(['Draft', 'Approved', 'InWork', 'Done', 'Cancelled'], { message: 'status: недопустимое значение' })
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
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'engineHoursAtRepair: должно быть числом' })
  engineHoursAtRepair?: number;
  @IsString({ message: 'description: должно быть строкой' })
  description?: string;
  @IsString({ message: 'notes: должно быть строкой' })
  notes?: string;
}
