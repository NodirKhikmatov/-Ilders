import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiParam({
    name: 'id',
    format: 'uuid',
    example: '398b5181-27f2-420d-85ec-963e7271ac3f',
    description: 'Play event UUID returned by POST /play-events',
  })
  findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PlayEvent | null> {
    return this.playEventsService.findById(id);
  }
}
