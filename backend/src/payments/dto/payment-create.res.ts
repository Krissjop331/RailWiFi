import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';

export class PaymentCreateResDto {
  @ApiProperty() paymentId: string;
  @ApiProperty() providerOrderId: string;
  @ApiProperty() payUrl: string;
  @ApiProperty() qrUrl: string;
  @ApiProperty({ enum: PaymentStatus }) status: PaymentStatus;
}
