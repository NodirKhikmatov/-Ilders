"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettlementCalculatorService = void 0;
const common_1 = require("@nestjs/common");
const revenue_split_constants_1 = require("../../common/constants/revenue-split.constants");
const party_type_enum_1 = require("../../common/enums/party-type.enum");
let SettlementCalculatorService = class SettlementCalculatorService {
    calculate(songRevenue) {
        if (!Number.isInteger(songRevenue) || songRevenue < 0) {
            throw new Error('songRevenue must be a non-negative integer');
        }
        const shares = this.computeFloorsAndRemainders(songRevenue);
        const allocated = this.distributeRemainder(songRevenue, shares);
        const creatorPool = allocated.get(party_type_enum_1.PartyType.CREATOR_POOL);
        const cmo = allocated.get(party_type_enum_1.PartyType.CMO);
        const platform = allocated.get(party_type_enum_1.PartyType.PLATFORM);
        return {
            creatorPool,
            cmo,
            platform,
            totalAllocated: creatorPool + cmo + platform,
        };
    }
    computeFloorsAndRemainders(songRevenue) {
        return revenue_split_constants_1.REMAINDER_ALLOCATION_ORDER.map((party) => {
            const product = songRevenue * revenue_split_constants_1.REVENUE_SPLIT_BASIS_POINTS[party];
            return {
                party,
                floor: Math.floor(product / revenue_split_constants_1.TOTAL_BASIS_POINTS),
                remainder: product % revenue_split_constants_1.TOTAL_BASIS_POINTS,
            };
        });
    }
    distributeRemainder(songRevenue, shares) {
        const allocated = new Map(shares.map(({ party, floor }) => [party, floor]));
        const totalFloor = shares.reduce((sum, { floor }) => sum + floor, 0);
        const leftover = songRevenue - totalFloor;
        const ranked = [...shares].sort((a, b) => {
            if (b.remainder !== a.remainder) {
                return b.remainder - a.remainder;
            }
            return (revenue_split_constants_1.REMAINDER_ALLOCATION_ORDER.indexOf(a.party) -
                revenue_split_constants_1.REMAINDER_ALLOCATION_ORDER.indexOf(b.party));
        });
        for (let i = 0; i < leftover; i++) {
            const party = ranked[i].party;
            allocated.set(party, allocated.get(party) + 1);
        }
        return allocated;
    }
};
exports.SettlementCalculatorService = SettlementCalculatorService;
exports.SettlementCalculatorService = SettlementCalculatorService = __decorate([
    (0, common_1.Injectable)()
], SettlementCalculatorService);
//# sourceMappingURL=settlement-calculator.service.js.map