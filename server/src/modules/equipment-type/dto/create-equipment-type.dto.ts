export class CreateEquipmentTypeDto {
  code?: string;
  name!: string;
  manufacturer?: string;
  maintenanceIntervalHours?: number;
  overhaulIntervalHours?: number;
}
