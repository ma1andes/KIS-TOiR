import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEquipmentTypeDto } from './dto/create-equipment-type.dto';
import { UpdateEquipmentTypeDto } from './dto/update-equipment-type.dto';

function serializeRecord(record: any) {
  return {
    ...record,


  };
}

@Injectable()
export class EquipmentTypeService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { _start?: string; _end?: string; _sort?: string; _order?: string; [key: string]: any }) {
    const start = parseInt(query._start) || 0;
    const end = parseInt(query._end) || 10;
    const take = end - start;
    const skip = start;
    const sortField = query._sort || 'code';
    const prismaSortField = sortField === 'id' ? 'code' : sortField;
    const sortOrder = (query._order || 'ASC').toLowerCase() as 'asc' | 'desc';

    const where: any = {};

    if (query.q) {
      const q = String(query.q);
      const ors: any[] = [];
      ors.push({ code: { contains: q, mode: 'insensitive' } });
      ors.push({ name: { contains: q, mode: 'insensitive' } });
      ors.push({ manufacturer: { contains: q, mode: 'insensitive' } });
      if (ors.length) where.OR = ors;
    }

    if (query.code) where.code = { contains: query.code, mode: 'insensitive' };
    if (query.name) where.name = { contains: query.name, mode: 'insensitive' };
    if (query.manufacturer) where.manufacturer = { contains: query.manufacturer, mode: 'insensitive' };

    

    // Enum multi-value support (e.g. status=A&status=B)
    

    if (query.id) {
      const ids = Array.isArray(query.id) ? query.id : [query.id];
      where.code = { in: ids };
    }

    const [data, total] = await Promise.all([
      this.prisma.equipmentType.findMany({ where, skip, take, orderBy: { [prismaSortField]: sortOrder } }),
      this.prisma.equipmentType.count({ where }),
    ]);

    const mapped = data.map((item: any) => ({ id: item.code, ...serializeRecord(item) }));
    return { data: mapped, total };
  }

  async findOne(id: string) {
    const record = await this.prisma.equipmentType.findUniqueOrThrow({ where: { code: id } as any });
    return { id: (record as any).code, ...serializeRecord(record) };
  }

  async create(dto: CreateEquipmentTypeDto) {
    const data: any = { ...(dto as any) };



    const record = await this.prisma.equipmentType.create({ data });
    return { id: (record as any).code, ...serializeRecord(record) };
  }

  async update(id: string, dto: UpdateEquipmentTypeDto) {
    const { id: _pk, code, ...rest } = (dto as any);
    const data: any = { ...rest };



    const record = await this.prisma.equipmentType.update({ where: { code: id } as any, data });
    return { id: (record as any).code, ...serializeRecord(record) };
  }

  async remove(id: string) {
    const record = await this.prisma.equipmentType.delete({ where: { code: id } as any });
    return { id: (record as any).code, ...serializeRecord(record) };
  }
}
