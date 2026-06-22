export class AuditEventDto {
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export class SettlementAuditResponseDto {
  settlementId: string;
  events: AuditEventDto[];
}
