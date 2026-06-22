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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'song_id', type: 'varchar', length: 255 })
  songId: string;

  @Column({ name: 'store_id', type: 'varchar', length: 255 })
  storeId: string;

  @Column({ name: 'played_at', type: 'timestamptz' })
  playedAt: Date;

  @Column({ name: 'duration', type: 'integer', nullable: true })
  duration: number | null;

  @Column({ name: 'unit_price', type: 'integer' })
  unitPrice: number;

  /**
   * Claim marker: set to the settlement batch that consumed this event.
   * NULL means the event has not been settled yet. Guarantees each play
   * event contributes to revenue exactly once across all settlements.
   */
  @Column({ name: 'settled_batch_id', type: 'uuid', nullable: true })
  settledBatchId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
