import { ValueTransformer } from 'typeorm';
import Decimal from 'decimal.js';

/**
 * A custom TypeORM transformer for working with Decimal.js.
 *
 * This ensures decimals are safely stored as strings in the database
 * (to prevent floating-point rounding issues) and correctly parsed
 * back into Decimal instances when reading from the database.
 */
export class DecimalTransformer implements ValueTransformer {
  // Converts database values (stored as strings) back into Decimal instances
  from(value: string | null | undefined): Decimal | null {
    if (value == null) {
      return null;
    }
    return new Decimal(value);
  }

  // Converts Decimal instances (or numbers/strings) into strings for storage
  to(value: Decimal | number | string | null): string | null {
    if (value == null) {
      return null;
    }

    const decimal = value instanceof Decimal ? value : new Decimal(value);
    return decimal.toString();
  }
}

// Export a single reusable instance
export const decimalTransformer = new DecimalTransformer();
