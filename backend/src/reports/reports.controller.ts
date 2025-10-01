import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaClient } from '@prisma/client';
import type { Response } from 'express';
import { format } from 'date-fns';
import { format as fmtCsv } from '@fast-csv/format';

const prisma = new PrismaClient();

function parseDate(q?: string) {
  if (!q) return undefined;
  const d = new Date(q);
  return isNaN(+d) ? undefined : d;
}

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  @Get('payments.csv')
  async paymentsCsv(
    @Query('from') fromStr: string,
    @Query('to') toStr: string,
    @Res() res: Response
  ) {
    const from = parseDate(fromStr);
    const to = parseDate(toStr);

    const where: any = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }

    const rows = await prisma.payment.findMany({
      where,
      include: { tariff: true, device: true },
      orderBy: { createdAt: 'desc' },
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="payments_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv"`
    );

    const csv = fmtCsv({ headers: true, writeBOM: true });
    csv.pipe(res);

    rows.forEach((r) => {
      csv.write({
        id: r.id,
        provider: r.provider,
        providerOrderId: r.providerOrderId || '',
        mac: r.device?.mac || '',
        tariff: r.tariff?.title || '',
        durationMin: r.tariff?.durationMin ?? '',
        amountKzt: r.amountKzt.toString(),
        status: r.status,
        createdAtUtc: r.createdAt.toISOString(),
        paidAtUtc: r.paidAt ? r.paidAt.toISOString() : '',
        paidUntilUtc: r.paidUntil ? r.paidUntil.toISOString() : '',
      });
    });

    csv.end();
  }

  @Get('access.csv')
  async accessCsv(
    @Query('from') fromStr: string,
    @Query('to') toStr: string,
    @Res() res: Response
  ) {
    const from = parseDate(fromStr);
    const to = parseDate(toStr);

    const where: any = {};
    if (from || to) {
      where.grantedAt = {};
      if (from) where.grantedAt.gte = from;
      if (to) where.grantedAt.lte = to;
    }

    const rows = await prisma.accessTicket.findMany({
      where,
      include: { device: true },
      orderBy: { grantedAt: 'desc' },
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="access_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv"`
    );

    const csv = fmtCsv({ headers: true, writeBOM: true });
    csv.pipe(res);

    rows.forEach((r) => {
      csv.write({
        id: r.id,
        mac: r.device?.mac || '',
        source: r.source,
        grantedAtUtc: r.grantedAt.toISOString(),
        expiresAtUtc: r.expiresAt.toISOString(),
        activeNow: r.expiresAt > new Date(),
      });
    });

    csv.end();
  }
}
