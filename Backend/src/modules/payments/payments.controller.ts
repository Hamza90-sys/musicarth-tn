import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PaymentsService } from './payments.service';
import { CreateCouponDto } from './dto/create-coupon.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('course/:courseId')
  @UseGuards(JwtAuthGuard)
  async payForCourse(
    @Param('courseId') courseId: string,
    @Body('couponCode') couponCode: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.paymentsService.createCoursePayment(user.sub, courseId, couponCode);
  }

  @Post('session/:availabilityId')
  @UseGuards(JwtAuthGuard)
  async payForSession(
    @Param('availabilityId') availabilityId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.paymentsService.createSessionPayment(user.sub, availabilityId);
  }

  @Get('earnings/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async myEarnings(@CurrentUser() user: { sub: string }) {
    return this.paymentsService.getInstructorEarnings(user.sub);
  }

  @Get('admin/recent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async recentPayments() {
    return this.paymentsService.listRecentPayments();
  }

  @Get('admin/payouts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async monthlyPayouts(@Query('month') month?: string) {
    return this.paymentsService.getMonthlyPayouts(month ?? '');
  }

  @Post('admin/payouts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async markPayout(
    @Body('instructorId') instructorId: string,
    @Body('month') month: string,
    @Body('note') note: string | undefined,
  ) {
    return this.paymentsService.markPayoutPaid(instructorId, month, note);
  }

  @Post(':paymentId/refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async refund(@Param('paymentId') paymentId: string) {
    return this.paymentsService.refundPayment(paymentId);
  }

  @Post('coupons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createCoupon(
    @Body() dto: CreateCouponDto,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    return this.paymentsService.createCoupon(user.sub, user.role, dto);
  }

  @Get('coupons/mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async myCoupons(@CurrentUser() user: { sub: string }) {
    return this.paymentsService.listMyCoupons(user.sub);
  }

  @Delete('coupons/:couponId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deactivateCoupon(
    @Param('couponId') couponId: string,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    return this.paymentsService.deactivateCoupon(couponId, user.sub, user.role);
  }

  @Get(':paymentId/verify')
  @UseGuards(JwtAuthGuard)
  async verify(
    @Param('paymentId') paymentId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.paymentsService.verifyAndGrant(paymentId, user.sub);
  }

  // Public — Flouci calls this server-to-server; we re-verify before granting.
  @Post('flouci/webhook')
  async webhook(@Body() body: unknown) {
    return this.paymentsService.handleWebhook(body);
  }
}
