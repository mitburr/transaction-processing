#!/bin/zsh

# Transaction Processing Project Initialization Script
# Sets up directory structure and boilerplate files

set -e  # Exit on error

PROJECT_NAME="transaction-processing"
PROJECT_ROOT="$HOME/Repos/$PROJECT_NAME"

echo "🚀 Initializing $PROJECT_NAME project..."
echo "📁 Project root: $PROJECT_ROOT"

# Check if we're in the right directory
if [[ ! -d "$PROJECT_ROOT/.git" ]]; then
  echo "❌ Error: Git repository not found at $PROJECT_ROOT"
  echo "Please run this script from within the $PROJECT_NAME directory or update PROJECT_ROOT"
  exit 1
fi

cd "$PROJECT_ROOT"

# Create directory structure
echo "\n📂 Creating directory structure..."
mkdir -p src/{services,types,config,utils,scripts}
mkdir -p config
mkdir -p logs
mkdir -p tests

echo "✅ Directories created"

# Create .gitignore
echo "\n📝 Creating .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.*.local

# Credentials
config/service-account.json
config/*.key
config/*.pem

# Build outputs
dist/
build/
*.tsbuildinfo

# Logs
logs/*.log
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Temporary files
*.tmp
.cache/

# Testing
coverage/
.nyc_output/
EOF

echo "✅ .gitignore created"

# Create package.json
echo "\n📦 Creating package.json..."
cat > package.json << 'EOF'
{
  "name": "transaction-processing",
  "version": "1.0.0",
  "description": "Automated bank transaction import and categorization system",
  "main": "dist/main.js",
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/main.ts",
    "start": "node dist/main.js",
    "watch": "tsc --watch",
    "lint": "eslint src/**/*.ts",
    "test": "jest",
    "plaid:link": "ts-node src/scripts/plaid-link.ts",
    "sync": "ts-node src/main.ts"
  },
  "keywords": [
    "plaid",
    "banking",
    "automation",
    "transactions"
  ],
  "author": "em",
  "license": "MIT",
  "dependencies": {
    "plaid": "^26.0.0",
    "google-spreadsheet": "^4.1.2",
    "dotenv": "^16.4.5",
    "date-fns": "^3.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.11.19",
    "@typescript-eslint/eslint-plugin": "^7.0.2",
    "@typescript-eslint/parser": "^7.0.2",
    "eslint": "^8.56.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.12",
    "ts-jest": "^29.1.2"
  }
}
EOF

echo "✅ package.json created"

# Create tsconfig.json
echo "\n⚙️  Creating tsconfig.json..."
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
EOF

echo "✅ tsconfig.json created"

# Create .env.example
echo "\n🔐 Creating .env.example..."
cat > .env.example << 'EOF'
# Plaid API Credentials
PLAID_CLIENT_ID=your_client_id_here
PLAID_SECRET=your_secret_here
PLAID_ENV=sandbox  # sandbox, development, or production

# Plaid Access Token (generated after linking bank account)
PLAID_ACCESS_TOKEN=

# Google Sheets Configuration
GOOGLE_SHEET_ID=your_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=

# Application Settings
LOG_LEVEL=info  # debug, info, warn, error
LOOKBACK_DAYS=7  # How many days to fetch transactions
EOF

echo "✅ .env.example created"

# Create .env if it doesn't exist
if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "✅ .env created (copy of .env.example)"
fi

# Create logger utility
echo "\n📝 Creating logger utility..."
cat > src/utils/logger.ts << 'EOF'
// Define log levels and their colors
const colors = {
  info: "\x1b[36m",    // cyan
  warn: "\x1b[33m",    // yellow
  error: "\x1b[31m",   // red
  success: "\x1b[32m", // green
  debug: "\x1b[35m",   // magenta
  reset: "\x1b[0m",    // reset
  bright: "\x1b[1m"    // bright/bold
} as const;

// Define emojis for different log types
const emojis = {
  info: "ℹ️ ",
  warn: "⚠️ ",
  error: "❌",
  success: "✅",
  debug: "🔍",
  start: "🚀",
  end: "🏁",
  database: "🗃️ ",
  test: "🧪"
} as const;

type LogLevel = keyof typeof colors;
type LogPrefix = keyof typeof emojis;

class Logger {
  private timestamp(): string {
    return new Date().toISOString();
  }

  private format(message: string, level: LogLevel, prefix?: LogPrefix): string {
    const emoji = prefix ? emojis[prefix] : emojis[level as LogPrefix] || '';
    return `${colors[level]}${emoji} ${message}${colors.reset}`;
  }

  info(message: string, prefix?: LogPrefix): void {
    console.log(this.format(message, 'info', prefix));
  }

