import { ApiProperty } from '@nestjs/swagger';

export class PaymentConfirmResDto {
  @ApiProperty({ example: 'paid' }) status: string;
  @ApiProperty({ example: '2025-09-28T09:13:00.000Z' }) paidUntilUtc: string;
  @ApiProperty({ example: '2025-09-28T14:13:00+05:00' }) paidUntilLocal: string;
  @ApiProperty({ example: 'Asia/Almaty' }) timezone: string;
  @ApiProperty({ example: true, required: false }) already?: boolean;
}
