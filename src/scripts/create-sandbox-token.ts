import dotenv from 'dotenv';
import { Configuration, PlaidApi, PlaidEnvironments, Products } from 'plaid';
import { logger } from '../utils/logger';

dotenv.config();

/**
 * Creates a sandbox access token directly without manual Link flow
 * This is only for sandbox/testing - production requires real Link flow
 */
async function createSandboxAccessToken() {
  logger.startSection('Plaid Sandbox Token Creation');

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
    // Step 1: Create a sandbox public token
    logger.info('Creating sandbox public token...');
    const publicTokenResponse = await client.sandboxPublicTokenCreate({
      institution_id: 'ins_109508', // Chase (sandbox institution)
      initial_products: [Products.Transactions],
    });

    const publicToken = publicTokenResponse.data.public_token;
    logger.success(`Public token created: ${publicToken}`);

    // Step 2: Exchange public token for access token
    logger.info('Exchanging public token for access token...');
    const exchangeResponse = await client.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    logger.success(`Access token created: ${accessToken}`);
    logger.info(`Item ID: ${itemId}`);

    // Step 3: Display instructions
    console.log('\n' + '='.repeat(80));
    logger.info('Add this to your .env file:');
    console.log(`PLAID_ACCESS_TOKEN=${accessToken}`);
    console.log('='.repeat(80) + '\n');

    logger.endSection('Plaid Sandbox Token Creation');
  } catch (error) {
    logger.error(`Failed to create sandbox token: ${error}`);
    process.exit(1);
  }
}

createSandboxAccessToken();
