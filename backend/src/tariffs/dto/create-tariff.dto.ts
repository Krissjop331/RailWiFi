import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateTariffDto {
  @ApiProperty({ example: '1 час' })
  @IsString()
  title: string;

  @ApiProperty({ example: 60, description: 'Длительность в минутах' })
  @IsInt()
  @Min(1)
  durationMin: number;

  @ApiProperty({ example: 500, description: 'Цена в KZT (целое или с копейками)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  priceKzt: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
