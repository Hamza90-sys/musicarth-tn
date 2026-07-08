import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async listNotifications(@CurrentUser() user: { sub: string }) {
    return this.notificationsService.listNotifications(user.sub);
  }

  @Patch(':notificationId/read')
  async markRead(
    @CurrentUser() user: { sub: string },
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationsService.markRead(notificationId, user.sub);
  }

  @Patch('read-all')
  async markAllRead(@CurrentUser() user: { sub: string }) {
    return this.notificationsService.markAllRead(user.sub);
  }
}
