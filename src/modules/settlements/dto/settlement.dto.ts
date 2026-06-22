import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class ExecuteSettlementDto {
  @Type(() => Date)
  @IsDate()
  periodStart: Date;

  @Type(() => Date)
  @IsDate()
  periodEnd: Date;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  idempotencyKey: string;
}
