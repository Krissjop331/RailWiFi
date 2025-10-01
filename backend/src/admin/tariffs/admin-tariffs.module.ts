import { Module } from '@nestjs/common';
import { AdminTariffsController } from './admin-tariffs.controller';
import { TariffsModule } from '../../tariffs/tariffs.module';
import { AdminAuthModule } from '../auth/admin-auth.module';

@Module({
  imports: [TariffsModule, AdminAuthModule],
  controllers: [AdminTariffsController],
})
export class AdminTariffsModule {}
