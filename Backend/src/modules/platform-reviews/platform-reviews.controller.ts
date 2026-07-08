import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';

class SubmitPlatformReviewDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  comment?: string;
}

/** Minimum number of ratings before testimonials appear on the landing page. */
const MIN_REVIEWS_TO_SHOW = 15;

@Controller('platform-reviews')
export class PlatformReviewsController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Public: testimonials for the landing page. Returns an empty list until
   * MORE than MIN_REVIEWS_TO_SHOW students have rated, so the section stays
   * hidden while the platform is young.
   */
  @Get()
  async listPublic() {
    const count = await this.prisma.platformReview.count();
    if (count <= MIN_REVIEWS_TO_SHOW) {
      return { count, minimum: MIN_REVIEWS_TO_SHOW, items: [] };
    }
    const items = await this.prisma.platformReview.findMany({
      where: { comment: { not: null }, rating: { gte: 4 } },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: { select: { fullName: true } },
      },
    });
    return { count, minimum: MIN_REVIEWS_TO_SHOW, items };
  }

  /** The signed-in student's own review (null if they haven't rated yet). */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async mine(@CurrentUser() user: { sub: string }) {
    const review = await this.prisma.platformReview.findUnique({
      where: { userId: user.sub },
      select: { id: true, rating: true, comment: true },
    });
    return { review };
  }

  /** Submit (or update) the student's one platform review. */
  @Post()
  @UseGuards(JwtAuthGuard)
  async submit(
    @Body() dto: SubmitPlatformReviewDto,
    @CurrentUser() user: { sub: string },
  ) {
    const review = await this.prisma.platformReview.upsert({
      where: { userId: user.sub },
      update: { rating: dto.rating, comment: dto.comment?.trim() || null },
      create: {
        userId: user.sub,
        rating: dto.rating,
        comment: dto.comment?.trim() || null,
      },
    });
    return { id: review.id, rating: review.rating };
  }
}
