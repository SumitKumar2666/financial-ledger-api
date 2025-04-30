import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AccountType } from '../src/accounts/entities/account.entity';
import { EntryType } from '../src/entries/entities/entry.entity';

describe('Ledger API (e2e)', () => {
  let app: INestApplication;
  let cashAccountId: string;
  let revenueAccountId: string;
  let expenseAccountId: string;
  let transactionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Configure app with the same settings as in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // Create test accounts
  describe('Account Management', () => {
    it('should create an asset account (Cash)', () => {
      return request(app.getHttpServer())
        .post('/accounts')
        .send({
          name: 'Cash',
          type: AccountType.ASSET,
          description: 'Cash on hand',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Cash');
          expect(res.body.type).toBe(AccountType.ASSET);
          cashAccountId = res.body.id;
        });
    });

    it('should create a revenue account (Sales)', () => {
      return request(app.getHttpServer())
        .post('/accounts')
        .send({
          name: 'Sales Revenue',
          type: AccountType.REVENUE,
          description: 'Income from sales',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Sales Revenue');
          expect(res.body.type).toBe(AccountType.REVENUE);
          revenueAccountId = res.body.id;
        });
    });

    it('should create an expense account (Supplies)', () => {
      return request(app.getHttpServer())
        .post('/accounts')
        .send({
          name: 'Office Supplies',
          type: AccountType.EXPENSE,
          description: 'Office supplies expenses',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Office Supplies');
          expect(res.body.type).toBe(AccountType.EXPENSE);
          expenseAccountId = res.body.id;
        });
    });

    it('should return a list of all accounts', () => {
      return request(app.getHttpServer())
        .get('/accounts')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(3);

          // Verify our created accounts are in the list
          const accountIds = res.body.map((account) => account.id);
          expect(accountIds).toContain(cashAccountId);
          expect(accountIds).toContain(revenueAccountId);
          expect(accountIds).toContain(expenseAccountId);
        });
    });

    it('should get a specific account by ID', () => {
      return request(app.getHttpServer())
        .get(`/accounts/${cashAccountId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(cashAccountId);
          expect(res.body.name).toBe('Cash');
          expect(res.body.type).toBe(AccountType.ASSET);
        });
    });

    it('should return 404 for non-existent account', () => {
      return request(app.getHttpServer())
        .get('/accounts/00000000-0000-4000-a000-000000000000')
        .expect(404);
    });
  });

  // Test transaction operations
  describe('Transaction Management', () => {
    it('should create a balanced transaction (sale)', () => {
      return request(app.getHttpServer())
        .post('/transactions')
        .send({
          description: 'Sales transaction',
          transactionDate: '2023-05-15',
          reference: 'INV-001',
          entries: [
            {
              accountId: cashAccountId,
              amount: '500.00',
              type: EntryType.DEBIT,
              description: 'Cash received',
            },
            {
              accountId: revenueAccountId,
              amount: '500.00',
              type: EntryType.CREDIT,
              description: 'Revenue recorded',
            },
          ],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.description).toBe('Sales transaction');
          expect(Array.isArray(res.body.entries)).toBe(true);
          expect(res.body.entries.length).toBe(2);

          // Store transaction ID for later tests
          transactionId = res.body.id;
        });
    });

    it('should reject an unbalanced transaction', () => {
      return request(app.getHttpServer())
        .post('/transactions')
        .send({
          description: 'Unbalanced transaction',
          transactionDate: '2023-05-16',
          entries: [
            {
              accountId: cashAccountId,
              amount: '300.00',
              type: EntryType.DEBIT,
              description: 'Cash received',
            },
            {
              accountId: revenueAccountId,
              amount: '250.00', // Not equal to the debit amount
              type: EntryType.CREDIT,
              description: 'Revenue recorded',
            },
          ],
        })
        .expect(400);
    });

    it('should reject a transaction with less than two entries', () => {
      return request(app.getHttpServer())
        .post('/transactions')
        .send({
          description: 'Invalid transaction',
          transactionDate: '2023-05-16',
          entries: [
            {
              accountId: cashAccountId,
              amount: '100.00',
              type: EntryType.DEBIT,
              description: 'Only one entry',
            },
          ],
        })
        .expect(400);
    });

    it('should get a transaction by ID', () => {
      return request(app.getHttpServer())
        .get(`/transactions/${transactionId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(transactionId);
          expect(res.body.description).toBe('Sales transaction');
          expect(Array.isArray(res.body.entries)).toBe(true);
          expect(res.body.entries.length).toBe(2);
        });
    });

    it('should return 404 for non-existent transaction', () => {
      return request(app.getHttpServer())
        .get('/transactions/00000000-0000-4000-a000-000000000000')
        .expect(404);
    });

    it('should create a purchase transaction', () => {
      return request(app.getHttpServer())
        .post('/transactions')
        .send({
          description: 'Office supplies purchase',
          transactionDate: '2023-05-17',
          reference: 'PO-001',
          entries: [
            {
              accountId: expenseAccountId,
              amount: '150.00',
              type: EntryType.DEBIT,
              description: 'Office supplies expense',
            },
            {
              accountId: cashAccountId,
              amount: '150.00',
              type: EntryType.CREDIT,
              description: 'Cash paid',
            },
          ],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.description).toBe('Office supplies purchase');
          expect(Array.isArray(res.body.entries)).toBe(true);
          expect(res.body.entries.length).toBe(2);
        });
    });

    it('should list transactions with filters', () => {
      return request(app.getHttpServer())
        .get('/transactions?startDate=2023-05-01&endDate=2023-05-31')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(2);

          // Check if our created transaction is in the list
          const foundTransaction = res.body.find((t) => t.id === transactionId);
          expect(foundTransaction).toBeDefined();
        });
    });

    it('should filter transactions by account', () => {
      return request(app.getHttpServer())
        .get(`/transactions?accountId=${cashAccountId}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(2);

          // All transactions should involve the cash account
          res.body.forEach((transaction) => {
            const hasEntriesForCashAccount = transaction.entries.some(
              (entry) => entry.accountId === cashAccountId,
            );
            expect(hasEntriesForCashAccount).toBe(true);
          });
        });
    });
  });

  // Test balance calculation
  describe('Account Balance', () => {
    it('should calculate cash account balance correctly', () => {
      return request(app.getHttpServer())
        .get(`/accounts/${cashAccountId}/balance`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('balance');
          expect(res.body.id).toBe(cashAccountId);
          // Cash account should have 500 (sale) - 150 (purchase) = 350
          expect(res.body.balance).toBe('350.00');
        });
    });

    it('should calculate revenue account balance correctly', () => {
      return request(app.getHttpServer())
        .get(`/accounts/${revenueAccountId}/balance`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('balance');
          expect(res.body.id).toBe(revenueAccountId);
          // Revenue account should have 500 from the sale
          expect(res.body.balance).toBe('500.00');
        });
    });

    it('should calculate expense account balance correctly', () => {
      return request(app.getHttpServer())
        .get(`/accounts/${expenseAccountId}/balance`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('balance');
          expect(res.body.id).toBe(expenseAccountId);
          // Expense account should have 150 from the purchase
          expect(res.body.balance).toBe('150.00');
        });
    });
  });
});
