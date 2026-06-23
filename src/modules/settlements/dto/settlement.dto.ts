import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class ExecuteSettlementDto {
  @ApiProperty({
    example: '2026-04-01T00:00:00.000Z',
    description: 'Inclusive period start (ISO 8601)',
  })
  @Type(() => Date)
  @IsDate()
  periodStart: Date;

  @ApiProperty({
    example: '2026-04-30T23:59:59.999Z',
    description: 'Inclusive period end (ISO 8601)',
  })
  @Type(() => Date)
  @IsDate()
  periodEnd: Date;

  @ApiProperty({
    example: 'apr-2026',
    description:
      'Idempotency key. Re-sending the same key returns the existing settlement instead of creating a duplicate.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  idempotencyKey: string;
}
