"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REMAINDER_ALLOCATION_ORDER = exports.TOTAL_BASIS_POINTS = exports.REVENUE_SPLIT_BASIS_POINTS = void 0;
const party_type_enum_1 = require("../enums/party-type.enum");
exports.REVENUE_SPLIT_BASIS_POINTS = {
    [party_type_enum_1.PartyType.CREATOR_POOL]: 4000,
    [party_type_enum_1.PartyType.CMO]: 1500,
    [party_type_enum_1.PartyType.PLATFORM]: 4500,
};
exports.TOTAL_BASIS_POINTS = 10_000;
exports.REMAINDER_ALLOCATION_ORDER = [
    party_type_enum_1.PartyType.CREATOR_POOL,
    party_type_enum_1.PartyType.CMO,
    party_type_enum_1.PartyType.PLATFORM,
];
//# sourceMappingURL=revenue-split.constants.js.map