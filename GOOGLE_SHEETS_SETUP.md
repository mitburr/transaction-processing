# Google Sheets API Setup Guide

This guide will walk you through setting up Google Sheets API access for your transaction processing system.

## Overview

You need:
1. A Google Cloud Project
2. Google Sheets API enabled
3. A Service Account with credentials
4. Your Google Sheet shared with the service account

**Total time:** ~10 minutes

---

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top (or "Select a project")
3. Click **"NEW PROJECT"**
4. Enter project name: `Transaction Processing` (or whatever you prefer)
5. Click **"CREATE"**
6. Wait for the project to be created (notification will appear)
7. Make sure your new project is selected in the dropdown

---

## Step 2: Enable Google Sheets API

1. In the Google Cloud Console, go to **"APIs & Services"** → **"Library"**
   - Direct link: https://console.cloud.google.com/apis/library
2. Search for **"Google Sheets API"**
3. Click on **"Google Sheets API"**
4. Click **"ENABLE"**
5. Wait for it to enable (a few seconds)

---

## Step 3: Create a Service Account

1. Go to **"APIs & Services"** → **"Credentials"**
   - Direct link: https://console.cloud.google.com/apis/credentials
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"Service account"**
4. Fill in the service account details:
   - **Service account name:** `transaction-processor`
   - **Service account ID:** (auto-filled, like `transaction-processor@...`)
   - **Description:** `Service account for automated transaction processing`
5. Click **"CREATE AND CONTINUE"**
6. **Skip the optional steps:**
   - Grant this service account access to project: Click **"CONTINUE"**
   - Grant users access to this service account: Click **"DONE"**

---

## Step 4: Create and Download Service Account Key

1. You should now see your service account in the list
2. Click on the service account email (e.g., `transaction-processor@...`)
3. Go to the **"KEYS"** tab
4. Click **"ADD KEY"** → **"Create new key"**
5. Select **"JSON"** format
6. Click **"CREATE"**
7. A JSON file will download automatically - this is your credentials file!
8. **IMPORTANT:** Save this file securely. You'll need it in the next step.

---

## Step 5: Extract Credentials from JSON File

1. Open the downloaded JSON file in a text editor
2. Find these two values:
   - `client_email` - looks like: `transaction-processor@...iam.gserviceaccount.com`
   - `private_key` - a long string starting with `"-----BEGIN PRIVATE KEY-----\n"`

3. Add them to your `.env` file:

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=transaction-processor@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourKeyHere...\n-----END PRIVATE KEY-----\n"
```

**IMPORTANT:**
- Keep the quotes around the private key
- The `\n` characters are newlines - keep them as-is
- Or you can copy the entire private_key value from the JSON (it already has `\n` escaped)

---

## Step 6: Share Your Google Sheet with Service Account

1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1YE1a0_q6e4pH0tiJtRSsYGy-1U-UN5WL6Q3CWNRT968/edit
2. Click the **"Share"** button (top right)
3. In the "Add people and groups" field, paste your service account email:
   - `transaction-processor@your-project-id.iam.gserviceaccount.com`
4. Change permission to **"Editor"** (so it can write transactions)
5. **UNCHECK** "Notify people" (the service account doesn't need an email)
6. Click **"Share"** or **"Done"**

---

## Step 7: Verify Your .env Configuration

Your `.env` file should now have:

```bash
# Google Sheets Configuration
GOOGLE_SHEET_ID=1YE1a0_q6e4pH0tiJtRSsYGy-1U-UN5WL6Q3CWNRT968
GOOGLE_SERVICE_ACCOUNT_EMAIL=transaction-processor@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourLongKeyHere...\n-----END PRIVATE KEY-----\n"
```

---

## Step 8: Set Up Your Sheet Headers (If New Sheet)

If you're using a new/blank sheet, add these headers in the first row:

| Timestamp | Email Address | What buy? | How many money spent? | When buy? | Who buy from? | How categorized? | Notes |
|-----------|---------------|-----------|----------------------|-----------|---------------|------------------|-------|

**Exact header names** (case-sensitive):
1. `Timestamp`
2. `Email Address`
3. `What buy?`
4. `How many money spent?`
5. `When buy?`
6. `Who buy from?`
7. `How categorized?`
8. `Notes`

---

## Step 9: Test the Connection

Run this command to test if everything is set up correctly:

```bash
npm run sync
```

If successful, you should see:
- ✅ "Loaded sheet: [Your Sheet Name]"
- ✅ Transactions being processed and appended

---

## Troubleshooting

### Error: "Unable to parse range"
- **Fix:** Make sure your sheet has the correct headers (see Step 8)

### Error: "The caller does not have permission"
- **Fix:** Make sure you shared the sheet with the service account (Step 6)

### Error: "GOOGLE_PRIVATE_KEY not set"
- **Fix:** Check that your .env file has GOOGLE_PRIVATE_KEY with quotes around it

### Error: "Invalid JWT"
- **Fix:** The private key might have incorrect escaping. Make sure `\n` characters are present in the key

---

## Security Notes

⚠️ **NEVER commit your service account JSON file or .env file to git!**

Your `.gitignore` should include:
```
.env
config/service-account.json
config/*.json
```

The service account has access ONLY to:
- Sheets you explicitly share with it
- Nothing else in your Google account

---

## Quick Reference

**Google Cloud Console:** https://console.cloud.google.com/
**APIs & Services:** https://console.cloud.google.com/apis/
**Your Sheet:** https://docs.google.com/spreadsheets/d/1YE1a0_q6e4pH0tiJtRSsYGy-1U-UN5WL6Q3CWNRT968/edit

**Need help?** Check the main README.md or run `npm run plaid:test` to verify Plaid is working first.
