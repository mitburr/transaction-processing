import dotenv from 'dotenv';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import { logger } from '../utils/logger';

dotenv.config();

async function linkBank() {
  logger.startSection('Plaid Bank Link');

  const configuration = new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET,
      },
    },
  });

  const client = new PlaidApi(configuration);

  try {
    // Create a link token
    logger.info('Creating link token...');
    const tokenResponse = await client.linkTokenCreate({
      user: { client_user_id: 'user-id' },
      client_name: 'Transaction Processing',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    });

    const linkToken = tokenResponse.data.link_token;
    logger.success(`Link token created: ${linkToken}`);
    logger.info(`Visit: https://cdn.plaid.com/link/v2/stable/link.html?token=${linkToken}`);
    logger.info('Follow the Plaid Link flow to connect your US Bank account');
    logger.info('After completing, you will receive a public_token');
    logger.info('Exchange it for an access_token using this script (to be implemented)');

    logger.endSection('Plaid Bank Link');
  } catch (error) {
    logger.error(`Failed to create link token: ${error}`);
    process.exit(1);
  }
}

linkBank();
