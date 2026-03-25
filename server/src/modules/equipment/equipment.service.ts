import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';

function serializeRecord(record: any) {
  return {
    ...record,
    totalEngineHours: record.totalEngineHours?.toString() ?? null,
    engineHoursSinceLastRepair: record.engineHoursSinceLastRepair?.toString() ?? null,
    commissionedAt: record.commissionedAt?.toISOString() ?? null,
    lastRepairAt: record.lastRepairAt?.toISOString() ?? null,
  };
}

@Injectable()
export class EquipmentService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { _start?: string; _end?: string; _sort?: string; _order?: string; [key: string]: any }) {
    const start = parseInt(query._start) || 0;
    const end = parseInt(query._end) || 10;
    const take = end - start;
    const skip = start;
    const sortField = query._sort || 'inventoryNumber';
    const prismaSortField = sortField === 'id' ? 'id' : sortField;
    const sortOrder = (query._order || 'ASC').toLowerCase() as 'asc' | 'desc';

    const where: any = {};

    if (query.q) {
      const q = String(query.q);
      const ors: any[] = [];
      ors.push({ inventoryNumber: { contains: q, mode: 'insensitive' } });
      ors.push({ serialNumber: { contains: q, mode: 'insensitive' } });
      ors.push({ name: { contains: q, mode: 'insensitive' } });
      ors.push({ equipmentTypeCode: { contains: q, mode: 'insensitive' } });
      ors.push({ location: { contains: q, mode: 'insensitive' } });
      ors.push({ notes: { contains: q, mode: 'insensitive' } });
      if (ors.length) where.OR = ors;
    }

    if (query.inventoryNumber) where.inventoryNumber = { contains: query.inventoryNumber, mode: 'insensitive' };
    if (query.serialNumber) where.serialNumber = { contains: query.serialNumber, mode: 'insensitive' };
    if (query.name) where.name = { contains: query.name, mode: 'insensitive' };
    if (query.location) where.location = { contains: query.location, mode: 'insensitive' };
    if (query.notes) where.notes = { contains: query.notes, mode: 'insensitive' };

    if (query.equipmentTypeCode) where.equipmentTypeCode = query.equipmentTypeCode;

    // Enum multi-value support (e.g. status=A&status=B)
    if (query.status) { const vals = Array.isArray(query.status) ? query.status : [query.status]; where.status = vals.length > 1 ? { in: vals } : vals[0]; }

    if (query.id) {
      const ids = Array.isArray(query.id) ? query.id : [query.id];
      where.id = { in: ids };
    }

    const [data, total] = await Promise.all([
      this.prisma.equipment.findMany({ where, skip, take, orderBy: { [prismaSortField]: sortOrder } }),
      this.prisma.equipment.count({ where }),
    ]);

    const mapped = data.map(serializeRecord);
    return { data: mapped, total };
  }

  async findOne(id: string) {
    const record = await this.prisma.equipment.findUniqueOrThrow({ where: { id: id } as any });
    return serializeRecord(record);
  }

  async create(dto: CreateEquipmentDto) {
    const data: any = { ...(dto as any) };
    if (data.commissionedAt) data.commissionedAt = new Date(data.commissionedAt);
    if (data.lastRepairAt) data.lastRepairAt = new Date(data.lastRepairAt);
    if (data.totalEngineHours) data.totalEngineHours = new Prisma.Decimal(data.totalEngineHours);
    if (data.engineHoursSinceLastRepair) data.engineHoursSinceLastRepair = new Prisma.Decimal(data.engineHoursSinceLastRepair);

    const record = await this.prisma.equipment.create({ data });
    return serializeRecord(record);
  }

  async update(id: string, dto: UpdateEquipmentDto) {
    const data: any = { ...(dto as any) };
    delete data.id;
    delete data.id;
    if (data.commissionedAt) data.commissionedAt = new Date(data.commissionedAt);
    if (data.lastRepairAt) data.lastRepairAt = new Date(data.lastRepairAt);
    if (data.totalEngineHours !== undefined && data.totalEngineHours !== null) data.totalEngineHours = new Prisma.Decimal(data.totalEngineHours);
    if (data.engineHoursSinceLastRepair !== undefined && data.engineHoursSinceLastRepair !== null) data.engineHoursSinceLastRepair = new Prisma.Decimal(data.engineHoursSinceLastRepair);

    const record = await this.prisma.equipment.update({ where: { id: id } as any, data });
    return serializeRecord(record);
  }

  async remove(id: string) {
    const record = await this.prisma.equipment.delete({ where: { id: id } as any });
    return serializeRecord(record);
  }
}
