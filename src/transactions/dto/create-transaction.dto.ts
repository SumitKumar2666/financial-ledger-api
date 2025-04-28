import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { CreateEntryDto } from '../../entries/dto/create-entry.dto';

export class CreateTransactionDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 500)
  description: string;

  @IsNotEmpty()
  @IsDateString()
  transactionDate: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  reference?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEntryDto)
  entries: CreateEntryDto[];
}
