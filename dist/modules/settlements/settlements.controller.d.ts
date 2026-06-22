import { ExecuteSettlementDto } from './dto/settlement.dto';
import { SettlementQueryResponseDto } from './dto/settlement-query.dto';
import { SettlementsService } from './settlements.service';
export declare class SettlementsController {
    private readonly settlementsService;
    constructor(settlementsService: SettlementsService);
    execute(dto: ExecuteSettlementDto): Promise<import("./entities").SettlementBatch>;
    getById(id: string): Promise<SettlementQueryResponseDto>;
}
