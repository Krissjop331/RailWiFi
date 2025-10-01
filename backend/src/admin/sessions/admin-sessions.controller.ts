import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiProperty, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { normalizeMac } from '../../common/mac.util';
import { TimeService } from '../../common/time/time.service';
import { IsInt } from 'class-validator';

class ExtendDto {
  @ApiProperty({ example: 15, description: 'Минуты (+ продлить, – сократить)' })
  @IsInt()
  minutes: number;
}
@ApiTags('admin-sessions')
@UseGuards(AdminAuthGuard)
@Controller('admin/sessions')
export class AdminSessionsController {
  constructor(
    private prisma: PrismaService,
    private time: TimeService
  ) {}

  // GET /admin/sessions?active=true
  @Get()
  async list(@Query('active') active: string) {
    const now = new Date();
    if (active === 'true') {
      // сгруппируем по устройству: последний активный билет
      const tickets = await this.prisma.accessTicket.findMany({
        where: { expiresAt: { gt: now } },
        include: { device: true },
        orderBy: { expiresAt: 'desc' },
      });

      // Оставим по одному на MAC (самый поздний)
      const seen = new Set<string>();
      const rows: any[] = [];
      for (const t of tickets) {
        const mac = t.device?.mac || '';
        if (seen.has(mac)) continue;
        seen.add(mac);
        const leftMs = t.expiresAt.getTime() - now.getTime();
        rows.push({
          mac,
          grantedAtUtc: t.grantedAt.toISOString(),
          expiresAtUtc: t.expiresAt.toISOString(),
          expiresAtLocal: this.time.toLocalISO(t.expiresAt),
          minutesLeft: Math.max(0, Math.floor(leftMs / 60000)),
          timezone: this.time.timezone(),
        });
      }
      return rows;
    }

    // иначе — вернуть все билеты (пагинация опущена для MVP)
    return this.prisma.accessTicket.findMany({
      include: { device: true },
      orderBy: { grantedAt: 'desc' },
    });
  }

  // POST /admin/sessions/:mac/extend { minutes: +15 | -15 | +60 ... }
  @Post(':mac/extend')
  async extend(@Param('mac') macRaw: string, @Body() dto: ExtendDto) {
    const mac = normalizeMac(macRaw);
    const device = await this.prisma.device.findUnique({ where: { mac } });
    if (!device) return { ok: false, message: 'device not found' };

    const now = new Date();
    const last = await this.prisma.accessTicket.findFirst({
      where: { deviceId: device.id, expiresAt: { gt: now } },
      orderBy: { expiresAt: 'desc' },
    });

    const base = last?.expiresAt && last.expiresAt > now ? last.expiresAt : now;
    const newExpires = new Date(base.getTime() + dto.minutes * 60000);

    // Создадим отдельный "админский" билет для аудита
    const ticket = await this.prisma.accessTicket.create({
      data: {
        deviceId: device.id,
        source: `admin:${dto.minutes >= 0 ? 'extend' : 'reduce'}:${dto.minutes}`,
        grantedAt: now,
        expiresAt: newExpires > now ? newExpires : now, // если ушли в прошлое — по факту terminate
      },
    });

    // (опционально) здесь можно позвать Omada CoA/authorize — позже подключим реальный адаптер

    return {
      ok: true,
      mac,
      expiresAtUtc: ticket.expiresAt.toISOString(),
      expiresAtLocal: this.time.toLocalISO(ticket.expiresAt),
      timezone: this.time.timezone(),
    };
  }

  // DELETE /admin/sessions/:mac  — завершить сейчас
  @Delete(':mac')
  async terminate(@Param('mac') macRaw: string) {
    const mac = normalizeMac(macRaw);
    const device = await this.prisma.device.findUnique({ where: { mac } });
    if (!device) return { ok: false, message: 'device not found' };

    const now = new Date();
    // всем активным — expiresAt = now (мягкое завершение)
    const updated = await this.prisma.accessTicket.updateMany({
      where: { deviceId: device.id, expiresAt: { gt: now } },
      data: { expiresAt: now },
    });

    // плюс создадим маркер-операцию для аудита
    await this.prisma.accessTicket.create({
      data: {
        deviceId: device.id,
        source: 'admin:terminate',
        grantedAt: now,
        expiresAt: now,
      },
    });

    return { ok: true, mac, changed: updated.count };
  }
}
