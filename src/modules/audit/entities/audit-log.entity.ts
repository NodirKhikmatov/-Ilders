import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SettlementBatch } from '../../settlements/entities/settlement-batch.entity';

@Entity('audit_logs')
@Index('idx_audit_logs_settlement_batch_id', ['settlementBatchId'])
@Index('idx_audit_logs_event_type', ['eventType'])
@Index('idx_audit_logs_created_at', ['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'settlement_batch_id', type: 'uuid' })
  settlementBatchId: string;

  @ManyToOne(() => SettlementBatch, (batch) => batch.auditLogs, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'settlement_batch_id' })
  settlementBatch: SettlementBatch;

  @Column({ name: 'event_type', type: 'varchar', length: 100 })
  eventType: string;

  @Column({ name: 'payload', type: 'jsonb', default: {} })
  payload: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
