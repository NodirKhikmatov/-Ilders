import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePlayEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  songId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  storeId: string;

  @Type(() => Date)
  @IsDate()
  playedAt: Date;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  /**
   * Optional. Per-play royalty in whole KRW. Defaults to
   * DEFAULT_UNIT_PRICE_KRW when omitted.
   */
  @IsOptional()
  @IsInt()
  @Min(0)
  unitPrice?: number;
}