  warn(message: string, prefix?: LogPrefix): void {
    console.warn(this.format(message, 'warn', prefix));
  }

  error(message: string, prefix?: LogPrefix): void {
    console.error(this.format(message, 'error', prefix));
  }

  success(message: string, prefix?: LogPrefix): void {
    console.log(this.format(message, 'success', prefix));
  }

  debug(message: string, prefix?: LogPrefix): void {
    console.debug(this.format(message, 'debug', prefix));
  }

  // Special formatted sections
  startSection(title: string): void {
    console.log('\n' + this.format(`=== Starting: ${title} ===`, 'info', 'start'));
  }

  endSection(title: string): void {
    console.log(this.format(`=== Completed: ${title} ===`, 'success', 'end') + '\n');
  }

  private formatValue(value: any, indent: number = 0): string {
    const spaces = '  '.repeat(indent);
    
    if (Array.isArray(value)) {
      if (value.length === 0) return `${spaces}[]`;
      return `\n${value.map(item => `${spaces}- ${this.formatValue(item, indent + 1)}`).join('\n')}`;
    }
    
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    
    if (typeof value === 'object') {
      if (Object.keys(value).length === 0) return `${spaces}{}`;
      return `\n${Object.entries(value)
        .map(([key, val]) => `${spaces}  ${key}: ${this.formatValue(val, indent + 1)}`)
        .join('\n')}`;
    }
    
    return String(value);
  }

  list(title: string, items: any[], level: LogLevel = 'info', prefix?: LogPrefix): void {
    const formattedTitle = title ? `${title}:` : '';
    const formattedItems = this.formatValue(items);
    const message = `${formattedTitle}${formattedItems}`;
    console.log(this.format(message, level, prefix));
  }

  // Database specific logging
  dbQuery(query: string): void {
    this.debug(`Executing query: ${query}`, 'database');
  }

  // Test specific logging
  testStart(suiteName: string): void {
    this.info(`Starting test suite: ${suiteName}`, 'test');
  }

  testEnd(suiteName: string): void {
    this.success(`Completed test suite: ${suiteName}`, 'test');
  }
}

// Export singleton instance
export const logger = new Logger();
EOF

echo "✅ Logger utility created"

# Create transaction types
echo "\n📝 Creating type definitions..."
cat > src/types/transaction.types.ts << 'EOF'
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
  email: string;
  description: string;
  amount: string;
  date: string;
  merchant: string;
  category: TransactionCategory;
  notes?: string;
}

export interface SheetRow {
  'Email Address': string;
  'What buy?': string;
  'How many money spent?': string;
  'When buy?': string;
  'Who buy from?': string;
  'How categorized?': string;
  'Notes': string;
}
EOF

echo "✅ Type definitions created"

# Create config file
echo "\n📝 Creating config..."
cat > src/config/categories.config.ts << 'EOF'
import { TransactionCategory } from '../types/transaction.types';

export interface CategoryRule {
  category: TransactionCategory;
  keywords: string[];
  merchantPatterns?: RegExp[];
}

export const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'Groceries',
    keywords: ['grocery', 'supermarket', 'whole foods', 'trader joe', 'safeway', 'kroger', 'walmart', 'target'],
    merchantPatterns: [/grocery/i, /market/i]
  },
  {
    category: 'Eating Out',
    keywords: ['restaurant', 'cafe', 'coffee', 'starbucks', 'chipotle', 'subway', 'mcdonald', 'pizza'],
    merchantPatterns: [/restaurant/i, /cafe/i, /bar/i]
  },
  {
    category: 'Transportation',
    keywords: ['gas', 'fuel', 'uber', 'lyft', 'parking', 'transit', 'shell', 'chevron', 'bp'],
    merchantPatterns: [/gas/i, /fuel/i, /parking/i]
  },
  {
    category: 'Subscriptions',
    keywords: ['netflix', 'spotify', 'amazon prime', 'hulu', 'disney', 'apple', 'google one', 'subscription'],
    merchantPatterns: [/subscription/i]
  },
  {
    category: 'Utility Bills',
    keywords: ['electric', 'power', 'water', 'gas bill', 'internet', 'comcast', 'verizon', 'at&t'],
    merchantPatterns: [/utility/i, /electric/i, /power/i]
  },
  {
    category: 'Health & Wellbeing',
    keywords: ['pharmacy', 'cvs', 'walgreens', 'doctor', 'medical', 'clinic', 'hospital', 'gym', 'fitness'],
    merchantPatterns: [/pharmacy/i, /medical/i, /health/i]
  },
  // Add more rules as needed
];

export const DEFAULT_CATEGORY: TransactionCategory = 'Uncategorized';

