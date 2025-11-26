import dotenv from 'dotenv';
import { PlaidService } from '../services/plaid.service';
import { logger } from '../utils/logger';

dotenv.config();

async function testPlaidTransactions() {
  logger.startSection('Testing Plaid Transaction Retrieval');

  try {
    const plaid = new PlaidService();

    // Calculate date range (last 30 days for sandbox testing)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000))
      .toISOString()
      .split('T')[0];

    logger.info(`Fetching transactions from ${startDate} to ${endDate}`);

    const transactions = await plaid.getTransactions(startDate, endDate);

    if (transactions.length === 0) {
      logger.warn('No transactions found');
    } else {
      logger.success(`Retrieved ${transactions.length} transactions`);
      console.log('\n' + '='.repeat(80));
      logger.info('Sample Transactions:');
      console.log('='.repeat(80));

      // Display first 10 transactions
      transactions.slice(0, 10).forEach((tx, index) => {
        console.log(`\n${index + 1}. ${tx.name}`);
        console.log(`   Date: ${tx.date}`);
        console.log(`   Amount: $${Math.abs(tx.amount).toFixed(2)}`);
        console.log(`   Merchant: ${tx.merchant_name || 'N/A'}`);
        console.log(`   Pending: ${tx.pending ? 'Yes' : 'No'}`);
      });

      if (transactions.length > 10) {
        console.log(`\n... and ${transactions.length - 10} more transactions`);
      }
      console.log('\n' + '='.repeat(80));
    }

    logger.endSection('Testing Plaid Transaction Retrieval');
  } catch (error) {
    logger.error(`Failed to retrieve transactions: ${error}`);
    process.exit(1);
  }
}

testPlaidTransactions();
