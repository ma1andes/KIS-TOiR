import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRepairOrderDto } from './dto/create-repair-order.dto';
import { UpdateRepairOrderDto } from './dto/update-repair-order.dto';

function serializeRecord(record: any) {
  return {
    ...record,
    engineHoursAtRepair: record.engineHoursAtRepair?.toString() ?? null,
    plannedAt: record.plannedAt?.toISOString() ?? null,
    startedAt: record.startedAt?.toISOString() ?? null,
    completedAt: record.completedAt?.toISOString() ?? null,
  };
}

@Injectable()
export class RepairOrderService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { _start?: string; _end?: string; _sort?: string; _order?: string; [key: string]: any }) {
    const start = parseInt(query._start) || 0;
    const end = parseInt(query._end) || 10;
    const take = end - start;
    const skip = start;
    const sortField = query._sort || 'number';
    const sortOrder = (query._order || 'ASC').toLowerCase() as 'asc' | 'desc';

    const where: any = {};

    if (query.q) {
      const q = String(query.q);
      const ors: any[] = [];
      ors.push({ number: { contains: q, mode: 'insensitive' } });
      ors.push({ contractor: { contains: q, mode: 'insensitive' } });
      ors.push({ description: { contains: q, mode: 'insensitive' } });
      ors.push({ notes: { contains: q, mode: 'insensitive' } });
      if (ors.length) where.OR = ors;
    }

    if (query.number) where.number = { contains: query.number, mode: 'insensitive' };
    if (query.contractor) where.contractor = { contains: query.contractor, mode: 'insensitive' };
    if (query.description) where.description = { contains: query.description, mode: 'insensitive' };
    if (query.notes) where.notes = { contains: query.notes, mode: 'insensitive' };

    if (query.equipmentId) where.equipmentId = query.equipmentId;

    // Enum multi-value support (e.g. status=A&status=B)
    if (query.repairKind) { const vals = Array.isArray(query.repairKind) ? query.repairKind : [query.repairKind]; where.repairKind = vals.length > 1 ? { in: vals } : vals[0]; }
    if (query.status) { const vals = Array.isArray(query.status) ? query.status : [query.status]; where.status = vals.length > 1 ? { in: vals } : vals[0]; }

    if (query.id) {
      const ids = Array.isArray(query.id) ? query.id : [query.id];
      where.id = { in: ids };
    }

    const [data, total] = await Promise.all([
      this.prisma.repairOrder.findMany({ where, skip, take, orderBy: { [sortField]: sortOrder } }),
      this.prisma.repairOrder.count({ where }),
    ]);

    const mapped = data.map(serializeRecord);
    return { data: mapped, total };
  }

  async findOne(id: string) {
    const record = await this.prisma.repairOrder.findUniqueOrThrow({ where: { id: id } as any });
    return serializeRecord(record);
  }

  async create(dto: CreateRepairOrderDto) {
    const data: any = { ...(dto as any) };
    if (data.plannedAt) data.plannedAt = new Date(data.plannedAt);
    if (data.startedAt) data.startedAt = new Date(data.startedAt);
    if (data.completedAt) data.completedAt = new Date(data.completedAt);
    if (data.engineHoursAtRepair) data.engineHoursAtRepair = new Prisma.Decimal(data.engineHoursAtRepair);

    const record = await this.prisma.repairOrder.create({ data });
    return serializeRecord(record);
  }

  async update(id: string, dto: UpdateRepairOrderDto) {
    const data: any = { ...(dto as any) };
    delete data.id;
    delete data.id;
    if (data.plannedAt) data.plannedAt = new Date(data.plannedAt);
    if (data.startedAt) data.startedAt = new Date(data.startedAt);
    if (data.completedAt) data.completedAt = new Date(data.completedAt);
    if (data.engineHoursAtRepair !== undefined && data.engineHoursAtRepair !== null) data.engineHoursAtRepair = new Prisma.Decimal(data.engineHoursAtRepair);

    const record = await this.prisma.repairOrder.update({ where: { id: id } as any, data });
    return serializeRecord(record);
  }

  async remove(id: string) {
    const record = await this.prisma.repairOrder.delete({ where: { id: id } as any });
    return serializeRecord(record);
  }
}
