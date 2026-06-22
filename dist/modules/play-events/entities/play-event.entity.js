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
exports.PlayEvent = void 0;
const typeorm_1 = require("typeorm");
let PlayEvent = class PlayEvent {
};
exports.PlayEvent = PlayEvent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PlayEvent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'song_id', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], PlayEvent.prototype, "songId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'store_id', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], PlayEvent.prototype, "storeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'played_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], PlayEvent.prototype, "playedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'duration', type: 'integer', nullable: true }),
    __metadata("design:type", Object)
], PlayEvent.prototype, "duration", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unit_price', type: 'integer' }),
    __metadata("design:type", Number)
], PlayEvent.prototype, "unitPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'settled_batch_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], PlayEvent.prototype, "settledBatchId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], PlayEvent.prototype, "createdAt", void 0);
exports.PlayEvent = PlayEvent = __decorate([
    (0, typeorm_1.Entity)('play_events'),
    (0, typeorm_1.Index)('idx_play_events_song_id', ['songId']),
    (0, typeorm_1.Index)('idx_play_events_played_at', ['playedAt']),
    (0, typeorm_1.Index)('idx_play_events_settled_batch_id', ['settledBatchId']),
    (0, typeorm_1.Check)('CHK_play_events_unit_price_non_negative', '"unit_price" >= 0'),
    (0, typeorm_1.Check)('CHK_play_events_duration_non_negative', '"duration" IS NULL OR "duration" >= 0')
], PlayEvent);
//# sourceMappingURL=play-event.entity.js.map