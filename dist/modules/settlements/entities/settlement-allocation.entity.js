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
exports.SettlementAllocation = void 0;
const typeorm_1 = require("typeorm");
const party_type_enum_1 = require("../../../common/enums/party-type.enum");
const settlement_batch_entity_1 = require("./settlement-batch.entity");
let SettlementAllocation = class SettlementAllocation {
};
exports.SettlementAllocation = SettlementAllocation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SettlementAllocation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'settlement_batch_id', type: 'uuid' }),
    __metadata("design:type", String)
], SettlementAllocation.prototype, "settlementBatchId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => settlement_batch_entity_1.SettlementBatch, (batch) => batch.allocations, {
        onDelete: 'RESTRICT',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'settlement_batch_id' }),
    __metadata("design:type", settlement_batch_entity_1.SettlementBatch)
], SettlementAllocation.prototype, "settlementBatch", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'song_id', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], SettlementAllocation.prototype, "songId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'party_type',
        type: 'enum',
        enum: party_type_enum_1.PartyType,
    }),
    __metadata("design:type", String)
], SettlementAllocation.prototype, "partyType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'allocated_amount', type: 'integer' }),
    __metadata("design:type", Number)
], SettlementAllocation.prototype, "allocatedAmount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], SettlementAllocation.prototype, "createdAt", void 0);
exports.SettlementAllocation = SettlementAllocation = __decorate([
    (0, typeorm_1.Entity)('settlement_allocations'),
    (0, typeorm_1.Index)('idx_settlement_allocations_song_id', ['songId']),
    (0, typeorm_1.Index)('idx_settlement_allocations_settlement_batch_id', ['settlementBatchId']),
    (0, typeorm_1.Check)('CHK_settlement_allocations_allocated_amount_non_negative', '"allocated_amount" >= 0')
], SettlementAllocation);
//# sourceMappingURL=settlement-allocation.entity.js.map