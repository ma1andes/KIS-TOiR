export class CreateRepairOrderDto {
  number!: string;
  equipmentId!: string;
  repairKind!: string;
  status!: string;
  plannedAt!: string;
  startedAt?: string;
  completedAt?: string;
  contractor?: string;
  engineHoursAtRepair?: string;
  description?: string;
  notes?: string;
}
