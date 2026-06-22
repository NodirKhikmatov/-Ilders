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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const settlement_batch_entity_1 = require("../settlements/entities/settlement-batch.entity");
const audit_log_entity_1 = require("./entities/audit-log.entity");
let AuditService = class AuditService {
    constructor(auditLogRepository, settlementBatchRepository) {
        this.auditLogRepository = auditLogRepository;
        this.settlementBatchRepository = settlementBatchRepository;
    }
    async getSettlementAuditHistory(settlementId) {
        const settlement = await this.settlementBatchRepository.findOne({
            where: { id: settlementId },
        });
        if (!settlement) {
            throw new common_1.NotFoundException(`Settlement ${settlementId} not found`);
        }
        const auditLogs = await this.auditLogRepository.find({
            where: { settlementBatchId: settlementId },
            order: { createdAt: 'ASC' },
        });
        return this.toSettlementAuditResponse(settlementId, auditLogs);
    }
    toSettlementAuditResponse(settlementId, auditLogs) {
        return {
            settlementId,
            events: auditLogs.map((log) => ({
                eventType: log.eventType,
                payload: log.payload,
                createdAt: log.createdAt.toISOString(),
            })),
        };
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __param(1, (0, typeorm_1.InjectRepository)(settlement_batch_entity_1.SettlementBatch)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], AuditService);
//# sourceMappingURL=audit.service.js.map