import { Configuration, PlaidApi, PlaidEnvironments, Transaction } from 'plaid';
import { logger } from '../utils/logger';

export class PlaidService {
  private client: PlaidApi;
  private accessToken: string;

  constructor() {
    const configuration = new Configuration({
      basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
          'PLAID-SECRET': process.env.PLAID_SECRET,
        },
      },
    });

    this.client = new PlaidApi(configuration);
    this.accessToken = process.env.PLAID_ACCESS_TOKEN || '';

    if (!this.accessToken) {
      logger.warn('PLAID_ACCESS_TOKEN not set. Run plaid:link script first.');
    }
  }

  async getTransactions(startDate: string, endDate: string): Promise<Transaction[]> {
    logger.info(`Fetching transactions from ${startDate} to ${endDate}`);

    try {
      const response = await this.client.transactionsGet({
        access_token: this.accessToken,
        start_date: startDate,
        end_date: endDate,
      });

      logger.success(`Fetched ${response.data.transactions.length} transactions`);
      return response.data.transactions;
    } catch (error) {
      logger.error(`Failed to fetch transactions: ${error}`);
      throw error;
    }
  }
}
