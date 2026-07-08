import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GamificationService } from './gamification.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('leaderboard')
  async getLeaderboard(
    @Query('instrument') instrument?: string,
    @Query('limit') limit?: string,
  ) {
    return this.gamificationService.getLeaderboard({
      instrument,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('users/me/stats')
  async getMyStats(@CurrentUser() user: { sub: string }) {
    return this.gamificationService.getMyStats(user.sub);
  }

  @Get('users/me/badges')
  async getMyBadges(@CurrentUser() user: { sub: string }) {
    return this.gamificationService.getMyBadges(user.sub);
  }
}
