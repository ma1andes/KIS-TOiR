import { IsISO8601, IsNotEmpty, IsNumberString, IsString } from 'class-validator';

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
  @IsString({ message: 'status: должно быть строкой' })
  @IsNotEmpty({ message: 'status: обязательное поле' })
  status!: string;
  @IsString({ message: 'location: должно быть строкой' })
  location?: string;
  @IsISO8601({}, { message: 'commissionedAt: должно содержать корректную дату' })
  commissionedAt?: string;
  @IsNumberString({}, { message: 'totalEngineHours: должно быть числом' })
  totalEngineHours?: string;
  @IsNumberString({}, { message: 'engineHoursSinceLastRepair: должно быть числом' })
  engineHoursSinceLastRepair?: string;
  @IsISO8601({}, { message: 'lastRepairAt: должно содержать корректную дату' })
  lastRepairAt?: string;
  @IsString({ message: 'notes: должно быть строкой' })
  notes?: string;
}
