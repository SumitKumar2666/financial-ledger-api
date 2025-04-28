import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';
import Decimal from 'decimal.js';

export enum EntryType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

@Entity('entries')
export class Entry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  accountId: string;

  @Column({ type: 'uuid' })
  transactionId: string;

  // Using Decimal.js with transformer to avoid floating-point issues
  @Column({
    type: 'varchar',
    length: 255,
    transformer: decimalTransformer,
  })
  amount: Decimal;

  @Column({
    type: 'enum',
    enum: EntryType,
  })
  type: EntryType;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @ManyToOne(() => Account, (account) => account.entries)
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @ManyToOne(() => Transaction, (transaction) => transaction.entries)
  @JoinColumn({ name: 'transactionId' })
  transaction: Transaction;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
