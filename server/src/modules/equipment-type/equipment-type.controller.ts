import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RealmRole } from '../../auth/roles/realm-role.enum';
import { EquipmentTypeService } from './equipment-type.service';
import { CreateEquipmentTypeDto } from './dto/create-equipment-type.dto';
import { UpdateEquipmentTypeDto } from './dto/update-equipment-type.dto';

@Controller('equipment-types')
export class EquipmentTypeController {
  constructor(private readonly equipmentTypeService: EquipmentTypeService) {}

  @Roles(RealmRole.Viewer, RealmRole.Editor, RealmRole.Admin)
  @Get()
  async findAll(@Query() query: any, @Res() res: Response) {
    const result = await this.equipmentTypeService.findAll(query);
    res.set('Content-Range', `equipment-types ${query._start || 0}-${query._end || result.total}/${result.total}`);
    res.set('Access-Control-Expose-Headers', 'Content-Range');
    return res.json(result.data);
  }

  @Roles(RealmRole.Viewer, RealmRole.Editor, RealmRole.Admin)
  @Get(':code')
  findOne(@Param('code') code: string) {
    return this.equipmentTypeService.findOne(code);
  }

  @Roles(RealmRole.Editor, RealmRole.Admin)
  @Post()
  create(@Body() dto: CreateEquipmentTypeDto) {
    return this.equipmentTypeService.create(dto);
  }

  @Roles(RealmRole.Editor, RealmRole.Admin)
  @Patch(':code')
  update(@Param('code') code: string, @Body() dto: UpdateEquipmentTypeDto) {
    return this.equipmentTypeService.update(code, dto);
  }

  @Roles(RealmRole.Admin)
  @Delete(':code')
  remove(@Param('code') code: string) {
    return this.equipmentTypeService.remove(code);
  }
}
