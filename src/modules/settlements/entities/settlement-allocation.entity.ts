import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PartyType } from '../../../common/enums/party-type.enum';
import { SettlementBatch } from './settlement-batch.entity';

@Entity('settlement_allocations')
@Index('idx_settlement_allocations_song_id', ['songId'])
@Index('idx_settlement_allocations_settlement_batch_id', ['settlementBatchId'])
@Check(
  'CHK_settlement_allocations_allocated_amount_non_negative',
  '"allocated_amount" >= 0',
)
export class SettlementAllocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'settlement_batch_id', type: 'uuid' })
  settlementBatchId: string;

  @ManyToOne(() => SettlementBatch, (batch) => batch.allocations, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'settlement_batch_id' })
  settlementBatch: SettlementBatch;

  @Column({ name: 'song_id', type: 'varchar', length: 255 })
  songId: string;

  @Column({
    name: 'party_type',
    type: 'enum',
    enum: PartyType,
  })
  partyType: PartyType;

  @Column({ name: 'allocated_amount', type: 'integer' })
  allocatedAmount: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
