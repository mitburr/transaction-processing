import dotenv from 'dotenv';
import * as http from 'http';
import * as url from 'url';
import { SheetsService } from '../services/sheets.service';
import { TransactionCategory } from '../types/transaction.types';
import { logger } from '../utils/logger';

dotenv.config();

const PORT = 3000;
const sheets = new SheetsService();

// Get all valid categories
const ALL_CATEGORIES: TransactionCategory[] = [
  'Eating Out',
  'Groceries',
  'Utility Bills',
  'Debt Payments',
  'Transportation',
  'Pets',
  'Events',
  'Health & Wellbeing',
  'Friends & Family',
  'Hobbies & Entertainment',
  'Business',
  'Subscriptions',
  'Gifts',
  'Travel',
  'Other',
];

async function startCategorizerUI() {
  logger.startSection('Starting Categorizer UI');

  await sheets.loadSheet();

  const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url || '', true);
    const pathname = parsedUrl.pathname;

    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (pathname === '/') {
      // Serve the main HTML page
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(getHTML());
    } else if (pathname === '/api/uncategorized') {
      // Get uncategorized transactions
      try {
        const rows = await sheets.getExistingTransactions();
        const uncategorized = rows
          .map((row, index) => ({
            index,
            timestamp: row['Timestamp'],
            email: row['Email Address'],
            description: row['What buy?'],
            amount: row['How many money spent?'],
            date: row['When buy?'],
            merchant: row['Who buy from?'],
            category: row['How categorized?'],
            notes: row['Notes'],
          }))
          .filter(tx => tx.category === 'Uncategorized' || !tx.category);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ uncategorized, total: rows.length }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: String(error) }));
      }
    } else if (pathname === '/api/categories') {
      // Get all valid categories
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ categories: ALL_CATEGORIES }));
    } else if (pathname === '/api/update' && req.method === 'POST') {
      // Update a transaction's category
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const { rowIndex, category } = JSON.parse(body);

          // Update the sheet
          const doc = sheets['doc'];
          const sheet = doc.sheetsByIndex[0];
          const rows = await sheet.getRows();

          if (rowIndex >= 0 && rowIndex < rows.length) {
            rows[rowIndex].set('How categorized?', category);
            await rows[rowIndex].save();

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
            logger.success(`Updated row ${rowIndex + 1} to category: ${category}`);
          } else {
            throw new Error('Invalid row index');
          }
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: String(error) }));
        }
      });
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  server.listen(PORT, () => {
    logger.success(`Categorizer UI started at http://localhost:${PORT}`);
    console.log('\n' + '='.repeat(80));
    console.log(`  🌐 Open in browser: http://localhost:${PORT}`);
    console.log(`  📊 Categorize uncategorized transactions with a simple interface`);
    console.log('='.repeat(80) + '\n');
    logger.info('Press Ctrl+C to stop the server');
  });
}

function getHTML(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transaction Categorizer</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 2rem;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 2rem;
    }
    h1 {
      color: #333;
      margin-bottom: 0.5rem;
      font-size: 2rem;
    }
    .stats {
      color: #666;
      margin-bottom: 2rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      font-size: 0.95rem;
    }
    .loading {
      text-align: center;
      padding: 3rem;
      color: #667eea;
      font-size: 1.2rem;
    }
    .empty {
      text-align: center;
      padding: 3rem;
      color: #28a745;
    }
    .empty h2 { font-size: 2rem; margin-bottom: 1rem; }
    .transaction {
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1rem;
      background: #fafafa;
      transition: all 0.2s;
    }
    .transaction:hover { background: #f5f5f5; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .transaction.categorized {
      opacity: 0.6;
      background: #e8f5e9;
    }
    .tx-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }
    .tx-info {
      flex: 1;
    }
    .merchant {
      font-size: 1.25rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 0.25rem;
    }
    .description {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }
    .meta {
      display: flex;
      gap: 1.5rem;
      font-size: 0.85rem;
      color: #888;
    }
    .amount {
      font-size: 1.5rem;
      font-weight: 700;
      color: #667eea;
      margin-left: 1rem;
    }
    .category-selector {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 0.5rem;
      margin-top: 1rem;
    }
    .category-btn {
      padding: 0.75rem 1rem;
      border: 2px solid #e0e0e0;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.9rem;
      font-weight: 500;
    }
    .category-btn:hover {
      border-color: #667eea;
      background: #f0f4ff;
      transform: translateY(-1px);
    }
    .category-btn:active {
      transform: translateY(0);
    }
    .success-checkmark {
      display: inline-block;
      margin-left: 0.5rem;
      color: #28a745;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>💰 Transaction Categorizer</h1>
    <div class="stats" id="stats">Loading...</div>
    <div id="transactions" class="loading">Loading uncategorized transactions...</div>
  </div>

  <script>
    let uncategorized = [];
    let categories = [];

    async function loadData() {
      try {
        const [txResponse, catResponse] = await Promise.all([
          fetch('/api/uncategorized'),
          fetch('/api/categories')
        ]);

        const txData = await txResponse.json();
        const catData = await catResponse.json();

        uncategorized = txData.uncategorized;
        categories = catData.categories;

        document.getElementById('stats').innerHTML =
          \`📊 <strong>\${uncategorized.length}</strong> uncategorized out of <strong>\${txData.total}</strong> total transactions\`;

        renderTransactions();
      } catch (error) {
        document.getElementById('transactions').innerHTML =
          \`<div class="empty"><h2>❌ Error loading transactions</h2><p>\${error.message}</p></div>\`;
      }
    }

    function renderTransactions() {
      const container = document.getElementById('transactions');

      if (uncategorized.length === 0) {
        container.innerHTML = \`
          <div class="empty">
            <h2>🎉 All Done!</h2>
            <p>All transactions have been categorized.</p>
          </div>
        \`;
        return;
      }

      container.innerHTML = uncategorized.map((tx, i) => \`
        <div class="transaction" id="tx-\${i}">
          <div class="tx-header">
            <div class="tx-info">
              <div class="merchant">\${tx.merchant || 'Unknown Merchant'}</div>
              <div class="description">\${tx.description}</div>
              <div class="meta">
                <span>📅 \${tx.date}</span>
                <span>👤 \${tx.email}</span>
              </div>
            </div>
            <div class="amount">\${tx.amount}</div>
          </div>
          <div class="category-selector">
            \${categories.map(cat => \`
              <button class="category-btn" onclick="categorize(\${tx.index}, '\${cat}', \${i})">
                \${cat}
              </button>
            \`).join('')}
          </div>
        </div>
      \`).join('');
    }

    async function categorize(rowIndex, category, displayIndex) {
      const txElement = document.getElementById(\`tx-\${displayIndex}\`);

      try {
        const response = await fetch('/api/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rowIndex, category })
        });

        if (!response.ok) throw new Error('Failed to update');

        // Visual feedback
        txElement.classList.add('categorized');
        txElement.querySelector('.merchant').innerHTML +=
          ' <span class="success-checkmark">✓</span>';

        // Remove from list after a delay
        setTimeout(() => {
          uncategorized.splice(displayIndex, 1);
          renderTransactions();
        }, 800);

      } catch (error) {
        alert('Error updating category: ' + error.message);
      }
    }

    // Load data on page load
    loadData();
  </script>
</body>
</html>
  `;
}

startCategorizerUI();
