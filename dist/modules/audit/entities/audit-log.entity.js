"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
const typeorm_1 = require("typeorm");
const settlement_batch_entity_1 = require("../../settlements/entities/settlement-batch.entity");
let AuditLog = class AuditLog {
};
exports.AuditLog = AuditLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AuditLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'settlement_batch_id', type: 'uuid' }),
    __metadata("design:type", String)
], AuditLog.prototype, "settlementBatchId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => settlement_batch_entity_1.SettlementBatch, (batch) => batch.auditLogs, {
        onDelete: 'RESTRICT',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'settlement_batch_id' }),
    __metadata("design:type", settlement_batch_entity_1.SettlementBatch)
], AuditLog.prototype, "settlementBatch", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'event_type', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], AuditLog.prototype, "eventType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payload', type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], AuditLog.prototype, "payload", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], AuditLog.prototype, "createdAt", void 0);
exports.AuditLog = AuditLog = __decorate([
    (0, typeorm_1.Entity)('audit_logs'),
    (0, typeorm_1.Index)('idx_audit_logs_settlement_batch_id', ['settlementBatchId']),
    (0, typeorm_1.Index)('idx_audit_logs_event_type', ['eventType']),
    (0, typeorm_1.Index)('idx_audit_logs_created_at', ['createdAt'])
], AuditLog);
//# sourceMappingURL=audit-log.entity.js.map