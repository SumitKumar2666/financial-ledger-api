import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Between } from 'typeorm';
import { TransactionsService } from './transactions.service';
import { Transaction } from './entities/transaction.entity';
import { EntriesService } from '../entries/entries.service';
import { AccountsService } from '../accounts/accounts.service';
import { Account, AccountType } from '../accounts/entities/account.entity';
import { EntryType } from '../entries/entities/entry.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { CreateTransactionDto } from './dto/create-transaction.dto';

// Generic mock for TypeORM repository
type MockRepository<T extends ObjectLiteral = any> = {
  find: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  createQueryBuilder: jest.Mock;
};

// Mock repository function to return all required methods
const createMockRepository = <
  T extends ObjectLiteral,
>(): MockRepository<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue({
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  }),
});

// Mocked auxiliary services
type MockEntriesService = {
  createMany: jest.Mock;
  findByTransactionId: jest.Mock;
};
const createMockEntriesService = (): MockEntriesService => ({
  createMany: jest.fn(),
  findByTransactionId: jest.fn(),
});

type MockAccountsService = {
  findOne: jest.Mock;
};
const createMockAccountsService = (): MockAccountsService => ({
  findOne: jest.fn(),
});

describe('TransactionsService', () => {
  let service: TransactionsService;
  let repository: MockRepository<Transaction>;
  let entriesService: MockEntriesService;
  let accountsService: MockAccountsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: createMockRepository<Transaction>(),
        },
        { provide: EntriesService, useValue: createMockEntriesService() },
        { provide: AccountsService, useValue: createMockAccountsService() },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    repository = module.get(getRepositoryToken(Transaction));
    entriesService = module.get(EntriesService);
    accountsService = module.get(AccountsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a balanced transaction successfully', async () => {
      const cashAccount = {
        id: 'a1',
        name: 'Cash',
        type: AccountType.ASSET,
      } as Account;
      const revAccount = {
        id: 'r1',
        name: 'Revenue',
        type: AccountType.REVENUE,
      } as Account;

      const dto: CreateTransactionDto = {
        description: 'Sale',
        transactionDate: '2025-04-29',
        reference: 'REF1',
        entries: [
          {
            accountId: cashAccount.id,
            amount: '100',
            type: EntryType.DEBIT,
            description: 'Cash in',
          },
          {
            accountId: revAccount.id,
            amount: '100',
            type: EntryType.CREDIT,
            description: 'Sale',
          },
        ],
      };

      const createdTx = {
        id: 't1',
        description: dto.description,
        transactionDate: new Date(dto.transactionDate),
        reference: dto.reference,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const savedEntries = dto.entries.map((e, i) => ({
        id: `e${i}`,
        accountId: e.accountId,
        transactionId: createdTx.id,
        amount: new Decimal(e.amount),
        type: e.type,
        description: e.description,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      const txWithEntries = { ...createdTx, entries: savedEntries };

      // mocks
      accountsService.findOne
        .mockResolvedValueOnce(cashAccount)
        .mockResolvedValueOnce(revAccount);
      repository.create.mockReturnValue(createdTx);
      repository.save.mockResolvedValue(createdTx);
      entriesService.createMany.mockResolvedValue(savedEntries);

      // spy on findOne
      jest.spyOn(service, 'findOne').mockResolvedValue(txWithEntries as any);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ description: dto.description }),
      );
      expect(repository.save).toHaveBeenCalledWith(createdTx);
      const expectedDtos = dto.entries.map((e) => ({
        ...e,
        transactionId: createdTx.id,
      }));
      expect(entriesService.createMany).toHaveBeenCalledWith(expectedDtos);
      expect(result).toEqual(txWithEntries);
    });

    it('should throw if less than two entries', async () => {
      const dto = {
        description: 'Bad',
        transactionDate: '2025-04-29',
        entries: [
          {
            accountId: 'a1',
            amount: '50',
            type: EntryType.DEBIT,
            description: 'Only one',
          },
        ],
      } as CreateTransactionDto;
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw if debits ≠ credits', async () => {
      const cash = { id: 'a1', type: AccountType.ASSET } as Account;
      const rev = { id: 'r1', type: AccountType.REVENUE } as Account;
      const dto = {
        description: 'Bad',
        transactionDate: '2025-04-29',
        entries: [
          {
            accountId: cash.id,
            amount: '100',
            type: EntryType.DEBIT,
            description: '',
          },
          {
            accountId: rev.id,
            amount: '90',
            type: EntryType.CREDIT,
            description: '',
          },
        ],
      } as CreateTransactionDto;

      accountsService.findOne
        .mockResolvedValueOnce(cash)
        .mockResolvedValueOnce(rev);
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns all transactions', async () => {
      const txs = [{ id: 't1' }, { id: 't2' }];
      repository.find.mockResolvedValue(txs);
      const result = await service.findAll();
      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual(txs);
    });

    it('filters by date range', async () => {
      const txs = [{ id: 't1', transactionDate: new Date('2025-04-29') }];
      repository.find.mockResolvedValue(txs);
      const filters = { startDate: '2025-04-01', endDate: '2025-04-31' };
      const result = await service.findAll(filters as any);
      expect(repository.find).toHaveBeenCalledWith({
        where: {
          transactionDate: Between(
            new Date(filters.startDate),
            new Date(filters.endDate),
          ),
        },
        relations: ['entries', 'entries.account'],
        order: { transactionDate: 'DESC', createdAt: 'DESC' },
      });
      expect(result).toEqual(txs);
    });
  });

  describe('findOne', () => {
    it('returns a transaction if found', async () => {
      const tx = { id: 't1' };
      repository.findOne.mockResolvedValue(tx);
      const result = await service.findOne('t1');
      expect(repository.findOne).toHaveBeenCalled();
      expect(result).toEqual(tx);
    });

    it('throws if not found', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });
});
