import { Module, Global } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { TimeModule } from '../common/time/time.module';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService],
  imports: [TimeModule],
})
export class PaymentsModule {}
