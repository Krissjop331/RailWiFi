import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TariffsService } from '../../tariffs/tariffs.service';
import { CreateTariffDto } from '../../tariffs/dto/create-tariff.dto';
import { UpdateTariffDto } from '../../tariffs/dto/update-tariff.dto';
import { AdminAuthGuard } from '../auth/admin-auth.guard';

@ApiTags('admin-tariffs')
@UseGuards(AdminAuthGuard)
@Controller('admin/tariffs')
export class AdminTariffsController {
  constructor(private tariffs: TariffsService) {}

  @Get()
  findAllAdmin() {
    return this.tariffs.findAllAdmin();
  }

  @Post()
  create(@Body() dto: CreateTariffDto) {
    return this.tariffs.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTariffDto) {
    return this.tariffs.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tariffs.remove(id);
  }
}
