import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus, Prisma } from '@prisma/client';
import { KaspiStubAdapter } from './adapters/kaspi.adapter';
import { OmadaStubAdapter } from './adapters/omada.adapter';
import { TimeService } from '../common/time/time.service';
import { normalizeMac } from '../common/mac.util';

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

@Injectable()
export class PaymentsService {
  private kaspi = new KaspiStubAdapter();
  private omada = new OmadaStubAdapter();

  constructor(
    private prisma: PrismaService,
    private time: TimeService
  ) {}

  private async upsertDeviceByMac(macRaw: string) {
    const mac = normalizeMac(macRaw);
    const now = new Date();
    return this.prisma.device.upsert({
      where: { mac },
      create: { mac, firstSeenAt: now, lastSeenAt: now },
      update: { lastSeenAt: now },
    });
  }

  async create(dto: CreatePaymentDto) {
    const tariff = await this.prisma.tariff.findUnique({ where: { id: dto.tariffId } });
    if (!tariff || !tariff.active) throw new BadRequestException('Tariff not found or inactive');

    const device = await this.upsertDeviceByMac(dto.mac);
    const order = await this.kaspi.createOrder(Number(tariff.priceKzt), {
      mac: dto.mac,
      tariffId: dto.tariffId,
    });

    const payment = await this.prisma.payment.create({
      data: {
        provider: 'stub',
        providerOrderId: order.providerOrderId,
        deviceId: device.id,
        tariffId: tariff.id,
        amountKzt: new Prisma.Decimal(tariff.priceKzt),
        status: PaymentStatus.pending,
      },
    });

    return {
      paymentId: payment.id,
      providerOrderId: order.providerOrderId,
      payUrl: order.payUrl,
      qrUrl: order.qrUrl,
      status: payment.status,
    };
  }

  async getStatus(paymentId: string) {
    const p = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!p) throw new NotFoundException('Payment not found');

    const tz = this.time.timezone();
    const paidUntilUtc = p.paidUntil ? this.time.toUtcISO(p.paidUntil) : null;
    const paidUntilLocal = p.paidUntil ? this.time.toLocalISO(p.paidUntil) : null;

    return { status: p.status, paidUntilUtc, paidUntilLocal, timezone: tz };
  }

  async mockConfirm(paymentId: string) {
    const now = new Date();

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { tariff: true, device: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status === PaymentStatus.paid) {
      const tz = this.time.timezone();
      return {
        already: true,
        status: 'paid',
        paidUntilUtc: payment.paidUntil ? this.time.toUtcISO(payment.paidUntil) : null,
        paidUntilLocal: payment.paidUntil ? this.time.toLocalISO(payment.paidUntil) : null,
        timezone: tz,
      };
    }
    if (![PaymentStatus.pending, PaymentStatus.created].includes(payment.status as any)) {
      throw new BadRequestException(`Payment not in confirmable state: ${payment.status}`);
    }

    const activeTicket = await this.prisma.accessTicket.findFirst({
      where: { deviceId: payment.deviceId, expiresAt: { gt: now } },
      orderBy: { expiresAt: 'desc' },
    });

    const base =
      activeTicket?.expiresAt && activeTicket.expiresAt > now ? activeTicket.expiresAt : now;
    const newExpires = addMinutes(base, payment.tariff.durationMin);

    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.paid, paidAt: now, paidUntil: newExpires },
    });

    await this.prisma.accessTicket.create({
      data: {
        deviceId: payment.deviceId,
        source: `payment:${payment.id}`,
        grantedAt: now,
        expiresAt: newExpires,
      },
    });

    const secondsLeft = Math.max(1, Math.floor((newExpires.getTime() - now.getTime()) / 1000));
    await this.omada.authorizeByMac(normalizeMac(payment.device.mac), secondsLeft);

    const tz = this.time.timezone();
    return {
      status: updatedPayment.status,
      paidUntilUtc: this.time.toUtcISO(newExpires),
      paidUntilLocal: this.time.toLocalISO(newExpires),
      timezone: tz,
    };
  }
}
