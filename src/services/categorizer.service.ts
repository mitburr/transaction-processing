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
