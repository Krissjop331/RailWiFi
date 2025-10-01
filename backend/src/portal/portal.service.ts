import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TimeService } from '../common/time/time.service';
import { normalizeMac } from '../common/mac.util';

@Injectable()
export class PortalService {
  constructor(
    private prisma: PrismaService,
    private time: TimeService
  ) {}

  async authorize(macRaw: string) {
    const mac = normalizeMac(macRaw);
    const now = new Date();
    const tz = this.time.timezone();
    const device = await this.prisma.device.findUnique({ where: { mac } });
    if (!device) return { allowed: false, expiresAtUtc: null, expiresAtLocal: null, timezone: tz };

    const ticket = await this.prisma.accessTicket.findFirst({
      where: { deviceId: device.id, expiresAt: { gt: now } },
      orderBy: { expiresAt: 'desc' },
    });
    if (!ticket) return { allowed: false, expiresAtUtc: null, expiresAtLocal: null, timezone: tz };

    return {
      allowed: true,
      expiresAtUtc: this.time.toUtcISO(ticket.expiresAt),
      expiresAtLocal: this.time.toLocalISO(ticket.expiresAt),
      timezone: tz,
    };
  }
}
