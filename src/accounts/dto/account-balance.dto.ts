import { Expose } from 'class-transformer';

export class AccountBalanceDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  type: string;

  @Expose()
  balance: string;
}
