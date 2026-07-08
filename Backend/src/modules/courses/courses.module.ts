import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { LessonsController } from './lessons.controller';
import { WishlistController } from './wishlist.controller';
import { GamificationModule } from '../gamification/gamification.module';
import { SearchModule } from '../search/search.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { VideoModule } from '../video/video.module';

@Module({
  imports: [GamificationModule, SearchModule, NotificationsModule, VideoModule],
  controllers: [CoursesController, LessonsController, WishlistController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
