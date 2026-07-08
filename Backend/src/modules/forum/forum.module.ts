import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { GamificationModule } from '../gamification/gamification.module';
import { SearchModule } from '../search/search.module';
import { ForumController } from './forum.controller';
import { ForumService } from './forum.service';

@Module({
  imports: [NotificationsModule, GamificationModule, SearchModule],
  controllers: [ForumController],
  providers: [ForumService],
})
export class ForumModule {}
