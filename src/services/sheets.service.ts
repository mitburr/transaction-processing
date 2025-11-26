import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { logger } from '../utils/logger';
import { ProcessedTransaction, SheetRow } from '../types/transaction.types';

export class SheetsService {
  private doc: GoogleSpreadsheet;
  private serviceAccountAuth: JWT;

  constructor() {
    this.serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.doc = new GoogleSpreadsheet(
      process.env.GOOGLE_SHEET_ID || '',
      this.serviceAccountAuth
    );
  }

  async loadSheet() {
    await this.doc.loadInfo();
    logger.info(`Loaded sheet: ${this.doc.title}`);
  }

  async getExistingTransactions(): Promise<SheetRow[]> {
    const sheet = this.doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    return rows.map(row => ({
      'Timestamp': row.get('Timestamp') || '',
      'Email Address': row.get('Email Address'),
      'What buy?': row.get('What buy?'),
      'How many money spent?': row.get('How many money spent?'),
      'When buy?': row.get('When buy?'),
      'Who buy from?': row.get('Who buy from?'),
      'How categorized?': row.get('How categorized?'),
      'Notes': row.get('Notes'),
    }));
  }

  async appendTransactions(transactions: ProcessedTransaction[]): Promise<void> {
    const sheet = this.doc.sheetsByIndex[0];

    const rows = transactions.map(t => ({
      'Timestamp': t.timestamp,
      'Email Address': t.email,
      'What buy?': t.description,
      'How many money spent?': t.amount,
      'When buy?': t.date,
      'Who buy from?': t.merchant,
      'How categorized?': t.category,
      'Notes': t.notes || '',
    }));

    await sheet.addRows(rows);
    logger.success(`Appended ${transactions.length} transactions to sheet`);
  }
}