// User email for sheet entries
export const USER_EMAIL = process.env.USER_EMAIL || 'mitburr@gmail.com';
EOF

echo "✅ Config created"

# Create placeholder service files
echo "\n📝 Creating service files..."

cat > src/services/plaid.service.ts << 'EOF'
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
EOF

cat > src/services/sheets.service.ts << 'EOF'
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
EOF

cat > src/services/categorizer.service.ts << 'EOF'
import { TransactionCategory } from '../types/transaction.types';
import { CATEGORY_RULES, DEFAULT_CATEGORY } from '../config/categories.config';
import { logger } from '../utils/logger';

export class CategorizerService {
  categorize(merchantName: string, description: string): TransactionCategory {
    const searchText = `${merchantName} ${description}`.toLowerCase();

    for (const rule of CATEGORY_RULES) {
      // Check keywords
      for (const keyword of rule.keywords) {
        if (searchText.includes(keyword.toLowerCase())) {
          logger.debug(`Matched "${keyword}" -> ${rule.category}`);
          return rule.category;
        }
      }

      // Check regex patterns
      if (rule.merchantPatterns) {
        for (const pattern of rule.merchantPatterns) {
          if (pattern.test(searchText)) {
            logger.debug(`Matched pattern ${pattern} -> ${rule.category}`);
            return rule.category;
          }
        }
      }
    }

    logger.debug(`No match found for "${merchantName}" -> ${DEFAULT_CATEGORY}`);
    return DEFAULT_CATEGORY;
  }
}
EOF

cat > src/utils/deduplicator.ts << 'EOF'
import { ProcessedTransaction, SheetRow } from '../types/transaction.types';
import { logger } from './logger';

export class Deduplicator {
  /**
   * Check if a transaction already exists in the sheet
   * Matches on: date, amount, and merchant
   */
  isDuplicate(transaction: ProcessedTransaction, existingRows: SheetRow[]): boolean {
    return existingRows.some(row => {
      const dateMatch = row['When buy?'] === transaction.date;
      const amountMatch = row['How many money spent?'] === transaction.amount;
      const merchantMatch = row['Who buy from?']?.toLowerCase() === transaction.merchant.toLowerCase();

      return dateMatch && amountMatch && merchantMatch;
    });
  }

  /**
   * Filter out duplicate transactions
   */
  filterDuplicates(
    transactions: ProcessedTransaction[],
    existingRows: SheetRow[]
  ): ProcessedTransaction[] {
    const unique = transactions.filter(t => !this.isDuplicate(t, existingRows));
    
    const duplicateCount = transactions.length - unique.length;
    if (duplicateCount > 0) {
      logger.info(`Filtered out ${duplicateCount} duplicate transaction(s)`);
    }

    return unique;
  }
}
EOF

echo "✅ Service files created"

# Create main entry point
echo "\n📝 Creating main.ts..."
cat > src/main.ts << 'EOF'
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { PlaidService } from './services/plaid.service';
import { SheetsService } from './services/sheets.service';
import { CategorizerService } from './services/categorizer.service';
import { Deduplicator } from './utils/deduplicator';
import { ProcessedTransaction } from './types/transaction.types';
import { USER_EMAIL } from './config/categories.config';

dotenv.config();

async function main() {
  logger.startSection('Transaction Processing');

  try {
    // Initialize services
    const plaid = new PlaidService();
    const sheets = new SheetsService();
    const categorizer = new CategorizerService();
    const deduplicator = new Deduplicator();

    // Calculate date range
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - (parseInt(process.env.LOOKBACK_DAYS || '7') * 24 * 60 * 60 * 1000))
      .toISOString()
      .split('T')[0];

    // Fetch transactions from Plaid
    logger.info(`Fetching transactions from ${startDate} to ${endDate}`);
    const rawTransactions = await plaid.getTransactions(startDate, endDate);

    if (rawTransactions.length === 0) {
      logger.info('No new transactions found');
      logger.endSection('Transaction Processing');
      return;
    }

    // Load existing sheet data
    await sheets.loadSheet();
    const existingRows = await sheets.getExistingTransactions();
    logger.info(`Loaded ${existingRows.length} existing transactions from sheet`);

    // Process and categorize transactions
    const processedTransactions: ProcessedTransaction[] = rawTransactions.map(tx => ({
      email: USER_EMAIL,
      description: tx.name,
      amount: `$${Math.abs(tx.amount).toFixed(2)}`,
      date: tx.date,
      merchant: tx.merchant_name || tx.name,
      category: categorizer.categorize(tx.merchant_name || '', tx.name),
      notes: tx.pending ? 'Pending' : undefined,
    }));

    // Filter duplicates
    const uniqueTransactions = deduplicator.filterDuplicates(processedTransactions, existingRows);

    if (uniqueTransactions.length === 0) {
      logger.info('No new unique transactions to add');
      logger.endSection('Transaction Processing');
      return;
    }

    // Append to Google Sheets
    await sheets.appendTransactions(uniqueTransactions);

    logger.success(`Successfully processed ${uniqueTransactions.length} new transaction(s)`);
    logger.endSection('Transaction Processing');
  } catch (error) {
    logger.error(`Processing failed: ${error}`);
    process.exit(1);
  }
}

