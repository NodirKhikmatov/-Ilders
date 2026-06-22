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
exports.SettlementBatch = void 0;
const typeorm_1 = require("typeorm");
const settlement_status_enum_1 = require("../../../common/enums/settlement-status.enum");
let SettlementBatch = class SettlementBatch {
};
exports.SettlementBatch = SettlementBatch;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SettlementBatch.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'idempotency_key', type: 'varchar', length: 255, unique: true }),
    __metadata("design:type", String)
], SettlementBatch.prototype, "idempotencyKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'period_start', type: 'timestamptz' }),
    __metadata("design:type", Date)
], SettlementBatch.prototype, "periodStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'period_end', type: 'timestamptz' }),
    __metadata("design:type", Date)
], SettlementBatch.prototype, "periodEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_revenue', type: 'integer' }),
    __metadata("design:type", Number)
], SettlementBatch.prototype, "totalRevenue", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'status',
        type: 'enum',
        enum: settlement_status_enum_1.SettlementStatus,
        default: settlement_status_enum_1.SettlementStatus.PENDING,
    }),
    __metadata("design:type", String)
], SettlementBatch.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], SettlementBatch.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('SettlementAllocation', 'settlementBatch'),
    __metadata("design:type", Array)
], SettlementBatch.prototype, "allocations", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('AuditLog', 'settlementBatch'),
    __metadata("design:type", Array)
], SettlementBatch.prototype, "auditLogs", void 0);
exports.SettlementBatch = SettlementBatch = __decorate([
    (0, typeorm_1.Entity)('settlement_batches'),
    (0, typeorm_1.Index)('idx_settlement_batches_idempotency_key', ['idempotencyKey'], { unique: true }),
    (0, typeorm_1.Check)('CHK_settlement_batches_total_revenue_non_negative', '"total_revenue" >= 0')
], SettlementBatch);
//# sourceMappingURL=settlement-batch.entity.js.map