import { IsISO8601, IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';

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
  @IsString({ message: 'status: должно быть строкой' })
  status?: string;
  @IsOptional()
  @IsString({ message: 'location: должно быть строкой' })
  location?: string;
  @IsOptional()
  @IsISO8601({}, { message: 'commissionedAt: должно содержать корректную дату' })
  commissionedAt?: string;
  @IsOptional()
  @IsNumberString({}, { message: 'totalEngineHours: должно быть числом' })
  totalEngineHours?: string;
  @IsOptional()
  @IsNumberString({}, { message: 'engineHoursSinceLastRepair: должно быть числом' })
  engineHoursSinceLastRepair?: string;
  @IsOptional()
  @IsISO8601({}, { message: 'lastRepairAt: должно содержать корректную дату' })
  lastRepairAt?: string;
  @IsOptional()
  @IsString({ message: 'notes: должно быть строкой' })
  notes?: string;
}
