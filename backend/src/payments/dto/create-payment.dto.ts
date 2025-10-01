import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: 'AA-BB-CC-11-22-33' })
  @IsString()
  mac: string;

  @ApiProperty({ example: 'cktariff123...' })
  @IsString()
  tariffId: string;
}
