import CC from "currency-converter-lt";
import NodeCache from "node-cache";
import { logger } from "./logger.js";

// Cache exchange rates for 1 hour (3600 seconds)
const rateCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

// Supported currencies with their symbols and names
export const SUPPORTED_CURRENCIES = {
  USD: { symbol: "$", name: "US Dollar", locale: "en-US" },
  EUR: { symbol: "€", name: "Euro", locale: "de-DE" },
  GBP: { symbol: "£", name: "British Pound", locale: "en-GB" },
  JPY: { symbol: "¥", name: "Japanese Yen", locale: "ja-JP" },
  AUD: { symbol: "A$", name: "Australian Dollar", locale: "en-AU" },
  CAD: { symbol: "C$", name: "Canadian Dollar", locale: "en-CA" },
  CNY: { symbol: "¥", name: "Chinese Yuan", locale: "zh-CN" },
  INR: { symbol: "₹", name: "Indian Rupee", locale: "en-IN" },
  SAR: { symbol: "ر.س", name: "Saudi Riyal", locale: "ar-SA" },
  AED: { symbol: "د.إ", name: "UAE Dirham", locale: "ar-AE" },
};

// Base currency for the store (all prices stored in this currency)
export const BASE_CURRENCY = process.env.BASE_CURRENCY || "USD";

/**
 * Get exchange rate from base currency to target currency
 * Uses caching to minimize API calls
 *
 * @param {string} targetCurrency - Target currency code (e.g., 'EUR')
 * @returns {Promise<number>} Exchange rate
 */
export async function getExchangeRate(targetCurrency) {
  try {
    // If target is same as base, rate is 1
    if (targetCurrency === BASE_CURRENCY) {
      return 1;
    }

    // Check cache first
    const cacheKey = `${BASE_CURRENCY}_${targetCurrency}`;
    const cachedRate = rateCache.get(cacheKey);

    if (cachedRate) {
      logger.info(`Using cached exchange rate for ${cacheKey}: ${cachedRate}`);
      return cachedRate;
    }

    // Fetch new rate
    const currencyConverter = new CC({
      from: BASE_CURRENCY,
      to: targetCurrency,
      amount: 1,
    });
    const rate = await currencyConverter.convert();

    if (!rate || isNaN(rate)) {
      throw new Error(`Invalid exchange rate received for ${targetCurrency}`);
    }

    // Cache the rate
    rateCache.set(cacheKey, rate);
    logger.info(`Fetched and cached exchange rate for ${cacheKey}: ${rate}`);

    return rate;
  } catch (error) {
    logger.error(
      `Error fetching exchange rate for ${targetCurrency}:`,
      error.message
    );

    // Fallback to fixed rates if API fails
    const fallbackRates = {
      EUR: 0.92,
      GBP: 0.79,
      JPY: 149.5,
      AUD: 1.52,
      CAD: 1.36,
      CNY: 7.24,
      INR: 83.12,
      SAR: 3.75,
      AED: 3.67,
    };

    const fallbackRate = fallbackRates[targetCurrency] || 1;
    logger.warn(
      `Using fallback exchange rate for ${targetCurrency}: ${fallbackRate}`
    );

    return fallbackRate;
  }
}

/**
 * Convert amount from base currency to target currency
 *
 * @param {number} amount - Amount in base currency
 * @param {string} targetCurrency - Target currency code
 * @returns {Promise<number>} Converted amount
 */
export async function convertCurrency(amount, targetCurrency) {
  try {
    if (!amount || isNaN(amount)) {
      throw new Error("Invalid amount provided");
    }

    if (!SUPPORTED_CURRENCIES[targetCurrency]) {
      throw new Error(`Unsupported currency: ${targetCurrency}`);
    }

    const rate = await getExchangeRate(targetCurrency);
    const convertedAmount = amount * rate;

    // Round to 2 decimal places
    return Math.round(convertedAmount * 100) / 100;
  } catch (error) {
    logger.error(`Error converting currency:`, error.message);
    return amount; // Return original amount on error
  }
}

/**
 * Convert amount from source currency to target currency
 *
 * @param {number} amount - Amount in source currency
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {Promise<number>} Converted amount
 */
export async function convertBetweenCurrencies(
  amount,
  fromCurrency,
  toCurrency
) {
  try {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    // Convert to base currency first
    const toBaseRate = await getExchangeRate(fromCurrency);
    const amountInBase = amount / toBaseRate;

    // Then convert to target currency
    return await convertCurrency(amountInBase, toCurrency);
  } catch (error) {
    logger.error(`Error converting between currencies:`, error.message);
    return amount;
  }
}

/**
 * Format amount with currency symbol and locale
 *
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @param {string} locale - Optional locale (uses currency default if not provided)
 * @returns {string} Formatted amount with symbol
 */
