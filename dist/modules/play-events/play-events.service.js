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
exports.PlayEventsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const play_event_constants_1 = require("../../common/constants/play-event.constants");
const play_event_entity_1 = require("./entities/play-event.entity");
let PlayEventsService = class PlayEventsService {
    constructor(playEventRepository) {
        this.playEventRepository = playEventRepository;
    }
    async record(dto) {
        const playEvent = this.playEventRepository.create({
            songId: dto.songId,
            storeId: dto.storeId,
            playedAt: dto.playedAt,
            duration: dto.duration ?? null,
            unitPrice: dto.unitPrice ?? play_event_constants_1.DEFAULT_UNIT_PRICE_KRW,
            settledBatchId: null,
        });
        return this.playEventRepository.save(playEvent);
    }
    async findById(id) {
        return this.playEventRepository.findOne({ where: { id } });
    }
    async findUnsettled(limit) {
        return this.playEventRepository.find({
            where: { settledBatchId: (0, typeorm_2.IsNull)() },
            order: { playedAt: 'ASC' },
            take: limit,
        });
    }
};
exports.PlayEventsService = PlayEventsService;
exports.PlayEventsService = PlayEventsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(play_event_entity_1.PlayEvent)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PlayEventsService);
//# sourceMappingURL=play-events.service.js.map