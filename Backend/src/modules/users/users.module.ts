import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { GamificationModule } from '../gamification/gamification.module';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [GamificationModule, SearchModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
