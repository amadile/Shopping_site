import express from "express";
import {
  BASE_CURRENCY,
  clearRateCache,
  convertBetweenCurrencies,
  convertCurrency,
  formatCurrency,
  getAllExchangeRates,
  SUPPORTED_CURRENCIES,
} from "../config/currency.js";
import { logger } from "../config/logger.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * /api/currency/supported:
 *   get:
 *     summary: Get list of supported currencies
 *     description: Returns all supported currencies with their symbols and names
 *     tags: [Currency]
 *     responses:
 *       200:
 *         description: List of supported currencies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 baseCurrency:
 *                   type: string
 *                 currencies:
 *                   type: object
 */
router.get("/supported", (req, res) => {
  try {
    res.json({
      baseCurrency: BASE_CURRENCY,
      currencies: SUPPORTED_CURRENCIES,
    });
  } catch (error) {
    logger.error("Error fetching supported currencies:", error.message);
    res.status(500).json({ error: req.t("error.serverError") });
  }
});

/**
 * @swagger
 * /api/currency/rates:
 *   get:
 *     summary: Get current exchange rates
 *     description: Returns exchange rates for all supported currencies from base currency
 *     tags: [Currency]
 *     responses:
 *       200:
 *         description: Current exchange rates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 baseCurrency:
 *                   type: string
 *                 rates:
 *                   type: object
 *                 lastUpdated:
 *                   type: string
 */
router.get("/rates", async (req, res) => {
  try {
    const rates = await getAllExchangeRates();

    res.json({
      baseCurrency: BASE_CURRENCY,
      rates,
      lastUpdated: new Date().toISOString(),
      cachedFor: "1 hour",
    });
  } catch (error) {
    logger.error("Error fetching exchange rates:", error.message);
    res.status(500).json({ error: req.t("error.serverError") });
  }
});

/**
 * @swagger
 * /api/currency/convert:
 *   post:
 *     summary: Convert currency amount
 *     description: Convert an amount from base currency to target currency
 *     tags: [Currency]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               to:
 *                 type: string
 *     responses:
 *       200:
 *         description: Converted amount
 */
router.post("/convert", async (req, res) => {
  try {
    const { amount, to } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: "Invalid amount provided" });
    }

    if (!to || !SUPPORTED_CURRENCIES[to.toUpperCase()]) {
      return res.status(400).json({ error: "Invalid target currency" });
    }

    const targetCurrency = to.toUpperCase();
    const convertedAmount = await convertCurrency(amount, targetCurrency);
    const formatted = formatCurrency(convertedAmount, targetCurrency);

    res.json({
      original: {
        amount,
        currency: BASE_CURRENCY,
        formatted: formatCurrency(amount, BASE_CURRENCY),
      },
      converted: {
        amount: convertedAmount,
        currency: targetCurrency,
        formatted,
      },
    });
  } catch (error) {
    logger.error("Error converting currency:", error.message);
    res.status(500).json({ error: req.t("error.serverError") });
  }
});

/**
 * @swagger
 * /api/currency/convert-between:
 *   post:
 *     summary: Convert between two currencies
 *     description: Convert an amount from one currency to another
 *     tags: [Currency]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               from:
 *                 type: string
 *               to:
 *                 type: string
 *     responses:
 *       200:
 *         description: Converted amount
 */
router.post("/convert-between", async (req, res) => {
  try {
    const { amount, from, to } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: "Invalid amount provided" });
    }

    const fromCurrency = from?.toUpperCase();
    const toCurrency = to?.toUpperCase();

    if (!fromCurrency || !SUPPORTED_CURRENCIES[fromCurrency]) {
      return res.status(400).json({ error: "Invalid source currency" });
    }

    if (!toCurrency || !SUPPORTED_CURRENCIES[toCurrency]) {
      return res.status(400).json({ error: "Invalid target currency" });
    }

    const convertedAmount = await convertBetweenCurrencies(
      amount,
      fromCurrency,
      toCurrency
    );

    res.json({
      original: {
        amount,
        currency: fromCurrency,
        formatted: formatCurrency(amount, fromCurrency),
      },
      converted: {
        amount: convertedAmount,
        currency: toCurrency,
        formatted: formatCurrency(convertedAmount, toCurrency),
      },
    });
  } catch (error) {
    logger.error("Error converting between currencies:", error.message);
    res.status(500).json({ error: req.t("error.serverError") });
  }
});

/**
 * @swagger
 * /api/currency/set-preference:
 *   post:
 *     summary: Set user currency preference
 *     description: Set currency preference for authenticated user (stored in cookie)
 *     tags: [Currency]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currency:
 *                 type: string
 *     responses:
 *       200:
 *         description: Currency preference updated
 */
router.post("/set-preference", authenticateJWT, (req, res) => {
  try {
    const { currency } = req.body;

    if (!currency || !SUPPORTED_CURRENCIES[currency.toUpperCase()]) {
      return res.status(400).json({ error: "Invalid currency code" });
    }

    const currencyCode = currency.toUpperCase();

    // Set cookie for 1 year
    res.cookie("currency", currencyCode, {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.json({
      message: "Currency preference updated",
      currency: currencyCode,
      info: SUPPORTED_CURRENCIES[currencyCode],
    });
  } catch (error) {
    logger.error("Error setting currency preference:", error.message);
    res.status(500).json({ error: req.t("error.serverError") });
  }
});

/**
 * @swagger
 * /api/currency/clear-cache:
 *   post:
 *     summary: Clear exchange rate cache (Admin only)
 *     description: Manually clear cached exchange rates to force refresh
 *     tags: [Currency]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 */
router.post("/clear-cache", authenticateJWT, (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: req.t("error.forbidden") });
    }

    clearRateCache();

    res.json({
      message: "Exchange rate cache cleared successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error clearing rate cache:", error.message);
    res.status(500).json({ error: req.t("error.serverError") });
  }
});

/**
 * @swagger
 * /api/currency/format:
 *   post:
 *     summary: Format amount with currency
 *     description: Format a number with proper currency symbol and locale
 *     tags: [Currency]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *     responses:
 *       200:
 *         description: Formatted currency string
 */
router.post("/format", (req, res) => {
  try {
    const { amount, currency } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: "Invalid amount provided" });
    }

    const currencyCode = currency?.toUpperCase() || BASE_CURRENCY;

    if (!SUPPORTED_CURRENCIES[currencyCode]) {
      return res.status(400).json({ error: "Invalid currency code" });
    }

    const formatted = formatCurrency(amount, currencyCode);

    res.json({
      amount,
      currency: currencyCode,
      formatted,
      symbol: SUPPORTED_CURRENCIES[currencyCode].symbol,
    });
  } catch (error) {
    logger.error("Error formatting currency:", error.message);
    res.status(500).json({ error: req.t("error.serverError") });
  }
});

export default router;
