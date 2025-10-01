import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatusResDto } from './dto/payment-status.res';
import { PaymentCreateResDto } from './dto/payment-create.res';
import { PaymentConfirmResDto } from './dto/payment-confirm.res';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Post()
  @ApiOkResponse({ type: PaymentCreateResDto })
  create(@Body() dto: CreatePaymentDto): Promise<PaymentCreateResDto> {
    return this.service.create(dto) as any;
  }

  @Get(':id/status')
  @ApiOkResponse({ type: PaymentStatusResDto })
  status(@Param('id') id: string): Promise<PaymentStatusResDto> {
    return this.service.getStatus(id) as any;
  }

  @Post(':id/mock-confirm')
  @ApiOkResponse({ type: PaymentConfirmResDto })
  mockConfirm(@Param('id') id: string): Promise<PaymentConfirmResDto> {
    return this.service.mockConfirm(id) as any;
  }
}
