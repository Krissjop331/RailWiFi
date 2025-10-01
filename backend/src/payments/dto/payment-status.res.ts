import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';

export class PaymentStatusResDto {
  @ApiProperty({ enum: PaymentStatus, example: 'paid' })
  status: PaymentStatus;

  @ApiProperty({ example: '2025-09-28T09:13:00.000Z', nullable: true })
  paidUntilUtc: string | null;

  @ApiProperty({ example: '2025-09-28T14:13:00+05:00', nullable: true })
  paidUntilLocal: string | null;

  @ApiProperty({ example: 'Asia/Almaty' })
  timezone: string;
}
