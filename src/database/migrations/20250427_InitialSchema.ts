import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema20250427 implements MigrationInterface {
  name = 'InitialSchema20250427';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create accounts table
    await queryRunner.query(`
      CREATE TYPE "public"."account_type_enum" AS ENUM(
        'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "accounts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "type" "public"."account_type_enum" NOT NULL DEFAULT 'ASSET',
        "description" character varying(500),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "pk_accounts" PRIMARY KEY ("id")
      )
    `);

    // Create transactions table
    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "description" character varying(500) NOT NULL,
        "transaction_date" date NOT NULL,
        "reference" character varying(255),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "pk_transactions" PRIMARY KEY ("id")
      )
    `);

    // Create entries table
    await queryRunner.query(`
      CREATE TYPE "public"."entry_type_enum" AS ENUM(
        'DEBIT', 'CREDIT'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "entries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "account_id" uuid NOT NULL,
        "transaction_id" uuid NOT NULL,
        "amount" character varying(255) NOT NULL,
        "type" "public"."entry_type_enum" NOT NULL,
        "description" character varying(500),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "pk_entries" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "entries" 
      ADD CONSTRAINT "fk_entries_account" 
      FOREIGN KEY ("account_id") 
      REFERENCES "accounts"("id") 
      ON DELETE NO ACTION 
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "entries" 
      ADD CONSTRAINT "fk_entries_transaction" 
      FOREIGN KEY ("transaction_id") 
      REFERENCES "transactions"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);

    // Add indexes to improve lookup performance
    await queryRunner.query(`
      CREATE INDEX "idx_entries_account_id" ON "entries" ("account_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_entries_transaction_id" ON "entries" ("transaction_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_transactions_date" ON "transactions" ("transaction_date")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    await queryRunner.query(
      `ALTER TABLE "entries" DROP CONSTRAINT "fk_entries_transaction"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entries" DROP CONSTRAINT "fk_entries_account"`,
    );

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX "idx_transactions_date"
    `);

    await queryRunner.query(`
      DROP INDEX "idx_entries_transaction_id"
    `);

    await queryRunner.query(`
      DROP INDEX "idx_entries_account_id"
    `);

    // Drop tables
    await queryRunner.query(`DROP TABLE "entries"`);
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TABLE "accounts"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "public"."entry_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."account_type_enum"`);
  }
}
