export class UpdateEquipmentDto {
  id?: string;
  inventoryNumber?: string;
  serialNumber?: string;
  name?: string;
  equipmentTypeCode?: string;
  status?: string;
  location?: string;
  commissionedAt?: string;
  totalEngineHours?: string;
  engineHoursSinceLastRepair?: string;
  lastRepairAt?: string;
  notes?: string;
}
