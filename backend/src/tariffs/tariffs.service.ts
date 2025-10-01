import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTariffDto } from './dto/create-tariff.dto';
import { UpdateTariffDto } from './dto/update-tariff.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TariffsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.tariff.findMany({
      where: { active: true },
      orderBy: { durationMin: 'asc' },
    });
  }

  async create(dto: CreateTariffDto) {
    return this.prisma.tariff.create({
      data: {
        title: dto.title,
        durationMin: dto.durationMin,
        priceKzt: new Prisma.Decimal(dto.priceKzt),
        active: dto.active ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateTariffDto) {
    const exists = await this.prisma.tariff.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Tariff not found');
    return this.prisma.tariff.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.priceKzt !== undefined && { priceKzt: new Prisma.Decimal(dto.priceKzt) }),
      },
    });
  }

  async remove(id: string) {
    const exists = await this.prisma.tariff.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Tariff not found');
    return this.prisma.tariff.delete({ where: { id } });
  }

  findAllAdmin() {
    return this.prisma.tariff.findMany({ orderBy: { createdAt: 'desc' } });
  }
}
