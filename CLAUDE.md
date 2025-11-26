# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An automated bank transaction import and categorization system that:
- Fetches transactions from US Bank via Plaid API
- Categorizes transactions using keyword and regex pattern matching
- Appends processed transactions to Google Sheets with duplicate detection
- Designed to run on a schedule (daily via cron or systemd timer)

## Development Commands

### Build and Run
```bash
npm run build        # Compile TypeScript to dist/
npm start            # Run compiled code (requires build first)
npm run dev          # Run directly with ts-node (no build needed)
npm run watch        # Compile TypeScript in watch mode
```

### Sync and Testing
```bash
npm run sync         # Manually sync transactions (same as npm run dev)
npm test             # Run Jest tests
npm run lint         # Run ESLint on src/**/*.ts
```

### Plaid Setup
```bash
npm run plaid:link   # Generate Plaid Link token for bank account connection
```

## Architecture Overview

### Core Data Flow

The application follows a linear pipeline architecture (src/main.ts:12-74):

1. **Fetch** (PlaidService) → Raw transactions from Plaid API
2. **Load** (SheetsService) → Existing transactions from Google Sheets for deduplication
3. **Process** (CategorizerService) → Apply categorization rules to raw transactions
4. **Deduplicate** (Deduplicator) → Filter out existing transactions (matches on date, amount, merchant)
5. **Append** (SheetsService) → Write new transactions to Google Sheets

### Service Architecture

#### PlaidService (src/services/plaid.service.ts)
- Manages Plaid API client with credentials from environment
- Single responsibility: fetch transactions for a date range
- Returns Plaid's native Transaction objects

#### SheetsService (src/services/sheets.service.ts)
- Uses service account authentication (JWT with Google Sheets API)
- Maps between ProcessedTransaction objects and SheetRow format
- Column names use quirky natural language: "What buy?", "How many money spent?", "When buy?", "Who buy from?", "How categorized?"
- Always operates on the first sheet (sheetsByIndex[0])

#### CategorizerService (src/services/categorizer.service.ts)
- Rule-based categorization using CATEGORY_RULES from config
- Searches concatenated merchant name + description text
- Matches keywords (case-insensitive) and regex patterns
- Returns first matching category or 'Uncategorized' as fallback

#### Deduplicator (src/utils/deduplicator.ts)
- Identifies duplicates by matching: date + amount + merchant name (case-insensitive)
- Prevents duplicate entries when re-running sync for overlapping date ranges

### Configuration

#### Critical: The .env File
**All credentials and configuration are managed through the `.env` file.** This file is gitignored and must be created from `.env.example`:

```bash
cp .env.example .env
# Then edit .env with your actual credentials
```

#### Environment Variables (.env)
**Plaid Configuration** (primary data source):
- `PLAID_CLIENT_ID` - From Plaid dashboard (dashboard.plaid.com)
- `PLAID_SECRET` - From Plaid dashboard
- `PLAID_ENV` - Environment: `sandbox`, `development`, or `production`
- `PLAID_ACCESS_TOKEN` - **Generated via `npm run plaid:link` after linking bank account**. This is the most critical token for fetching transactions.

**Google Sheets Configuration** (data destination):
- `GOOGLE_SHEET_ID` - Sheet ID from the Google Sheets URL
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` - Service account email from credentials JSON
- `GOOGLE_PRIVATE_KEY` - Service account private key (JSON format with `\n` escaped as `\\n`)

**Application Settings**:
- `USER_EMAIL` - Email address recorded in each transaction row (defaults to mitburr@gmail.com)
- `LOG_LEVEL` - Logging verbosity: `debug`, `info`, `warn`, `error` (default: info)
- `LOOKBACK_DAYS` - Days of transaction history to fetch (default: 7)

#### Category Rules (src/config/categories.config.ts)
- Define CATEGORY_RULES array with keywords and optional merchantPatterns (RegExp)
- Add new categories to TransactionCategory type in src/types/transaction.types.ts
- Categories are evaluated in array order; first match wins

### Type Definitions

Key types in src/types/transaction.types.ts:
- **TransactionCategory** - Union type of all valid categories (must match "How categorized?" column values)
- **ProcessedTransaction** - Internal format after categorization
- **SheetRow** - Google Sheets row format with quirky column names

## Important Implementation Details

### Google Sheets Column Mapping
The column names use casual language rather than technical terms. When modifying SheetsService, maintain this mapping:
- `Email Address` → user email
- `What buy?` → transaction description
- `How many money spent?` → amount (formatted as "$X.XX")
- `When buy?` → transaction date (YYYY-MM-DD format)
- `Who buy from?` → merchant name
- `How categorized?` → category
- `Notes` → additional notes (e.g., "Pending")

### Duplicate Detection Logic
Duplicates are identified by exact match on three fields (src/utils/deduplicator.ts:10-16):
- Date equality
- Amount string equality (formatted with "$" prefix)
- Merchant name equality (case-insensitive)

This allows re-running the sync with overlapping date ranges without creating duplicates.

### Transaction Amount Handling
Plaid returns amounts as positive numbers for debits. The code converts to absolute value and formats with "$" prefix (src/main.ts:47). All amounts in Google Sheets are positive strings like "$12.34".

### Logger Usage
Custom logger with colored output and emoji prefixes (src/utils/logger.ts). Use logger methods instead of console:
- `logger.startSection()` / `logger.endSection()` - Section boundaries
- `logger.info()`, `logger.warn()`, `logger.error()`, `logger.success()` - Standard levels
- `logger.debug()` - Verbose output for categorization matches

## Testing Notes

The project has Jest configured (tsconfig excludes "tests" directory) but no tests are currently implemented. When writing tests:
- Use ts-jest for TypeScript support
- Test configuration is already set up in package.json
- Consider mocking Plaid API and Google Sheets API calls
