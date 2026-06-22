"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REMAINDER_ALLOCATION_ORDER = exports.TOTAL_BASIS_POINTS = exports.REVENUE_SPLIT_BASIS_POINTS = exports.SettlementStatus = exports.PartyType = void 0;
var enums_1 = require("./enums");
Object.defineProperty(exports, "PartyType", { enumerable: true, get: function () { return enums_1.PartyType; } });
Object.defineProperty(exports, "SettlementStatus", { enumerable: true, get: function () { return enums_1.SettlementStatus; } });
var revenue_split_constants_1 = require("./constants/revenue-split.constants");
Object.defineProperty(exports, "REVENUE_SPLIT_BASIS_POINTS", { enumerable: true, get: function () { return revenue_split_constants_1.REVENUE_SPLIT_BASIS_POINTS; } });
Object.defineProperty(exports, "TOTAL_BASIS_POINTS", { enumerable: true, get: function () { return revenue_split_constants_1.TOTAL_BASIS_POINTS; } });
Object.defineProperty(exports, "REMAINDER_ALLOCATION_ORDER", { enumerable: true, get: function () { return revenue_split_constants_1.REMAINDER_ALLOCATION_ORDER; } });
//# sourceMappingURL=index.js.map