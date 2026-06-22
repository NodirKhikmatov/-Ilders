import { DEFAULT_UNIT_PRICE_KRW } from '../../common/constants/play-event.constants';
import { CreatePlayEventDto } from './dto/play-event.dto';
import { PlayEvent } from './entities/play-event.entity';
import { PlayEventsService } from './play-events.service';

describe('PlayEventsService', () => {
  let service: PlayEventsService;

  const repository = {
    create: jest.fn((data: Partial<PlayEvent>) => data),
    save: jest.fn(async (entity: PlayEvent) => ({
      ...entity,
      id: 'pe-1',
      createdAt: new Date(),
    })),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(() => {
    service = new PlayEventsService(repository as never);
    jest.clearAllMocks();
  });

  describe('record', () => {
    it('applies the default unit price when none is provided', async () => {
      const dto: CreatePlayEventDto = {
        songId: 'song-a',
        storeId: 'store-1',
        playedAt: new Date('2026-01-10T12:00:00.000Z'),
      };

      await service.record(dto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          songId: 'song-a',
          storeId: 'store-1',
          unitPrice: DEFAULT_UNIT_PRICE_KRW,
          duration: null,
          settledBatchId: null,
        }),
      );
    });

    it('uses the provided unit price and duration when supplied', async () => {
      const dto: CreatePlayEventDto = {
        songId: 'song-a',
        storeId: 'store-1',
        playedAt: new Date('2026-01-10T12:00:00.000Z'),
        duration: 180,
        unitPrice: 7,
      };

      await service.record(dto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          unitPrice: 7,
          duration: 180,
        }),
      );
    });
  });
});
