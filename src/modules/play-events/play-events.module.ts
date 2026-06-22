import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayEvent } from './entities/play-event.entity';
import { PlayEventsController } from './play-events.controller';
import { PlayEventsService } from './play-events.service';

@Module({
  imports: [TypeOrmModule.forFeature([PlayEvent])],
  controllers: [PlayEventsController],
  providers: [PlayEventsService],
  exports: [PlayEventsService, TypeOrmModule],
})
export class PlayEventsModule {}
