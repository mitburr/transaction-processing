import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { PlaidService } from './services/plaid.service';
import { SheetsService } from './services/sheets.service';
import { CategorizerService } from './services/categorizer.service';
import { Deduplicator } from './utils/deduplicator';
import { ProcessedTransaction } from './types/transaction.types';
import { shouldIncludeAccount, getEmailForTransaction } from './config/account.config';

dotenv.config();

async function main() {
  logger.startSection('Transaction Processing');

  try {
    // Initialize services
    const plaid = new PlaidService();
    const sheets = new SheetsService();
    const categorizer = new CategorizerService();
    const deduplicator = new Deduplicator();

    // Calculate date range
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - (parseInt(process.env.LOOKBACK_DAYS || '7') * 24 * 60 * 60 * 1000))
      .toISOString()
      .split('T')[0];

    // Fetch transactions from Plaid
    logger.info(`Fetching transactions from ${startDate} to ${endDate}`);
    const allTransactions = await plaid.getTransactions(startDate, endDate);

    // Filter to only allowed accounts (6623 and 0960) and exclude deposits
    const rawTransactions = allTransactions.filter(tx =>
      shouldIncludeAccount(tx.account_id) && tx.amount > 0 // Positive = debit/expense, Negative = credit/deposit
    );

    logger.info(`Filtered to ${rawTransactions.length} expenses from allowed accounts (6623, 0960)`);

    if (rawTransactions.length === 0) {
      logger.info('No new transactions found in allowed accounts');
      logger.endSection('Transaction Processing');
      return;
    }

    // Load existing sheet data
    await sheets.loadSheet();
    const existingRows = await sheets.getExistingTransactions();
    logger.info(`Loaded ${existingRows.length} existing transactions from sheet`);

    // Process and categorize transactions
    const processedTransactions: ProcessedTransaction[] = rawTransactions.map(tx => {
      const now = new Date();
      const timestamp = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      // Extract card mask if available from payment_meta or check_number
      const cardMask = tx.payment_meta?.reference_number?.slice(-4);

      return {
        timestamp,
        email: getEmailForTransaction(tx.account_id, tx.name, cardMask),
        description: tx.name,
        amount: `$${Math.abs(tx.amount).toFixed(2)}`,
        date: tx.date,
        merchant: tx.merchant_name || tx.name,
        category: categorizer.categorize(tx.merchant_name || '', tx.name),
        notes: tx.pending ? 'Pending' : undefined,
      };
    });

    // Filter duplicates
    const uniqueTransactions = deduplicator.filterDuplicates(processedTransactions, existingRows);

    if (uniqueTransactions.length === 0) {
      logger.info('No new unique transactions to add');
      logger.endSection('Transaction Processing');
      return;
    }

    // Append to Google Sheets
    await sheets.appendTransactions(uniqueTransactions);

    logger.success(`Successfully processed ${uniqueTransactions.length} new transaction(s)`);
    logger.endSection('Transaction Processing');
  } catch (error) {
    logger.error(`Processing failed: ${error}`);
    process.exit(1);
  }
}

main();
