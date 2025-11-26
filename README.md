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
