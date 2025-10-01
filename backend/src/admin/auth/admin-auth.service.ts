import { Injectable, UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';

@Injectable()
export class AdminAuthService {
  private user = process.env.ADMIN_USER || 'admin';
  private pass = process.env.ADMIN_PASS || 'admin123';
  private secret = process.env.ADMIN_JWT_SECRET || 'change_me';
  private _cookieName = process.env.ADMIN_COOKIE_NAME || 'admin_token';

  validateCredentials(username: string, password: string) {
    if (username !== this.user || password !== this.pass) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  signToken() {
    return jwt.sign({ role: 'admin' }, this.secret, { expiresIn: '12h' });
  }

  verifyToken(token: string) {
    try {
      return jwt.verify(token, this.secret) as any;
    } catch {
      throw new UnauthorizedException('Bad token');
    }
  }

  cookieNameValue(token: string) {
    return {
      name: this._cookieName,
      value: token,
      options: {
        httpOnly: true,
        secure: false, // в проде true (https)
        sameSite: 'lax' as const,
        maxAge: 12 * 60 * 60 * 1000, // 12h
        path: '/',
      },
    };
  }

  clearCookie() {
    return {
      name: this.cookieName,
      value: '',
      options: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax' as const,
        maxAge: 0,
        path: '/',
      },
    };
  }

  get cookieName() {
    return this._cookieName;
  }
}
