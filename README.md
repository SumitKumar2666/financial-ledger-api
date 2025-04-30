# Financial Ledger API

A double-entry accounting API built with NestJS and PostgreSQL. This project implements the core components of a financial ledger system where all transactions must follow double-entry accounting principles.

## What it does

The API allows you to:
- Create and manage different account types (Asset, Liability, Equity, Revenue, Expense)
- Record balanced financial transactions (debits = credits)
- Calculate account balances based on transaction history
- Query transactions with various filters

I built this using NestJS and TypeScript with a PostgreSQL database. I chose these technologies because they provide a solid foundation for building type-safe, maintainable APIs that can scale well.

## Getting Started

### Prerequisites

You'll need:
- Node.js (v16+)
- npm 
- Docker and Docker Compose (for running PostgreSQL)

### Setup

Clone and install dependencies:

```bash
git clone https://github.com/SumitKumar2666/financial-ledger-api.git
cd financial-ledger-api
npm install
```

Start the PostgreSQL database with Docker:

```bash
docker compose up -d # or docker-compose up -d
```

Create a `.env` file in the project root, you can refer the `.env.example`:

```
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=ledgerdb
DB_SYNCHRONIZE=true
DB_LOGGING=true
```

Run the database migrations:

```bash
npm run migration:run
```

Start the development server:

```bash
npm run start:dev
```

You should now be able to access the API at `http://localhost:3000` and the Swagger docs at `http://localhost:3000/api`.

## API Endpoints

Here are the main endpoints:

### Accounts
- `POST /accounts` - Create a new account
- `GET /accounts` - List all accounts
- `GET /accounts/:id` - Get a specific account
- `GET /accounts/:id/balance` - Get the balance of an account
- `PUT /accounts/:id` - Update an account
- `DELETE /accounts/:id` - Delete an account

### Transactions
- `POST /transactions` - Create a new transaction with entries
- `GET /transactions` - List transactions (can filter by account, date range - start and end date)
- `GET /transactions/:id` - Get a specific transaction

## Transaction Validation

Transactions must follow double-entry accounting rules:
1. Each transaction needs at least two entries
2. The sum of debits must equal the sum of credits
3. For Asset and Expense accounts:
   - DEBITs increase the balance
   - CREDITs decrease the balance
4. For Liability, Equity, and Revenue accounts:
   - CREDITs increase the balance
   - DEBITs decrease the balance

If these rules are violated, the API will return a 400 error with a helpful message.

## Data Model

The system uses three main entities:

### Account
Represents a financial account, categorized by type:
- `ASSET` - Resources owned (Cash, Inventory, etc.)
- `LIABILITY` - Obligations (Accounts Payable, Loans, etc.)
- `EQUITY` - Owner's interest (Capital, Retained Earnings)
- `REVENUE` - Income sources (Sales, Service Fees, etc.)
- `EXPENSE` - Costs (Rent, Utilities, Salaries, etc.)

### Transaction
Represents a financial event with:
- Description
- Date
- Optional reference code
- Two or more entries that balance

### Entry
Connects transactions to accounts:
- Links to both a transaction and an account
- Has an amount
- Has a type (DEBIT or CREDIT)
- Optional description

## Testing

Run unit tests:
```bash
npm run test
```

Run end-to-end tests:
```bash
npm run test:e2e
```

I've tried to keep the test coverage fairly comprehensive, with focus on the critical parts like transaction validation and balance calculation.

## Implementation Notes

### Avoiding Floating-Point Errors

Dealing with money in software is tricky due to floating-point precision issues. I used Decimal.js to handle all calculations and stored amounts as strings in the database to avoid any rounding problems.

### Transaction Validation

The transaction validation logic ensures all accounting principles are enforced. I spent extra time on this part to make sure it properly validates:
- Existence of accounts
- Balance of debits and credits
- Minimum required entries
- Positive amounts

### Error Handling

I implemented a global exception filter to provide consistent error responses. This was really helpful during testing to quickly identify issues.

## Future Improvements

Some things I'd like to add if I had more time:
- User authentication/authorization system
- Account hierarchies (parent-child relationships)
- More advanced filtering and reporting
- Proper audit logging
- Support for different currencies
- Transaction tagging/categorization

## Running in Production

For production deployment, you'll want to:

1. Set `DB_SYNCHRONIZE=false` in your .env file
2. Run migrations explicitly with `npm run migration:run`
3. Use a proper secret management system for database credentials
4. Set up proper logging
5. Add rate limiting for API endpoints

## Troubleshooting

If you see migration errors, try:
```bash
npm run migration:revert
npm run migration:run
```

If you're getting connection issues with PostgreSQL, check:
- Docker is running
- The PostgreSQL port (5432) isn't being used by another process
- Your .env file has the correct connection details

## License

This project is licensed under the MIT License - see the LICENSE file for details.