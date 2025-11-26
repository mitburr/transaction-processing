/**
 * Account filtering and email mapping configuration
 */

// Account masks (last 4 digits) to include in processing
export const ALLOWED_ACCOUNT_MASKS = ['6623', '0960'];

// Account ID to mask mapping (from Plaid)
// Run `npm run plaid:accounts` to see your account mappings
export const ACCOUNT_ID_TO_MASK: Record<string, string> = {
  'qV80NE9pEBiLQBZy5NAOhwOYMv7VkRiBDmadX': '6623', // joint checking
  'BJPBbd0jd4SBqN6o7ARjhvgo34wanrfd3PxBY': '0960', // Checking
};

/**
 * Email mapping based on account/card numbers
 *
 * Priority:
 * 1. Check card number in transaction metadata (if available)
 * 2. Fall back to account number mapping
 */

// Card number (last 4 digits) to email mapping
export const CARD_TO_EMAIL: Record<string, string> = {
  '9202': process.env.USER_EMAIL_MITBURR || 'mitburr@gmail.com',
  '6353': process.env.USER_EMAIL_RJKIRBY || 'rjkirby29@gmail.com',
};

// Account mask to email mapping (fallback if no card info)
export const ACCOUNT_TO_EMAIL: Record<string, string> = {
  '0960': process.env.USER_EMAIL_BILLS || 'bills@gmail.com',
  '6623': process.env.USER_EMAIL_MITBURR || 'mitburr@gmail.com', // Default for joint checking
};

/**
 * Extract card number from transaction description
 * @param description Transaction description text
 * @returns Last 4 digits of card if found, undefined otherwise
 */
export function extractCardFromDescription(description: string): string | undefined {
  // Look for "Card XXXX" pattern in description
  const match = description.match(/Card\s+(\d{4})/i);
  return match ? match[1] : undefined;
}

/**
 * Determine email address for a transaction
 * @param accountId Plaid account ID
 * @param description Transaction description (to extract card number)
 * @param cardMask Last 4 digits of card (if available from other sources)
 * @returns Email address to use for this transaction
 */
export function getEmailForTransaction(
  accountId: string,
  description: string,
  cardMask?: string
): string {
  const accountMask = ACCOUNT_ID_TO_MASK[accountId];

  // Try to extract card number from description
  const cardFromDesc = extractCardFromDescription(description);
  const finalCardMask = cardFromDesc || cardMask;

  // First priority: card number mapping
  if (finalCardMask && CARD_TO_EMAIL[finalCardMask]) {
    return CARD_TO_EMAIL[finalCardMask];
  }

  // Second priority: account number mapping
  if (accountMask && ACCOUNT_TO_EMAIL[accountMask]) {
    return ACCOUNT_TO_EMAIL[accountMask];
  }

  // Default fallback
  return process.env.USER_EMAIL_MITBURR || 'mitburr@gmail.com';
}

/**
 * Check if transaction should be included based on account
 * @param accountId Plaid account ID
 * @returns true if transaction should be processed
 */
export function shouldIncludeAccount(accountId: string): boolean {
  const accountMask = ACCOUNT_ID_TO_MASK[accountId];
  return accountMask ? ALLOWED_ACCOUNT_MASKS.includes(accountMask) : false;
}
