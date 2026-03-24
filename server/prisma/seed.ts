import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const equipmentTypes = [
    {
      code: 'pump',
      name: 'Насосный агрегат',
      manufacturer: 'АО НасосПром',
      maintenanceIntervalHours: 2000,
      overhaulIntervalHours: 16000,
    },
    {
      code: 'compressor',
      name: 'Компрессорная установка',
      manufacturer: 'ОАО Компрессормаш',
      maintenanceIntervalHours: 1500,
      overhaulIntervalHours: 12000,
    },
    {
      code: 'generator',
      name: 'Дизель-генератор',
      manufacturer: 'АО ЭнергоМаш',
      maintenanceIntervalHours: 500,
      overhaulIntervalHours: 6000,
    },
    {
      code: 'valve',
      name: 'Запорная арматура',
      manufacturer: 'ЗАО АрматурПром',
      maintenanceIntervalHours: 1000,
      overhaulIntervalHours: 10000,
    },
    {
      code: 'sensor',
      name: 'Датчик давления',
      manufacturer: 'ООО ПриборСервис',
      maintenanceIntervalHours: 800,
      overhaulIntervalHours: 8000,
    },
    {
      code: 'motor',
      name: 'Электродвигатель',
      manufacturer: 'ПАО ЭлектроМотор',
      maintenanceIntervalHours: 1200,
      overhaulIntervalHours: 14000,
    },
    {
      code: 'fan',
      name: 'Вентилятор',
      manufacturer: 'АО ВентПром',
      maintenanceIntervalHours: 700,
      overhaulIntervalHours: 9000,
    },
    {
      code: 'heat-exchanger',
      name: 'Теплообменник',
      manufacturer: 'ОАО ТеплоТех',
      maintenanceIntervalHours: 1800,
      overhaulIntervalHours: 15000,
    },
    {
      code: 'filter',
      name: 'Фильтровальная установка',
      manufacturer: 'ООО ФильтрТех',
      maintenanceIntervalHours: 600,
      overhaulIntervalHours: 7000,
    },
    {
      code: 'separator',
      name: 'Сепаратор',
      manufacturer: 'АО СепараторМаш',
      maintenanceIntervalHours: 1600,
      overhaulIntervalHours: 13000,
    },
    {
      code: 'transformer',
      name: 'Трансформатор',
      manufacturer: 'ПАО ТрансЭнерго',
      maintenanceIntervalHours: 2500,
      overhaulIntervalHours: 20000,
    },
  ] as const;

  for (const type of equipmentTypes) {
    await prisma.equipmentType.upsert({
      where: { code: type.code },
      update: { ...type },
      create: { ...type },
    });
  }

  const equipmentRecords: { id: string; inventoryNumber: string; name: string }[] = [];
  for (let i = 1; i <= 11; i++) {
    const type = equipmentTypes[(i - 1) % equipmentTypes.length];
    const inventoryNumber = `INV-${String(i).padStart(3, '0')}`;
    const serialNumber = `SN-2026-${String(i).padStart(4, '0')}`;
    const record = await prisma.equipment.upsert({
      where: { inventoryNumber },
      update: {
        serialNumber,
        name: `${type.name} #${i}`,
        equipmentTypeCode: type.code,
        status: i % 5 === 0 ? 'Repair' : 'Active',
        location: i % 2 === 0 ? `Площадка ${Math.ceil(i / 2)}` : `Цех ${Math.ceil(i / 3)}`,
        commissionedAt: new Date(2022, (i - 1) % 12, 1 + ((i - 1) % 28)),
        totalEngineHours: 1000 + i * 350,
        engineHoursSinceLastRepair: 200 + i * 25,
      },
      create: {
        inventoryNumber,
        serialNumber,
        name: `${type.name} #${i}`,
        equipmentTypeCode: type.code,
        status: i % 5 === 0 ? 'Repair' : 'Active',
        location: i % 2 === 0 ? `Площадка ${Math.ceil(i / 2)}` : `Цех ${Math.ceil(i / 3)}`,
        commissionedAt: new Date(2022, (i - 1) % 12, 1 + ((i - 1) % 28)),
        totalEngineHours: 1000 + i * 350,
        engineHoursSinceLastRepair: 200 + i * 25,
      },
    });
    equipmentRecords.push({ id: record.id, inventoryNumber: record.inventoryNumber, name: record.name });
  }

  const repairKinds = ['TO', 'TR', 'TRE', 'KR', 'AR', 'MP'] as const;
  const statuses = ['Draft', 'Approved', 'InWork', 'Done', 'Cancelled'] as const;

  for (let i = 1; i <= 11; i++) {
    const number = `RO-2026-${String(i).padStart(3, '0')}`;
    const equipment = equipmentRecords[(i - 1) % equipmentRecords.length];
    await prisma.repairOrder.upsert({
      where: { number },
      update: {
        equipmentId: equipment.id,
        repairKind: repairKinds[(i - 1) % repairKinds.length],
        status: statuses[(i - 1) % statuses.length],
        plannedAt: new Date(2026, ((i - 1) % 12), 1 + ((i - 1) % 28)),
        startedAt: i % 4 === 0 ? new Date(2026, ((i - 1) % 12), 2 + ((i - 1) % 28)) : null,
        completedAt: i % 5 === 0 ? new Date(2026, ((i - 1) % 12), 5 + ((i - 1) % 28)) : null,
        contractor: i % 3 === 0 ? 'ООО СервисРемонт' : 'АО ТехПодряд',
        engineHoursAtRepair: 1000 + i * 350,
        description: `Заявка на ремонт ${equipment.inventoryNumber} (${equipment.name})`,
        notes: i % 2 === 0 ? 'Тестовая заметка' : null,
      },
      create: {
        number,
        equipmentId: equipment.id,
        repairKind: repairKinds[(i - 1) % repairKinds.length],
        status: statuses[(i - 1) % statuses.length],
        plannedAt: new Date(2026, ((i - 1) % 12), 1 + ((i - 1) % 28)),
        startedAt: i % 4 === 0 ? new Date(2026, ((i - 1) % 12), 2 + ((i - 1) % 28)) : null,
        completedAt: i % 5 === 0 ? new Date(2026, ((i - 1) % 12), 5 + ((i - 1) % 28)) : null,
        contractor: i % 3 === 0 ? 'ООО СервисРемонт' : 'АО ТехПодряд',
        engineHoursAtRepair: 1000 + i * 350,
        description: `Заявка на ремонт ${equipment.inventoryNumber} (${equipment.name})`,
        notes: i % 2 === 0 ? 'Тестовая заметка' : null,
      },
    });
  }

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
