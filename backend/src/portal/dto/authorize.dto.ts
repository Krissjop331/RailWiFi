import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AuthorizeDto {
  @ApiProperty({ example: 'AA-BB-CC-11-22-33' })
  @IsString()
  mac: string;
}
