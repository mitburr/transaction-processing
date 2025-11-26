import dotenv from 'dotenv';
import { PlaidService } from '../services/plaid.service';
import { logger } from '../utils/logger';

dotenv.config();

async function inspectTransactionData() {
  logger.startSection('Inspecting Transaction Data Structure');

  try {
    const plaid = new PlaidService();

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000))
      .toISOString()
      .split('T')[0];

    logger.info(`Fetching transactions from ${startDate} to ${endDate}`);
    const transactions = await plaid.getTransactions(startDate, endDate);

    if (transactions.length === 0) {
      logger.warn('No transactions found');
      return;
    }

    logger.success(`Retrieved ${transactions.length} transactions`);

    // Show first transaction with ALL fields
    console.log('\n' + '='.repeat(80));
    logger.info('Full Transaction Object (first transaction):');
    console.log('='.repeat(80));
    console.log(JSON.stringify(transactions[0], null, 2));

    // Show account_id patterns
    console.log('\n' + '='.repeat(80));
    logger.info('Account IDs found in transactions:');
    console.log('='.repeat(80));

    const accountIds = new Set(transactions.map(tx => tx.account_id));
    accountIds.forEach(id => {
      const count = transactions.filter(tx => tx.account_id === id).length;
      console.log(`  ${id} (${count} transactions)`);
    });

    // Check if there's account_owner or other relevant fields
    console.log('\n' + '='.repeat(80));
    logger.info('Available fields on transaction:');
    console.log('='.repeat(80));
    console.log(Object.keys(transactions[0]).join(', '));

    logger.endSection('Inspecting Transaction Data Structure');
  } catch (error) {
    logger.error(`Failed to inspect transactions: ${error}`);
    process.exit(1);
  }
}

inspectTransactionData();
