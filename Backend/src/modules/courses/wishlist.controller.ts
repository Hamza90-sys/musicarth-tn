import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@CurrentUser() user: { sub: string }) {
    const items = await this.prisma.wishlistItem.findMany({
      where: { userId: user.sub },
      select: { courseId: true },
    });
    return { courseIds: items.map((i) => i.courseId) };
  }

  @Post(':courseId')
  async add(@Param('courseId') courseId: string, @CurrentUser() user: { sub: string }) {
    await this.prisma.wishlistItem.upsert({
      where: { userId_courseId: { userId: user.sub, courseId } },
      update: {},
      create: { userId: user.sub, courseId },
    });
    return { added: true };
  }

  @Delete(':courseId')
  async remove(@Param('courseId') courseId: string, @CurrentUser() user: { sub: string }) {
    await this.prisma.wishlistItem
      .deleteMany({ where: { userId: user.sub, courseId } });
    return { removed: true };
  }
}
