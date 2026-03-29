import { IsISO8601, IsIn, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEquipmentDto {
  @IsString({ message: 'inventoryNumber: должно быть строкой' })
  @IsNotEmpty({ message: 'inventoryNumber: обязательное поле' })
  inventoryNumber!: string;
  @IsString({ message: 'serialNumber: должно быть строкой' })
  serialNumber?: string;
  @IsString({ message: 'name: должно быть строкой' })
  @IsNotEmpty({ message: 'name: обязательное поле' })
  name!: string;
  @IsString({ message: 'equipmentTypeCode: должно быть строкой' })
  @IsNotEmpty({ message: 'equipmentTypeCode: обязательное поле' })
  equipmentTypeCode!: string;
  @IsIn(['Active', 'Repair', 'Reserve', 'WriteOff'], { message: 'status: недопустимое значение' })
  @IsNotEmpty({ message: 'status: обязательное поле' })
  status!: string;
  @IsString({ message: 'location: должно быть строкой' })
  location?: string;
  @IsISO8601({}, { message: 'commissionedAt: должно содержать корректную дату' })
  commissionedAt?: string;
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'totalEngineHours: должно быть числом' })
  totalEngineHours?: number;
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'engineHoursSinceLastRepair: должно быть числом' })
  engineHoursSinceLastRepair?: number;
  @IsISO8601({}, { message: 'lastRepairAt: должно содержать корректную дату' })
  lastRepairAt?: string;
  @IsString({ message: 'notes: должно быть строкой' })
  notes?: string;
}
