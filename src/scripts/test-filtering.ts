import dotenv from 'dotenv';
import { PlaidService } from '../services/plaid.service';
import { logger } from '../utils/logger';
import { shouldIncludeAccount, getEmailForTransaction, ACCOUNT_ID_TO_MASK } from '../config/account.config';

dotenv.config();

async function testFiltering() {
  logger.startSection('Testing Account Filtering and Email Assignment');

  try {
    const plaid = new PlaidService();

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000))
      .toISOString()
      .split('T')[0];

    const allTransactions = await plaid.getTransactions(startDate, endDate);
    const filteredTransactions = allTransactions.filter(tx => shouldIncludeAccount(tx.account_id));

    logger.info(`Total transactions: ${allTransactions.length}`);
    logger.info(`After filtering (6623, 0960 only): ${filteredTransactions.length}`);

    // Group by account
    const byAccount: Record<string, any[]> = {};
    filteredTransactions.forEach(tx => {
      const mask = ACCOUNT_ID_TO_MASK[tx.account_id] || tx.account_id;
      if (!byAccount[mask]) byAccount[mask] = [];
      byAccount[mask].push(tx);
    });

    console.log('\n' + '='.repeat(80));
    logger.info('Transactions by Account:');
    console.log('='.repeat(80));

    Object.keys(byAccount).forEach(mask => {
      const count = byAccount[mask].length;
      console.log(`\n  Account ${mask}: ${count} transactions`);

      // Show email breakdown by card if available
      const emailCounts: Record<string, number> = {};
      byAccount[mask].forEach(tx => {
        const txEmail = getEmailForTransaction(tx.account_id, tx.name);
        emailCounts[txEmail] = (emailCounts[txEmail] || 0) + 1;
      });

      Object.entries(emailCounts).forEach(([email, count]) => {
        console.log(`    ${email}: ${count} transactions`);
      });
    });

    // Show sample transactions with email assignments
    console.log('\n' + '='.repeat(80));
    logger.info('Sample Transactions with Email Assignment:');
    console.log('='.repeat(80));

    filteredTransactions.slice(0, 15).forEach(tx => {
      const mask = ACCOUNT_ID_TO_MASK[tx.account_id];
      const email = getEmailForTransaction(tx.account_id, tx.name);
      const cardMatch = tx.name.match(/Card\s+(\d{4})/i);
      const cardInfo = cardMatch ? ` [Card ${cardMatch[1]}]` : '';
      console.log(`\n  ${tx.date} | Account ${mask} | ${email}${cardInfo}`);
      console.log(`    ${tx.name} - $${Math.abs(tx.amount).toFixed(2)}`);
    });

    logger.endSection('Testing Account Filtering and Email Assignment');
  } catch (error) {
    logger.error(`Failed to test filtering: ${error}`);
    process.exit(1);
  }
}

testFiltering();
