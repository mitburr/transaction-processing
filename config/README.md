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
