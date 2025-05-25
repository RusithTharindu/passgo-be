import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class BoundingBoxPoint {
  @IsNumber()
  x: number;

  @IsNumber()
  y: number;
}

class ResultItem {
  @IsString()
  text: string;

  @IsNumber()
  confidence: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BoundingBoxPoint)
  boundingBox?: BoundingBoxPoint[];
}

export class DocumentResultDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResultItem)
  results: ResultItem[];
}