export function formatCurrency(
  amount,
  currency = BASE_CURRENCY,
  locale = null
) {
  try {
    const currencyInfo = SUPPORTED_CURRENCIES[currency];

    if (!currencyInfo) {
      return `${amount.toFixed(2)} ${currency}`;
    }

    const useLocale = locale || currencyInfo.locale;

    return new Intl.NumberFormat(useLocale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    logger.error(`Error formatting currency:`, error.message);
    return `${SUPPORTED_CURRENCIES[currency]?.symbol || ""}${amount.toFixed(
      2
    )}`;
  }
}

/**
 * Get user's preferred currency from request
 * Priority: query param > header > cookie > default (USD)
 *
 * @param {Object} req - Express request object
 * @returns {string} Currency code
 */
export function getUserCurrency(req) {
  // 1. Check query parameter
  if (
    req.query.currency &&
    SUPPORTED_CURRENCIES[req.query.currency.toUpperCase()]
  ) {
    return req.query.currency.toUpperCase();
  }

  // 2. Check custom header
  if (req.headers["x-currency"]) {
    const currency = req.headers["x-currency"].toUpperCase();
    if (SUPPORTED_CURRENCIES[currency]) {
      return currency;
    }
  }

  // 3. Check cookie
  if (req.cookies?.currency && SUPPORTED_CURRENCIES[req.cookies.currency]) {
    return req.cookies.currency;
  }

  // 4. Detect from locale (if i18n is available)
  if (req.locale) {
    const localeCurrencyMap = {
      en: "USD",
      es: "EUR",
      fr: "EUR",
      de: "EUR",
      ja: "JPY",
      zh: "CNY",
      ar: "SAR",
    };
    const detectedCurrency = localeCurrencyMap[req.locale];
    if (detectedCurrency) {
      return detectedCurrency;
    }
  }

  // 5. Default to base currency
  return BASE_CURRENCY;
}

/**
 * Convert product prices to user's currency
 *
 * @param {Object} product - Product object with price
 * @param {string} targetCurrency - Target currency code
 * @returns {Promise<Object>} Product with converted prices
 */
export async function convertProductPrice(product, targetCurrency) {
  try {
    const converted = { ...product };

    // Convert main price
    if (product.price) {
      converted.price = await convertCurrency(product.price, targetCurrency);
      converted.originalPrice = product.price;
      converted.currency = targetCurrency;
      converted.baseCurrency = BASE_CURRENCY;
    }

    // Convert sale price if exists
    if (product.salePrice) {
      converted.salePrice = await convertCurrency(
        product.salePrice,
        targetCurrency
      );
    }

    // Convert price range if exists (for variants)
    if (product.priceRange) {
      converted.priceRange = {
        min: await convertCurrency(product.priceRange.min, targetCurrency),
        max: await convertCurrency(product.priceRange.max, targetCurrency),
      };
    }

    return converted;
  } catch (error) {
    logger.error(`Error converting product price:`, error.message);
    return product;
  }
}

/**
 * Convert multiple products' prices
 *
 * @param {Array} products - Array of product objects
 * @param {string} targetCurrency - Target currency code
 * @returns {Promise<Array>} Products with converted prices
 */
export async function convertProductsPrices(products, targetCurrency) {
  try {
    if (targetCurrency === BASE_CURRENCY) {
      return products;
    }

    const rate = await getExchangeRate(targetCurrency);

    return products.map((product) => {
      const converted = { ...product };

      if (product.price) {
        converted.price = Math.round(product.price * rate * 100) / 100;
        converted.originalPrice = product.price;
        converted.currency = targetCurrency;
        converted.baseCurrency = BASE_CURRENCY;
      }

      if (product.salePrice) {
        converted.salePrice = Math.round(product.salePrice * rate * 100) / 100;
      }

      return converted;
    });
  } catch (error) {
    logger.error(`Error converting products prices:`, error.message);
    return products;
  }
}

/**
 * Clear exchange rate cache (useful for testing or manual refresh)
 */
export function clearRateCache() {
  rateCache.flushAll();
  logger.info("Exchange rate cache cleared");
}

/**
 * Get all exchange rates from base currency
 *
 * @returns {Promise<Object>} Object with all exchange rates
 */
export async function getAllExchangeRates() {
  const rates = { [BASE_CURRENCY]: 1 };

  for (const currency of Object.keys(SUPPORTED_CURRENCIES)) {
    if (currency !== BASE_CURRENCY) {
      rates[currency] = await getExchangeRate(currency);
    }
  }

  return rates;
}

/**
 * Middleware to detect and attach user's currency to request
 */
export function currencyMiddleware(req, res, next) {
  try {
    req.currency = getUserCurrency(req);

    // Attach helper functions to request
    req.convertCurrency = (amount) => convertCurrency(amount, req.currency);
    req.formatCurrency = (amount) => formatCurrency(amount, req.currency);

    // Attach to response locals for templates
    res.locals.currency = req.currency;
    res.locals.currencySymbol = SUPPORTED_CURRENCIES[req.currency]?.symbol;
    res.locals.formatCurrency = (amount) =>
      formatCurrency(amount, req.currency);

    next();
  } catch (error) {
    logger.error("Currency middleware error:", error.message);
    req.currency = BASE_CURRENCY;
    next();
  }
}

export default {
  BASE_CURRENCY,
  SUPPORTED_CURRENCIES,
  getExchangeRate,
  convertCurrency,
  convertBetweenCurrencies,
  formatCurrency,
  getUserCurrency,
  convertProductPrice,
  convertProductsPrices,
  clearRateCache,
  getAllExchangeRates,
  currencyMiddleware,
};