main();
EOF

echo "✅ main.ts created"

# Create Plaid link script
echo "\n📝 Creating Plaid link script..."
cat > src/scripts/plaid-link.ts << 'EOF'
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
EOF

echo "✅ Plaid link script created"

# Create README
echo "\n📝 Creating README.md..."
cat > README.md << 'EOF'
# Transaction Processing

Automated bank transaction import and categorization system using Plaid and Google Sheets.

## Features

- 🏦 Automatic transaction fetching from US Bank via Plaid API
- 📊 Categorization based on merchant patterns and keywords
- 📝 Automatic append to Google Sheets
- 🔍 Duplicate detection
- ⚙️  Configurable via environment variables

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

### 3. Set up Plaid

1. Create account at https://dashboard.plaid.com/signup
2. Get your `PLAID_CLIENT_ID` and `PLAID_SECRET`
3. Link your bank account:

```bash
npm run plaid:link
```

### 4. Set up Google Sheets API

1. Create a Google Cloud Project
2. Enable Google Sheets API
3. Create a Service Account
4. Download credentials JSON to `config/service-account.json`
5. Share your Google Sheet with the service account email
6. Add `GOOGLE_SHEET_ID` to `.env`

### 5. Build and Run

```bash
npm run build
npm start
```

## Usage

### Manual Sync

```bash
npm run sync
```

### Automated Sync (Cron)

On Sequoia, add to crontab:

```bash
# Run daily at 8 AM
0 8 * * * cd /home/em/transaction-processing && /usr/bin/node dist/main.js >> logs/cron.log 2>&1
```

Or use systemd timer (see docs).

## Project Structure

```
transaction-processing/
├── src/
│   ├── main.ts                 # Entry point
│   ├── services/               # Core services
│   │   ├── plaid.service.ts
│   │   ├── sheets.service.ts
│   │   └── categorizer.service.ts
│   ├── types/                  # TypeScript definitions
│   ├── config/                 # Configuration
│   ├── utils/                  # Utilities (logger, deduplicator)
│   └── scripts/                # Helper scripts
├── config/                     # Credentials
├── logs/                       # Log files
└── dist/                       # Compiled output
```

## Categories

- Eating Out
- Groceries
- Utility Bills
- Debt Payments
- Transportation
- Pets
- Events
- Health & Wellbeing
- Friends & Family
- Hobbies & Entertainment
- Business
- Subscriptions
- Gifts
- Travel
- Other
- Uncategorized

Edit `src/config/categories.config.ts` to customize categorization rules.

## Development

```bash
# Watch mode
npm run watch

# Run in development
npm run dev
```

## License

MIT
EOF

echo "✅ README.md created"

# Create placeholder config directory file
echo "\n📝 Creating config README..."
cat > config/README.md << 'EOF'
# Configuration Directory

This directory contains sensitive credentials and configuration files.

## Required Files

### `service-account.json`

Google Cloud Service Account credentials for accessing Google Sheets API.

To create:
1. Go to Google Cloud Console
2. Create/select a project
3. Enable Google Sheets API
4. Create Service Account
5. Download JSON key file here
6. Share your Google Sheet with the service account email

### `.env`

Environment variables are stored in the root directory, not here.

## Security

⚠️ **Never commit credentials to git!**

All files in this directory (except this README) are gitignored.
EOF

echo "✅ Config README created"

# Summary
echo "\n"
echo "═══════════════════════════════════════════════════════"
echo "✅ Project initialization complete!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "📁 Directory structure created"
echo "📦 package.json configured"
echo "⚙️  tsconfig.json configured"
echo "🔐 .env.example created"
echo "📝 All core files created"
echo ""
echo "Next steps:"
echo ""
echo "1. Install dependencies:"
echo "   cd $PROJECT_ROOT && npm install"
echo ""
echo "2. Configure your .env file with:"
echo "   - Plaid API credentials"
echo "   - Google Sheet ID"
echo "   - Service account credentials"
echo ""
echo "3. Link your bank account:"
echo "   npm run plaid:link"
echo ""
echo "4. Test the sync:"
echo "   npm run dev"
echo ""
echo "📖 See README.md for detailed setup instructions"
echo ""