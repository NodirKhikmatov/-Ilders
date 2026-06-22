import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CreatePlayEventDto } from './dto/play-event.dto';
import { PlayEvent } from './entities/play-event.entity';
import { PlayEventsService } from './play-events.service';

@Controller('play-events')
export class PlayEventsController {
  constructor(private readonly playEventsService: PlayEventsService) {}

  @Post()
  record(@Body() dto: CreatePlayEventDto): Promise<PlayEvent> {
    return this.playEventsService.record(dto);
  }

  @Get(':id')
  findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PlayEvent | null> {
    return this.playEventsService.findById(id);
  }
}
