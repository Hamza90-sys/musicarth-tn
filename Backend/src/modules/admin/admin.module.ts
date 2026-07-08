import { Module } from '@nestjs/common';
import { SearchModule } from '../search/search.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ApplicationsModule } from '../applications/applications.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [SearchModule, NotificationsModule, ApplicationsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
