export declare class AuditEventDto {
    eventType: string;
    payload: Record<string, unknown>;
    createdAt: string;
}
export declare class SettlementAuditResponseDto {
    settlementId: string;
    events: AuditEventDto[];
}
