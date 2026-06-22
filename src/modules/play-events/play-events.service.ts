import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { DEFAULT_UNIT_PRICE_KRW } from '../../common/constants/play-event.constants';
import { CreatePlayEventDto } from './dto/play-event.dto';
import { PlayEvent } from './entities/play-event.entity';

@Injectable()
export class PlayEventsService {
  constructor(
    @InjectRepository(PlayEvent)
    private readonly playEventRepository: Repository<PlayEvent>,
  ) {}

  async record(dto: CreatePlayEventDto): Promise<PlayEvent> {
    const playEvent = this.playEventRepository.create({
      songId: dto.songId,
      storeId: dto.storeId,
      playedAt: dto.playedAt,
      duration: dto.duration ?? null,
      unitPrice: dto.unitPrice ?? DEFAULT_UNIT_PRICE_KRW,
      settledBatchId: null,
    });

    return this.playEventRepository.save(playEvent);
  }

  async findById(id: string): Promise<PlayEvent | null> {
    return this.playEventRepository.findOne({ where: { id } });
  }

  async findUnsettled(limit?: number): Promise<PlayEvent[]> {
    return this.playEventRepository.find({
      where: { settledBatchId: IsNull() },
      order: { playedAt: 'ASC' },
      take: limit,
    });
  }
}
