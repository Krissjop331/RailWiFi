import { ApiProperty } from '@nestjs/swagger';

export class AuthorizeResDto {
  @ApiProperty({ example: true })
  allowed: boolean;

  @ApiProperty({ example: '2025-09-28T09:13:00.000Z', nullable: true })
  expiresAtUtc: string | null;

  @ApiProperty({ example: '2025-09-28T14:13:00+05:00', nullable: true })
  expiresAtLocal: string | null;

  @ApiProperty({ example: 'Asia/Almaty' })
  timezone: string;
}
