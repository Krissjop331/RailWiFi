import { Body, Controller, Get, Param, Patch, Post, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TariffsService } from './tariffs.service';
import { CreateTariffDto } from './dto/create-tariff.dto';
import { UpdateTariffDto } from './dto/update-tariff.dto';

@ApiTags('tariffs')
@Controller('tariffs')
export class TariffsController {
  constructor(private readonly service: TariffsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  // На MVP без авторизации — оставим CRUD открытым. Потом повесим guard/роль.
  @Post()
  create(@Body() dto: CreateTariffDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTariffDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
