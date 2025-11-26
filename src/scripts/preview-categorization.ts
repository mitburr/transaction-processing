import dotenv from 'dotenv';
import { PlaidService } from '../services/plaid.service';
import { CategorizerService } from '../services/categorizer.service';
import { logger } from '../utils/logger';

dotenv.config();

interface CategorizedTransaction {
  date: string;
  merchant: string;
  description: string;
  amount: number;
  category: string;
}

async function previewCategorization() {
  logger.startSection('Transaction Categorization Preview');

  try {
    const plaid = new PlaidService();
    const categorizer = new CategorizerService();

    // Fetch last 30 days
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

    // Categorize all transactions
    const categorized: CategorizedTransaction[] = transactions.map(tx => ({
      date: tx.date,
      merchant: tx.merchant_name || tx.name,
      description: tx.name,
      amount: Math.abs(tx.amount),
      category: categorizer.categorize(tx.merchant_name || '', tx.name),
    }));

    // Group by category
    const byCategory: Record<string, CategorizedTransaction[]> = {};
    categorized.forEach(tx => {
      if (!byCategory[tx.category]) {
        byCategory[tx.category] = [];
      }
      byCategory[tx.category].push(tx);
    });

    // Display statistics
    console.log('\n' + '='.repeat(80));
    logger.info('Categorization Summary:');
    console.log('='.repeat(80) + '\n');

    Object.keys(byCategory).sort((a, b) => byCategory[b].length - byCategory[a].length)
      .forEach(category => {
        const count = byCategory[category].length;
        const total = byCategory[category].reduce((sum, tx) => sum + tx.amount, 0);
        console.log(`  ${category}: ${count} transactions ($${total.toFixed(2)})`);
      });

    // Show transactions by category
    console.log('\n' + '='.repeat(80));
    logger.info('Transactions by Category:');
    console.log('='.repeat(80) + '\n');

    Object.keys(byCategory).sort().forEach(category => {
      console.log(`\n📁 ${category} (${byCategory[category].length} transactions):`);
      console.log('-'.repeat(80));

      byCategory[category].slice(0, 5).forEach(tx => {
        console.log(`  • ${tx.date} | $${tx.amount.toFixed(2).padStart(8)} | ${tx.merchant}`);
      });

      if (byCategory[category].length > 5) {
        console.log(`  ... and ${byCategory[category].length - 5} more`);
      }
    });

    // Highlight uncategorized transactions
    if (byCategory['Uncategorized'] && byCategory['Uncategorized'].length > 0) {
      console.log('\n' + '='.repeat(80));
      logger.warn(`⚠️  ${byCategory['Uncategorized'].length} Uncategorized Transactions - Consider adding rules:`);
      console.log('='.repeat(80) + '\n');

      // Group uncategorized by merchant
      const merchantCounts: Record<string, number> = {};
      byCategory['Uncategorized'].forEach(tx => {
        merchantCounts[tx.merchant] = (merchantCounts[tx.merchant] || 0) + 1;
      });

      Object.entries(merchantCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([merchant, count]) => {
          console.log(`  • ${merchant} (${count} transactions)`);
        });
    }

    logger.endSection('Transaction Categorization Preview');
  } catch (error) {
    logger.error(`Failed to preview categorization: ${error}`);
    process.exit(1);
  }
}

previewCategorization();
