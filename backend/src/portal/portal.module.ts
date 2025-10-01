import { Module } from '@nestjs/common';
import { PortalService } from './portal.service';
import { PortalController } from './portal.controller';
import { TimeModule } from 'src/common/time/time.module';

@Module({
  controllers: [PortalController],
  providers: [PortalService],
  imports: [TimeModule],
})
export class PortalModule {}
