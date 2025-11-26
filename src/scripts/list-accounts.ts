import dotenv from 'dotenv';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { logger } from '../utils/logger';

dotenv.config();

async function listAccounts() {
  logger.startSection('Listing Connected Accounts');

  const configuration = new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || 'development'],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET,
      },
    },
  });

  const client = new PlaidApi(configuration);

  try {
    const response = await client.accountsGet({
      access_token: process.env.PLAID_ACCESS_TOKEN || '',
    });

    const accounts = response.data.accounts;
    logger.success(`Found ${accounts.length} connected accounts`);

    console.log('\n' + '='.repeat(80));
    logger.info('Account Details:');
    console.log('='.repeat(80));

    accounts.forEach((account, index) => {
      console.log(`\n${index + 1}. ${account.name}`);
      console.log(`   Account ID: ${account.account_id}`);
      console.log(`   Type: ${account.type} - ${account.subtype}`);
      console.log(`   Mask (last 4 digits): ${account.mask}`);
      console.log(`   Official Name: ${account.official_name || 'N/A'}`);
      console.log(`   Current Balance: $${account.balances.current?.toFixed(2) || 'N/A'}`);
    });

    console.log('\n' + '='.repeat(80));
    logger.info('Account ID → Mask Mapping:');
    console.log('='.repeat(80));

    accounts.forEach(account => {
      console.log(`  ${account.account_id} → ends in ${account.mask}`);
    });

    logger.endSection('Listing Connected Accounts');
  } catch (error) {
    logger.error(`Failed to fetch accounts: ${error}`);
    process.exit(1);
  }
}

listAccounts();
