import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SettlementStatus } from '../../../common/enums/settlement-status.enum';
import type { AuditLog } from '../../audit/entities/audit-log.entity';
import type { SettlementAllocation } from './settlement-allocation.entity';

@Entity('settlement_batches')
@Index('idx_settlement_batches_idempotency_key', ['idempotencyKey'], { unique: true })
@Check('CHK_settlement_batches_total_revenue_non_negative', '"total_revenue" >= 0')
export class SettlementBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 255, unique: true })
  idempotencyKey: string;

  @Column({ name: 'period_start', type: 'timestamptz' })
  periodStart: Date;

  @Column({ name: 'period_end', type: 'timestamptz' })
  periodEnd: Date;

  @Column({ name: 'total_revenue', type: 'integer' })
  totalRevenue: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: SettlementStatus,
    default: SettlementStatus.PENDING,
  })
  status: SettlementStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @OneToMany('SettlementAllocation', 'settlementBatch')
  allocations: SettlementAllocation[];

  @OneToMany('AuditLog', 'settlementBatch')
  auditLogs: AuditLog[];
}
