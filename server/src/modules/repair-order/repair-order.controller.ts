import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RealmRole } from '../../auth/roles/realm-role.enum';
import { RepairOrderService } from './repair-order.service';
import { CreateRepairOrderDto } from './dto/create-repair-order.dto';
import { UpdateRepairOrderDto } from './dto/update-repair-order.dto';

@Controller('repair-orders')
export class RepairOrderController {
  constructor(private readonly service: RepairOrderService) {}

  @Roles(RealmRole.Viewer, RealmRole.Editor, RealmRole.Admin)
  @Get()
  async findAll(@Query() query: any, @Res() res: Response) {
    const result = await this.service.findAll(query);
    res.set('Content-Range', `repair-orders ${query._start || 0}-${query._end || result.total}/${result.total}`);
    res.set('Access-Control-Expose-Headers', 'Content-Range');
    return res.json(result.data);
  }

  @Roles(RealmRole.Viewer, RealmRole.Editor, RealmRole.Admin)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(RealmRole.Editor, RealmRole.Admin)
  @Post()
  create(@Body() dto: CreateRepairOrderDto) {
    return this.service.create(dto);
  }

  @Roles(RealmRole.Editor, RealmRole.Admin)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRepairOrderDto) {
    return this.service.update(id, dto);
  }

  @Roles(RealmRole.Admin)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
