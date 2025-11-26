export type TransactionCategory = 
  | 'Eating Out'
  | 'Groceries'
  | 'Utility Bills'
  | 'Debt Payments'
  | 'Transportation'
  | 'Pets'
  | 'Events'
  | 'Health & Wellbeing'
  | 'Friends & Family'
  | 'Hobbies & Entertainment'
  | 'Business'
  | 'Subscriptions'
  | 'Gifts'
  | 'Travel'
  | 'Other'
  | 'Uncategorized';

export interface RawTransaction {
  transaction_id: string;
  date: string;
  amount: number;
  name: string;
  merchant_name?: string;
  category?: string[];
  pending: boolean;
}

export interface ProcessedTransaction {
  timestamp: string;
  email: string;
  description: string;
  amount: string;
  date: string;
  merchant: string;
  category: TransactionCategory;
  notes?: string;
}

export interface SheetRow {
  'Timestamp': string;
  'Email Address': string;
  'What buy?': string;
  'How many money spent?': string;
  'When buy?': string;
  'Who buy from?': string;
  'How categorized?': string;
  'Notes': string;
}
