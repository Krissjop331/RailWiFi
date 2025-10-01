import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { TariffsModule } from './tariffs/tariffs.module';
import { PaymentsModule } from './payments/payments.module';
import { PortalModule } from './portal/portal.module';
import { TimeModule } from './common/time/time.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
// import { ReportsModule } from './reports/reports.module';
import { AdminAuthModule } from './admin/auth/admin-auth.module';
import { AdminSessionsModule } from './admin/sessions/admin-sessions.module';
import { AdminTariffsModule } from './admin/tariffs/admin-tariffs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    TariffsModule,
    PaymentsModule,
    PortalModule,
    TimeModule,
    ThrottlerModule.forRoot([{ ttl: 60, limit: 60 }]),
    // ReportsModule,
    AdminAuthModule,
    AdminSessionsModule,
    AdminTariffsModule,
  ],
})
export class AppModule {}
