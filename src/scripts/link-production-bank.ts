import dotenv from 'dotenv';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import { logger } from '../utils/logger';
import * as http from 'http';
import * as url from 'url';

dotenv.config();

let plaidClient: PlaidApi;
let server: http.Server;

function initializePlaidClient() {
  const configuration = new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || 'production'],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET,
      },
    },
  });

  plaidClient = new PlaidApi(configuration);
}

async function createLinkToken(): Promise<string> {
  logger.info('Creating link token for production environment...');

  const response = await plaidClient.linkTokenCreate({
    user: {
      client_user_id: 'user-' + Date.now()
    },
    client_name: 'Transaction Processing',
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
    language: 'en',
  });

  return response.data.link_token;
}

async function exchangePublicToken(publicToken: string): Promise<string> {
  logger.info('Exchanging public token for access token...');

  const response = await plaidClient.itemPublicTokenExchange({
    public_token: publicToken,
  });

  return response.data.access_token;
}

function createServer(linkToken: string): Promise<string> {
  return new Promise((resolve, reject) => {
    server = http.createServer(async (req, res) => {
      const parsedUrl = url.parse(req.url || '', true);
      const pathname = parsedUrl.pathname;

      if (pathname === '/') {
        // Serve the Plaid Link page
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
<!DOCTYPE html>
<html>
<head>
  <title>Link Your Bank Account</title>
  <script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .container {
      background: white;
      padding: 3rem;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      text-align: center;
      max-width: 500px;
    }
    h1 {
      color: #333;
      margin-bottom: 1rem;
    }
    p {
      color: #666;
      margin-bottom: 2rem;
      line-height: 1.6;
    }
    button {
      background: #667eea;
      color: white;
      border: none;
      padding: 1rem 2rem;
      font-size: 1.1rem;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.3s;
    }
    button:hover {
      background: #5568d3;
    }
    .status {
      margin-top: 1.5rem;
      padding: 1rem;
      background: #f0f4ff;
      border-radius: 6px;
      color: #667eea;
      display: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🏦 Link Your Bank Account</h1>
    <p>Click the button below to securely connect your bank account through Plaid. Your credentials are encrypted and never stored.</p>
    <button id="link-button">Connect Bank Account</button>
    <div class="status" id="status"></div>
  </div>

  <script>
    const linkToken = '${linkToken}';

    const handler = Plaid.create({
      token: linkToken,
      onSuccess: async (public_token, metadata) => {
        document.getElementById('status').style.display = 'block';
        document.getElementById('status').textContent = '✅ Bank account linked! Exchanging token...';

        // Send public token to our server
        const response = await fetch('/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ public_token })
        });

        const data = await response.json();

        if (data.success) {
          document.getElementById('status').innerHTML =
            '✅ Success! Your access token has been generated.<br><br>' +
            '<strong style="color: #22c55e;">You can close this window now.</strong>';
        } else {
          document.getElementById('status').innerHTML = '❌ Error: ' + data.error;
          document.getElementById('status').style.background = '#fee';
          document.getElementById('status').style.color = '#c33';
        }
      },
      onExit: (err, metadata) => {
        if (err) {
          document.getElementById('status').style.display = 'block';
          document.getElementById('status').innerHTML = '❌ Error: ' + err.display_message;
          document.getElementById('status').style.background = '#fee';
          document.getElementById('status').style.color = '#c33';
        } else {
          document.getElementById('status').style.display = 'block';
          document.getElementById('status').textContent = 'Link flow cancelled';
          document.getElementById('status').style.background = '#fef3cd';
          document.getElementById('status').style.color = '#856404';
        }
      },
    });

    document.getElementById('link-button').onclick = () => {
      handler.open();
    };
  </script>
</body>
</html>
        `);
      } else if (pathname === '/exchange-token' && req.method === 'POST') {
        // Handle token exchange
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const { public_token } = JSON.parse(body);
            const accessToken = await exchangePublicToken(public_token);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));

            // Resolve the promise with the access token
            resolve(accessToken);

            // Close server after a delay
            setTimeout(() => {
              server.close();
            }, 2000);
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: String(error) }));
            reject(error);
          }
        });
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    });

    server.listen(8000, () => {
      logger.success('Server started at http://localhost:8000');
      logger.info('Open your browser to http://localhost:8000 to link your bank account');
      console.log('\n' + '='.repeat(80));
      console.log('  🌐 Open in browser: http://localhost:8000');
      console.log('='.repeat(80) + '\n');
    });
  });
}

async function linkProductionBank() {
  logger.startSection('Link Production Bank Account');

  try {
    initializePlaidClient();

    const linkToken = await createLinkToken();
    logger.success('Link token created successfully');

    const accessToken = await createServer(linkToken);

    logger.success(`Access token obtained: ${accessToken}`);

    console.log('\n' + '='.repeat(80));
    logger.info('Add this to your .env file:');
    console.log(`PLAID_ACCESS_TOKEN=${accessToken}`);
    console.log('='.repeat(80) + '\n');

    logger.endSection('Link Production Bank Account');
    process.exit(0);
  } catch (error) {
    logger.error(`Failed to link bank account: ${error}`);
    if (server) {
      server.close();
    }
    process.exit(1);
  }
}

linkProductionBank();
