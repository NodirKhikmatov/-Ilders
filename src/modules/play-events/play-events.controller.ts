import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreatePlayEventDto } from './dto/play-event.dto';
import { PlayEvent } from './entities/play-event.entity';
import { PlayEventsService } from './play-events.service';

@ApiTags('play-events')
@Controller('play-events')
export class PlayEventsController {
  constructor(private readonly playEventsService: PlayEventsService) {}

  @Post()
  @ApiOperation({ summary: 'Record a music play event into the ledger' })
  @ApiResponse({ status: 201, description: 'The recorded play event.' })
  record(@Body() dto: CreatePlayEventDto): Promise<PlayEvent> {
    return this.playEventsService.record(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single play event by id' })
  findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PlayEvent | null> {
    return this.playEventsService.findById(id);
  }
}
