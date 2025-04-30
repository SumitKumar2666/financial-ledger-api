import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { AccountType } from '../entities/account.entity';

export class CreateAccountDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  name: string;

  @IsEnum(AccountType)
  @IsNotEmpty()
  type: AccountType;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;
}
