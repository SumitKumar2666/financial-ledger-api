import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Decimal from 'decimal.js';

import { Entry } from './entities/entry.entity';
import { CreateEntryDto } from './dto/create-entry.dto';

@Injectable()
export class EntriesService {
  constructor(
    @InjectRepository(Entry)
    private readonly entryRepository: Repository<Entry>,
  ) {}

  /**
   * Create a single entry.
   */
  async create(createEntryDto: CreateEntryDto): Promise<Entry> {
    const entry = this.entryRepository.create({
      ...createEntryDto,
      amount: new Decimal(createEntryDto.amount),
    });

    return this.entryRepository.save(entry);
  }

  /**
   * Create multiple entries at once.
   */
  async createMany(createEntryDtos: CreateEntryDto[]): Promise<Entry[]> {
    const entries = createEntryDtos.map(dto =>
      this.entryRepository.create({
        ...dto,
        amount: new Decimal(dto.amount),
      }),
    );

    return this.entryRepository.save(entries);
  }

  /**
   * Find all entries linked to a specific account.
   */
  async findByAccountId(accountId: string): Promise<Entry[]> {
    return this.entryRepository.find({
      where: { accountId },
      relations: ['transaction'],
    });
  }

  /**
   * Find all entries linked to a specific transaction.
   */
  async findByTransactionId(transactionId: string): Promise<Entry[]> {
    return this.entryRepository.find({
      where: { transactionId },
      relations: ['account'],
    });
  }

  /**
   * Find a single entry by its ID.
   */
  async findOne(id: string): Promise<Entry> {
    const entry = await this.entryRepository.findOne({
      where: { id },
      relations: ['account', 'transaction'],
    });

    if (!entry) {
      throw new NotFoundException(`Entry with ID "${id}" not found.`);
    }

    return entry;
  }
}
