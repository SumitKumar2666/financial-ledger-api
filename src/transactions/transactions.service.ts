import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import Decimal from 'decimal.js';

import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { EntriesService } from '../entries/entries.service';
import { AccountsService } from '../accounts/accounts.service';
import { EntryType } from '../entries/entities/entry.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly entriesService: EntriesService,
    private readonly accountsService: AccountsService,
  ) {}

  /**
   * Create a new transaction along with its entries.
   * 
   * - Must have at least two entries.
   * - Total debits must equal total credits.
   */
  async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    const { entries, ...transactionData } = createTransactionDto;

    if (!entries || entries.length < 2) {
      throw new BadRequestException('A transaction must have at least two entries.');
    }

    // Ensure all referenced accounts exist
    for (const entry of entries) {
      await this.accountsService.findOne(entry.accountId);
    }

    let totalDebits = new Decimal(0);
    let totalCredits = new Decimal(0);

    for (const entry of entries) {
      const amount = new Decimal(entry.amount);

      if (amount.isNegative()) {
        throw new BadRequestException('Entry amounts must be positive values.');
      }

      if (entry.type === EntryType.DEBIT) {
        totalDebits = totalDebits.plus(amount);
      } else {
        totalCredits = totalCredits.plus(amount);
      }
    }

    if (!totalDebits.equals(totalCredits)) {
      throw new BadRequestException(`Debits (${totalDebits}) must equal credits (${totalCredits}).`);
    }

    const transaction = this.transactionRepository.create(transactionData);
    const savedTransaction = await this.transactionRepository.save(transaction);

    const entriesWithTransactionId = entries.map((entry) => ({
      ...entry,
      transactionId: savedTransaction.id,
    }));

    await this.entriesService.createMany(entriesWithTransactionId);

    return this.findOne(savedTransaction.id);
  }

  /**
   * Retrieve all transactions, optionally filtered by date range or account.
   */
  async findAll(filters?: TransactionFilterDto): Promise<Transaction[]> {
    const where: FindOptionsWhere<Transaction> = {};

    if (filters?.startDate && filters?.endDate) {
      where.transactionDate = Between(
        new Date(filters.startDate),
        new Date(filters.endDate),
      );
    } else if (filters?.startDate) {
      where.transactionDate = Between(
        new Date(filters.startDate),
        new Date('9999-12-31'),
      );
    } else if (filters?.endDate) {
      where.transactionDate = Between(
        new Date('2000-01-01'),
        new Date(filters.endDate),
      );
    }

    if (filters?.accountId) {
      return this.transactionRepository
        .createQueryBuilder('transaction')
        .innerJoinAndSelect('transaction.entries', 'entry')
        .innerJoinAndSelect('entry.account', 'account')
        .where(where)
        .andWhere('entry.accountId = :accountId', { accountId: filters.accountId })
        .getMany();
    }

    return this.transactionRepository.find({
      where,
      relations: ['entries', 'entries.account'],
      order: {
        transactionDate: 'DESC',
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Retrieve a single transaction by its ID.
   */
  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['entries', 'entries.account'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID "${id}" not found.`);
    }

    return transaction;
  }
}
