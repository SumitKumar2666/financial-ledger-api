import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, AccountType } from './entities/account.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import Decimal from 'decimal.js';
import { EntryType } from '../entries/entities/entry.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  async create(createAccountDto: CreateAccountDto): Promise<Account> {
    const account = this.accountRepository.create(createAccountDto);
    return this.accountRepository.save(account);
  }

  async findAll(): Promise<Account[]> {
    return this.accountRepository.find();
  }

  async findOne(id: string): Promise<Account> {
    const account = await this.accountRepository.findOne({ where: { id } });

    if (!account) {
      throw new NotFoundException(`Account with ID "${id}" not found`);
    }

    return account;
  }

  async update(id: string, updateAccountDto: UpdateAccountDto): Promise<Account> {
    const account = await this.findOne(id);

    Object.assign(account, updateAccountDto);
    return this.accountRepository.save(account);
  }

  async remove(id: string): Promise<void> {
    const result = await this.accountRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Account with ID "${id}" not found`);
    }
  }

  /**
   * Calculate the balance for a given account using double-entry accounting rules:
   * 
   * - For ASSET and EXPENSE accounts: DEBIT increases the balance, CREDIT decreases it.
   * - For LIABILITY, EQUITY, and REVENUE accounts: CREDIT increases the balance, DEBIT decreases it.
   */
  async getBalance(id: string): Promise<Decimal> {
    const account = await this.findOne(id);

    // Fetch all entries linked to this account
    const accountWithEntries = await this.accountRepository
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.entries', 'entry')
      .where('account.id = :id', { id })
      .getOne();

    if (!accountWithEntries || !accountWithEntries.entries || accountWithEntries.entries.length === 0) {
      return new Decimal(0);
    }

    let balance = new Decimal(0);

    for (const entry of accountWithEntries.entries) {
      const amount = new Decimal(entry.amount);

      if (account.type === AccountType.ASSET || account.type === AccountType.EXPENSE) {
        balance = entry.type === EntryType.DEBIT ? balance.plus(amount) : balance.minus(amount);
      } else {
        balance = entry.type === EntryType.CREDIT ? balance.plus(amount) : balance.minus(amount);
      }
    }

    return balance;
  }
}
