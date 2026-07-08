import { Module } from '@nestjs/common';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { SessionsModule } from '../sessions/sessions.module';
import { FlouciService } from './flouci.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [EnrollmentsModule, SessionsModule],
  controllers: [PaymentsController],
  providers: [FlouciService, PaymentsService],
})
export class PaymentsModule {}
