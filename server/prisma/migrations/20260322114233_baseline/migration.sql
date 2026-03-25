-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('Active', 'Repair', 'Reserve', 'WriteOff');

-- CreateEnum
CREATE TYPE "RepairKind" AS ENUM ('TO', 'TR', 'TRE', 'KR', 'AR', 'MP');

-- CreateEnum
CREATE TYPE "RepairOrderStatus" AS ENUM ('Draft', 'Approved', 'InWork', 'Done', 'Cancelled');

-- CreateTable
CREATE TABLE "EquipmentType" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT,
    "maintenanceIntervalHours" INTEGER,
    "overhaulIntervalHours" INTEGER,

    CONSTRAINT "EquipmentType_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "inventoryNumber" TEXT NOT NULL,
    "serialNumber" TEXT,
    "name" TEXT NOT NULL,
    "equipmentTypeCode" TEXT NOT NULL,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'Active',
    "location" TEXT,
    "commissionedAt" TIMESTAMP(3),
    "totalEngineHours" DECIMAL(65,30),
    "engineHoursSinceLastRepair" DECIMAL(65,30),
    "lastRepairAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepairOrder" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "repairKind" "RepairKind" NOT NULL,
    "status" "RepairOrderStatus" NOT NULL DEFAULT 'Draft',
    "plannedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "contractor" TEXT,
    "engineHoursAtRepair" DECIMAL(65,30),
    "description" TEXT,
    "notes" TEXT,

    CONSTRAINT "RepairOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_inventoryNumber_key" ON "Equipment"("inventoryNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RepairOrder_number_key" ON "RepairOrder"("number");

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_equipmentTypeCode_fkey" FOREIGN KEY ("equipmentTypeCode") REFERENCES "EquipmentType"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairOrder" ADD CONSTRAINT "RepairOrder_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

