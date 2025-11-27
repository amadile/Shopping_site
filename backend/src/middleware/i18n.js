import acceptLanguage from "accept-language-parser";
import i18n from "../config/i18n.js";

/**
 * i18n middleware - Detects and sets user's preferred language
 */
export const i18nMiddleware = (req, res, next) => {
  // Priority order:
  // 1. Query parameter ?lang=es
  // 2. X-Language header
  // 3. Accept-Language header
  // 4. Default locale

  let locale = i18n.getLocale();

  // Check query parameter
  if (req.query.lang) {
    locale = req.query.lang;
  }
  // Check custom header
  else if (req.headers["x-language"]) {
    locale = req.headers["x-language"];
  }
  // Parse Accept-Language header
  else if (req.headers["accept-language"]) {
    const languages = acceptLanguage.parse(req.headers["accept-language"]);
    if (languages && languages.length > 0) {
      const preferred = languages[0].code;
      if (i18n.getLocales().includes(preferred)) {
        locale = preferred;
      }
    }
  }

  // Set locale for this request
  i18n.setLocale(locale);
  req.locale = locale;

  // Add translation functions (both styles for compatibility)
  req.__ = i18n.__;
  req.__n = i18n.__n;
  req.t = i18n.__;
  req.tn = i18n.__n;

  // Add translation helpers to response
  res.locals.__ = i18n.__;
  res.locals.__n = i18n.__n;
  res.locals.t = i18n.__;
  res.locals.tn = i18n.__n;
  res.locals.locale = locale;

  next();
};

/**
 * Get translated message
 * @param {string} key - Translation key
 * @param {Object} params - Translation parameters
 * @param {string} locale - Optional locale override
 * @returns {string} - Translated message
 */
export function translate(key, params = {}, locale = null) {
  if (locale) {
    i18n.setLocale(locale);
  }
  return i18n.__(key, params);
}

/**
 * Get plural translated message
 * @param {string} singular - Singular key
 * @param {string} plural - Plural key
 * @param {number} count - Count for pluralization
 * @param {Object} params - Translation parameters
 * @param {string} locale - Optional locale override
 * @returns {string} - Translated message
 */
export function translatePlural(
  singular,
  plural,
  count,
  params = {},
  locale = null
) {
  if (locale) {
    i18n.setLocale(locale);
  }
  return i18n.__n(singular, plural, count, params);
}

export default i18nMiddleware;
