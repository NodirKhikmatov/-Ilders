"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettlementsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const audit_log_entity_1 = require("../audit/entities/audit-log.entity");
const play_event_entity_1 = require("../play-events/entities/play-event.entity");
const settlement_allocation_entity_1 = require("./entities/settlement-allocation.entity");
const settlement_batch_entity_1 = require("./entities/settlement-batch.entity");
const settlement_calculator_service_1 = require("./settlement-calculator.service");
const settlements_controller_1 = require("./settlements.controller");
const settlements_service_1 = require("./settlements.service");
let SettlementsModule = class SettlementsModule {
};
exports.SettlementsModule = SettlementsModule;
exports.SettlementsModule = SettlementsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                settlement_batch_entity_1.SettlementBatch,
                settlement_allocation_entity_1.SettlementAllocation,
                play_event_entity_1.PlayEvent,
                audit_log_entity_1.AuditLog,
            ]),
        ],
        controllers: [settlements_controller_1.SettlementsController],
        providers: [settlements_service_1.SettlementsService, settlement_calculator_service_1.SettlementCalculatorService],
        exports: [settlements_service_1.SettlementsService, settlement_calculator_service_1.SettlementCalculatorService, typeorm_1.TypeOrmModule],
    })
], SettlementsModule);
//# sourceMappingURL=settlements.module.js.map