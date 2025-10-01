import { Module } from '@nestjs/common';
import { AdminSessionsController } from './admin-sessions.controller';
import { AdminAuthModule } from '../auth/admin-auth.module';

@Module({
  imports: [AdminAuthModule],
  controllers: [AdminSessionsController],
})
export class AdminSessionsModule {}
