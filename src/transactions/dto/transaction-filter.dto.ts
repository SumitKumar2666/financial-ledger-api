import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class TransactionFilterDto {
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
