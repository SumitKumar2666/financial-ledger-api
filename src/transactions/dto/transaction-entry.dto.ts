import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import { EntryType } from '../../entries/entities/entry.entity';

export class TransactionEntryDto {
  @IsNotEmpty()
  @IsUUID()
  accountId: string;

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
