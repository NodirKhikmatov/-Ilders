import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ example: 'song-1', description: 'Song identifier' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  songId: string;

  @ApiProperty({ example: 'store-1', description: 'Store identifier' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  storeId: string;

  @ApiProperty({
    example: '2026-04-10T12:00:00.000Z',
    description: 'When the play occurred (ISO 8601)',
  })
  @Type(() => Date)
  @IsDate()
  playedAt: Date;

  @ApiPropertyOptional({
    example: 180,
    description: 'Optional play duration in seconds',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({
    example: 101,
    description:
      'Per-play royalty in whole KRW. Defaults to DEFAULT_UNIT_PRICE_KRW when omitted.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  unitPrice?: number;
}
