import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @Query('q') q = '',
    @Query('type') type?: 'all' | 'courses' | 'instructors' | 'forum',
    @Query('limit') limit?: string,
  ) {
    return this.searchService.search({
      q,
      type,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('rebuild')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async rebuildIndexes(@CurrentUser() _user: { sub: string }) {
    return this.searchService.rebuildIndexes();
  }
}
