import { ApiProperty } from '@nestjs/swagger';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('play_events')
@Index('idx_play_events_song_id', ['songId'])
@Index('idx_play_events_played_at', ['playedAt'])
@Index('idx_play_events_settled_batch_id', ['settledBatchId'])
@Check('CHK_play_events_unit_price_non_negative', '"unit_price" >= 0')
@Check('CHK_play_events_duration_non_negative', '"duration" IS NULL OR "duration" >= 0')
export class PlayEvent {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'song-1' })
  @Column({ name: 'song_id', type: 'varchar', length: 255 })
  songId: string;

  @ApiProperty({ example: 'store-1' })
  @Column({ name: 'store_id', type: 'varchar', length: 255 })
  storeId: string;

  @ApiProperty({ example: '2026-04-10T12:00:00.000Z' })
  @Column({ name: 'played_at', type: 'timestamptz' })
  playedAt: Date;

  @ApiProperty({ example: 180, nullable: true })
  @Column({ name: 'duration', type: 'integer', nullable: true })
  duration: number | null;

  @ApiProperty({ example: 101, description: 'Per-play royalty in whole KRW' })
  @Column({ name: 'unit_price', type: 'integer' })
  unitPrice: number;

  /**
   * Claim marker: set to the settlement batch that consumed this event.
   * NULL means the event has not been settled yet. Guarantees each play
   * event contributes to revenue exactly once across all settlements.
   */
  @ApiProperty({
    format: 'uuid',
    nullable: true,
    description:
      'Settlement batch that consumed this event. NULL means unsettled.',
  })
  @Column({ name: 'settled_batch_id', type: 'uuid', nullable: true })
  settledBatchId: string | null;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
