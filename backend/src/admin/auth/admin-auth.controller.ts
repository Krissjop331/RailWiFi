import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { ApiProperty, ApiTags } from '@nestjs/swagger';
import { AdminAuthService } from './admin-auth.service';
import type { Response } from 'express';
import { IsString, MinLength } from 'class-validator';

class LoginDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'admin123' })
  @IsString()
  @MinLength(3)
  password: string;
}

@ApiTags('admin-auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private svc: AdminAuthService) {}

  @Post('login')
  login(@Body() body: LoginDto, @Res() res: Response) {
    this.svc.validateCredentials(body.username, body.password);
    const token = this.svc.signToken();
    const c = this.svc.cookieNameValue(token);
    res.cookie(c.name, c.value, c.options);
    return res.json({ ok: true });
  }

  @Post('logout')
  logout(@Res() res: Response) {
    const c = this.svc.clearCookie();
    res.cookie(c.name, c.value, c.options);
    return res.json({ ok: true });
  }

  @Get('me')
  me(@Res() res: Response) {
    const token = res.req.cookies?.[this.svc.cookieName];
    if (!token) return res.status(401).json({ ok: false });
    try {
      this.svc.verifyToken(token);
      return res.json({ ok: true, role: 'admin' });
    } catch {
      return res.status(401).json({ ok: false });
    }
  }
}
