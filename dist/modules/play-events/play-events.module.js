"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayEventsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const play_event_entity_1 = require("./entities/play-event.entity");
const play_events_controller_1 = require("./play-events.controller");
const play_events_service_1 = require("./play-events.service");
let PlayEventsModule = class PlayEventsModule {
};
exports.PlayEventsModule = PlayEventsModule;
exports.PlayEventsModule = PlayEventsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([play_event_entity_1.PlayEvent])],
        controllers: [play_events_controller_1.PlayEventsController],
        providers: [play_events_service_1.PlayEventsService],
        exports: [play_events_service_1.PlayEventsService, typeorm_1.TypeOrmModule],
    })
], PlayEventsModule);
//# sourceMappingURL=play-events.module.js.map