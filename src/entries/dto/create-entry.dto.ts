import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import { EntryType } from '../entities/entry.entity';

export class CreateEntryDto {
  @IsNotEmpty()
  @IsUUID()
  accountId: string;

  @IsNotEmpty()
  @IsUUID()
  transactionId: string;

  @IsNotEmpty()
  @IsString()
  // This regex ensures we only accept valid decimal numbers
  @Matches(/^-?\d+(\.\d+)?$/, {
    message: 'Amount must be a valid decimal number',
  })
  amount: string;

  @IsNotEmpty()
  @IsEnum(EntryType)
  type: EntryType;

  @IsOptional()
  @IsString()
  description?: string;
}
