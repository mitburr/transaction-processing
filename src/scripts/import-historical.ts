import dotenv from 'dotenv';
import { logger } from '../utils/logger';
import { PlaidService } from '../services/plaid.service';
import { SheetsService } from '../services/sheets.service';
import { CategorizerService } from '../services/categorizer.service';
import { Deduplicator } from '../utils/deduplicator';
import { ProcessedTransaction } from '../types/transaction.types';
import { shouldIncludeAccount, getEmailForTransaction } from '../config/account.config';

dotenv.config();

async function importHistorical() {
  logger.startSection('Historical Data Import');

  try {
    // Calculate 6 months back
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - (180 * 24 * 60 * 60 * 1000)) // 180 days = ~6 months
      .toISOString()
      .split('T')[0];

    logger.info(`Importing transactions from ${startDate} to ${endDate} (6 months)`);

    // Initialize services
    const plaid = new PlaidService();
    const sheets = new SheetsService();
    const categorizer = new CategorizerService();
    const deduplicator = new Deduplicator();

    // Fetch all transactions (may take a while)
    logger.info('Fetching historical transactions from Plaid...');
    const allTransactions = await plaid.getTransactions(startDate, endDate);
    logger.success(`Fetched ${allTransactions.length} total transactions`);

    // Filter to allowed accounts and expenses only
    const rawTransactions = allTransactions.filter(tx =>
      shouldIncludeAccount(tx.account_id) && tx.amount > 0 // Only expenses
    );
    logger.info(`Filtered to ${rawTransactions.length} expenses from allowed accounts`);

    if (rawTransactions.length === 0) {
      logger.warn('No transactions to import');
      logger.endSection('Historical Data Import');
      return;
    }

    // Load existing sheet data
    await sheets.loadSheet();
    const existingRows = await sheets.getExistingTransactions();
    logger.info(`Loaded ${existingRows.length} existing transactions from sheet`);

    // Process and categorize transactions
    logger.info('Processing and categorizing transactions...');
    const processedTransactions: ProcessedTransaction[] = rawTransactions.map(tx => {
      const now = new Date();
      const timestamp = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      const cardMask = tx.payment_meta?.reference_number?.slice(-4);

      return {
        timestamp,
        email: getEmailForTransaction(tx.account_id, tx.name, cardMask),
        description: tx.name,
        amount: \`$\${Math.abs(tx.amount).toFixed(2)}\`,
        date: tx.date,
        merchant: tx.merchant_name || tx.name,
        category: categorizer.categorize(tx.merchant_name || '', tx.name),
        notes: tx.pending ? 'Pending' : undefined,
      };
    });

    // Filter duplicates
    const uniqueTransactions = deduplicator.filterDuplicates(processedTransactions, existingRows);

    if (uniqueTransactions.length === 0) {
      logger.info('No new unique transactions to import');
      logger.endSection('Historical Data Import');
      return;
    }

    logger.info(`Found ${uniqueTransactions.length} new unique transactions to import`);

    // Show categorization breakdown
    const byCategory: Record<string, number> = {};
    uniqueTransactions.forEach(tx => {
      byCategory[tx.category] = (byCategory[tx.category] || 0) + 1;
    });

    console.log('\\n' + '='.repeat(80));
    logger.info('Import Preview - Transactions by Category:');
    console.log('='.repeat(80));
    Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(\`  \${category}: \${count} transactions\`);
      });
    console.log('='.repeat(80) + '\\n');

    // Ask for confirmation
    logger.warn(\`⚠️  About to import \${uniqueTransactions.length} transactions to Google Sheets\`);
    logger.info('This operation may take a few moments...');
    logger.info('Press Ctrl+C within 5 seconds to cancel');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Batch import (Google Sheets can handle this)
    logger.info('Importing to Google Sheets...');
    await sheets.appendTransactions(uniqueTransactions);

    logger.success(\`Successfully imported \${uniqueTransactions.length} historical transaction(s)\`);

    // Show stats
    console.log('\\n' + '='.repeat(80));
    logger.info('Import Complete! Summary:');
    console.log('='.repeat(80));
    console.log(\`  Total fetched from Plaid: \${allTransactions.length}\`);
    console.log(\`  After filtering (accounts + expenses): \${rawTransactions.length}\`);
    console.log(\`  Already in sheet (duplicates): \${rawTransactions.length - uniqueTransactions.length}\`);
    console.log(\`  New transactions imported: \${uniqueTransactions.length}\`);
    console.log('='.repeat(80) + '\\n');

    logger.endSection('Historical Data Import');
  } catch (error) {
    logger.error(\`Import failed: \${error}\`);
    process.exit(1);
  }
}

importHistorical();
