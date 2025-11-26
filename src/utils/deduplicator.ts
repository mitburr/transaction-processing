import { ProcessedTransaction, SheetRow } from '../types/transaction.types';
import { logger } from './logger';

export class Deduplicator {
  /**
   * Check if a transaction already exists in the sheet
   * Matches on: date, amount, and merchant
   */
  isDuplicate(transaction: ProcessedTransaction, existingRows: SheetRow[]): boolean {
    return existingRows.some(row => {
      const dateMatch = row['When buy?'] === transaction.date;
      const amountMatch = row['How many money spent?'] === transaction.amount;
      const merchantMatch = row['Who buy from?']?.toLowerCase() === transaction.merchant.toLowerCase();

      return dateMatch && amountMatch && merchantMatch;
    });
  }

  /**
   * Filter out duplicate transactions
   */
  filterDuplicates(
    transactions: ProcessedTransaction[],
    existingRows: SheetRow[]
  ): ProcessedTransaction[] {
    const unique = transactions.filter(t => !this.isDuplicate(t, existingRows));
    
    const duplicateCount = transactions.length - unique.length;
    if (duplicateCount > 0) {
      logger.info(`Filtered out ${duplicateCount} duplicate transaction(s)`);
    }

    return unique;
  }
}
