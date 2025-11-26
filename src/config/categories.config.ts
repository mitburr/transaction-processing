import { TransactionCategory } from '../types/transaction.types';

export interface CategoryRule {
  category: TransactionCategory;
  keywords: string[];
  merchantPatterns?: RegExp[];
}

export const CATEGORY_RULES: CategoryRule[] = [
  // Groceries - supermarkets and food stores
  {
    category: 'Groceries',
    keywords: [
      'grocery', 'supermarket', 'whole foods', 'trader joe', 'safeway', 'kroger', 'walmart', 'target',
      'stop & shop', 'cub foods', 'aldi', 'seward', 'marissa', 'coop'
    ],
    merchantPatterns: [/grocery/i, /market/i, /foods/i, /coop/i]
  },

  // Eating Out - restaurants, cafes, fast food
  {
    category: 'Eating Out',
    keywords: [
      'restaurant', 'cafe', 'coffee', 'starbucks', 'caribou', 'five watt',
      'chipotle', 'subway', 'mcdonald', 'pizza', 'taco bell', 'jimmy john',
      'chatterbox', 'gorditas'
    ],
    merchantPatterns: [/restaurant/i, /cafe/i, /bar/i, /coffee/i, /grill/i, /diner/i]
  },

  // Debt Payments - loans and credit cards
  {
    category: 'Debt Payments',
    keywords: ['dept education', 'student loan', 'bread financial', 'credit card', 'loan payment'],
    merchantPatterns: [/loan/i, /debt/i]
  },

  // Subscriptions - digital services and memberships
  {
    category: 'Subscriptions',
    keywords: [
      'netflix', 'spotify', 'amazon prime', 'hulu', 'disney', 'apple', 'google one',
      'medium monthly', 'plex', 'patreon', 'audible', 'playstation', 'nebula',
      'proton', 'wikimedia', 'subscription'
    ],
    merchantPatterns: [/subscription/i, /monthly/i]
  },

  // Hobbies & Entertainment - games, movies, hobbies
  {
    category: 'Hobbies & Entertainment',
    keywords: [
      'steam', 'xbox', 'nintendo', 'playstation', 'game', 'cinema', 'movie', 'theater',
      'lagoon', 'tower games', 'jagex', 'maker'
    ],
    merchantPatterns: [/game/i, /cinema/i, /theater/i, /entertainment/i]
  },

  // Transportation - gas, parking, transit
  {
    category: 'Transportation',
    keywords: [
      'gas', 'fuel', 'uber', 'lyft', 'parking', 'transit', 'shell', 'chevron', 'bp',
      'speedway', 'onstreet'
    ],
    merchantPatterns: [/gas/i, /fuel/i, /parking/i, /transit/i]
  },

  // Utility Bills - internet, phone, electric, water
  {
    category: 'Utility Bills',
    keywords: [
      'electric', 'power', 'water', 'gas bill', 'internet', 'comcast', 'verizon', 'at&t',
      'quantum fiber', 'fiber', 'centurylink', 'xfinity'
    ],
    merchantPatterns: [/utility/i, /electric/i, /power/i, /fiber/i]
  },

  // Health & Wellbeing - medical, pharmacy, fitness
  {
    category: 'Health & Wellbeing',
    keywords: [
      'pharmacy', 'cvs', 'walgreens', 'doctor', 'medical', 'clinic', 'hospital',
      'gym', 'fitness', 'hcmc', 'allina', 'health'
    ],
    merchantPatterns: [/pharmacy/i, /medical/i, /health/i, /clinic/i, /hospital/i]
  },

  // Business - work-related expenses
  {
    category: 'Business',
    keywords: [
      'office', 'officemax', 'staples', 'business', 'human rights', 'google anthropic'
    ],
    merchantPatterns: [/office/i, /business/i]
  },

  // Gifts - donations and charitable giving
  {
    category: 'Gifts',
    keywords: ['donation', 'charity', 'gift', 'wikimedia', 'human rights cam'],
    merchantPatterns: [/donation/i, /charity/i, /foundation/i]
  },
];

export const DEFAULT_CATEGORY: TransactionCategory = 'Uncategorized';

// User email for sheet entries
export const USER_EMAIL = process.env.USER_EMAIL || 'mitburr@gmail.com';
