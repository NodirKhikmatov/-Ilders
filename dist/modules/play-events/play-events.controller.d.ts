import { CreatePlayEventDto } from './dto/play-event.dto';
import { PlayEvent } from './entities/play-event.entity';
import { PlayEventsService } from './play-events.service';
export declare class PlayEventsController {
    private readonly playEventsService;
    constructor(playEventsService: PlayEventsService);
    record(dto: CreatePlayEventDto): Promise<PlayEvent>;
    findById(id: string): Promise<PlayEvent | null>;
}
