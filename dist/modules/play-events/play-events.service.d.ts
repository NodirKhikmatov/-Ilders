import { Repository } from 'typeorm';
import { CreatePlayEventDto } from './dto/play-event.dto';
import { PlayEvent } from './entities/play-event.entity';
export declare class PlayEventsService {
    private readonly playEventRepository;
    constructor(playEventRepository: Repository<PlayEvent>);
    record(dto: CreatePlayEventDto): Promise<PlayEvent>;
    findById(id: string): Promise<PlayEvent | null>;
    findUnsettled(limit?: number): Promise<PlayEvent[]>;
}
