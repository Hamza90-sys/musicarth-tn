import { Module } from '@nestjs/common';
import { PlatformReviewsController } from './platform-reviews.controller';

@Module({
  controllers: [PlatformReviewsController],
})
export class PlatformReviewsModule {}
