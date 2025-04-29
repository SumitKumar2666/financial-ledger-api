import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral } from 'typeorm';
import { AccountsService } from './accounts.service';
import { Account, AccountType } from './entities/account.entity';
import { EntryType } from '../entries/entities/entry.entity';
import Decimal from 'decimal.js';
import { NotFoundException } from '@nestjs/common';

// Generic mock for TypeORM repository
type MockRepository<T extends ObjectLiteral = any> = {
  find: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  delete: jest.Mock;
  createQueryBuilder: jest.Mock;
};

// Mock repository function to return all required methods
const createMockRepository = <T extends ObjectLiteral>(): MockRepository<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  }),
});

describe('AccountsService', () => {
  let service: AccountsService;
  let repository: MockRepository<Account>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: getRepositoryToken(Account),
          useValue: createMockRepository<Account>(),
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    repository = module.get<MockRepository<Account>>(getRepositoryToken(Account));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  1
  describe('create', () => {
    it('should create a new account', async () => {
      const dto = { name: 'Cash', type: AccountType.ASSET, description: 'Cash on hand' };
      const account = { id: 'uuid', ...dto, createdAt: new Date(), updatedAt: new Date() };

      repository.create.mockReturnValue(account);
      repository.save.mockResolvedValue(account);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(account);
      expect(result).toEqual(account);
    });
  });

  describe('findAll', () => {
    it('should return an array of accounts', async () => {
      const accounts = [
        { id: 'uuid1', name: 'Cash', type: AccountType.ASSET, createdAt: new Date(), updatedAt: new Date() },
      ];
      repository.find.mockResolvedValue(accounts);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual(accounts);
    });
  });

  describe('findOne', () => {
    it('should return an account when it exists', async () => {
      const id = 'uuid';
      const account = { id, name: 'Cash', type: AccountType.ASSET, createdAt: new Date(), updatedAt: new Date() };

      repository.findOne.mockResolvedValue(account);

      const result = await service.findOne(id);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(result).toEqual(account);
    });

    it('should throw NotFoundException when account does not exist', async () => {
      const id = 'not-found';
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id } });
    });
  });

  describe('getBalance', () => {
    it('should calculate balance correctly for an asset account', async () => {
      const id = 'uuid';
      const account = {
        id,
        name: 'Cash',
        type: AccountType.ASSET,
        entries: [
          { id: 'e1', amount: new Decimal('100'), type: EntryType.DEBIT },
          { id: 'e2', amount: new Decimal('50'), type: EntryType.CREDIT },
        ],
      };
      repository.findOne.mockResolvedValue(account);
      repository.createQueryBuilder()
        .getOne.mockResolvedValue(account);

      const result = await service.getBalance(id);
      expect(result.toString()).toBe('50');
    });

    it('should calculate balance correctly for a liability account', async () => {
      const id = 'uuid';
      const account = {
        id,
        name: 'Payable',
        type: AccountType.LIABILITY,
        entries: [
          { id: 'e1', amount: new Decimal('100'), type: EntryType.CREDIT },
          { id: 'e2', amount: new Decimal('30'), type: EntryType.DEBIT },
        ],
      };
      repository.findOne.mockResolvedValue(account);
      repository.createQueryBuilder()
        .getOne.mockResolvedValue(account);

      const result = await service.getBalance(id);
      expect(result.toString()).toBe('70');
    });

    it('should return zero for an account with no entries', async () => {
      const id = 'uuid';
      const account = { id, name: 'Empty', type: AccountType.ASSET, entries: [] };
      repository.findOne.mockResolvedValue(account);
      repository.createQueryBuilder()
        .getOne.mockResolvedValue(account);

      const result = await service.getBalance(id);
      expect(result.toString()).toBe('0');
    });
  });
});
