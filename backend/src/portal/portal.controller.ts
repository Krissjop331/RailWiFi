import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PortalService } from './portal.service';
import { AuthorizeDto } from './dto/authorize.dto';
import { AuthorizeResDto } from './dto/authorize.res';

@ApiTags('portal')
@Controller('portal')
export class PortalController {
  constructor(private readonly service: PortalService) {}

  @Post('authorize')
  @ApiOkResponse({ type: AuthorizeResDto })
  authorize(@Body() dto: AuthorizeDto): Promise<AuthorizeResDto> {
    return this.service.authorize(dto.mac) as any;
  }
}
