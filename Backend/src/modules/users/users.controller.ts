import { Body, Controller, Delete, Get, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: { sub: string }) {
    return this.usersService.getMyProfile(user.sub);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(
    @CurrentUser() user: { sub: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateMyProfile(user.sub, dto);
  }

  @Get('me/sessions')
  @UseGuards(JwtAuthGuard)
  async listMySessions(@CurrentUser() user: { sub: string }) {
    return this.usersService.listMySessions(user.sub);
  }

  @Get('me/enrollments')
  @UseGuards(JwtAuthGuard)
  async listMyEnrollments(@CurrentUser() user: { sub: string }) {
    return this.usersService.listMyEnrollments(user.sub);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  async softDeleteMe(
    @CurrentUser() user: { sub: string },
    @Body('reason') reason?: string,
  ) {
    return this.usersService.softDeleteMyAccount(user.sub, reason);
  }
}
