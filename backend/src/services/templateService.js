import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "../config/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Email Template Rendering Service
 * Handles loading and rendering HTML email templates with variable substitution
 */

class TemplateService {
  constructor() {
    this.templatesDir = path.join(__dirname, "../templates/emails");
    this.cache = new Map();
  }

  /**
   * Load template from file
   */
  async loadTemplate(templateName) {
    try {
      // Check cache first (in production)
      if (
        process.env.NODE_ENV === "production" &&
        this.cache.has(templateName)
      ) {
        return this.cache.get(templateName);
      }

      const templatePath = path.join(this.templatesDir, `${templateName}.html`);
      const template = await fs.readFile(templatePath, "utf-8");

      // Cache template in production
      if (process.env.NODE_ENV === "production") {
        this.cache.set(templateName, template);
      }

      return template;
    } catch (error) {
      logger.error(`Error loading template ${templateName}:`, error);
      throw new Error(`Template ${templateName} not found`);
    }
  }

  /**
   * Render template with variables
   * Supports both {{variable}} and {{#if condition}} syntax
   */
  render(template, data) {
    let rendered = template;

    // Handle if/else blocks
    rendered = this.handleConditionals(rendered, data);

    // Handle each loops
    rendered = this.handleLoops(rendered, data);

    // Replace simple variables
    rendered = this.replaceVariables(rendered, data);

    return rendered;
  }

  /**
   * Handle conditional blocks {{#if condition}}...{{/if}}
   */
  handleConditionals(template, data) {
    const ifRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

    return template.replace(ifRegex, (match, condition, content) => {
      const value = data[condition];
      // Show content if value is truthy
      if (value) {
        return content;
      }
      return "";
    });
  }

  /**
   * Handle each loops {{#each items}}...{{/each}}
   */
  handleLoops(template, data) {
    const eachRegex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;

    return template.replace(eachRegex, (match, arrayName, itemTemplate) => {
      const array = data[arrayName];

      if (!Array.isArray(array) || array.length === 0) {
        return "";
      }

      return array
        .map((item) => this.replaceVariables(itemTemplate, item))
        .join("");
    });
  }

  /**
   * Replace simple variables {{variable}}
   */
  replaceVariables(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = data[key];
      return value !== undefined ? value : "";
    });
  }

  /**
   * Render complete email with base template
   */
  async renderEmail(templateName, data) {
    try {
      // Load content template
      const contentTemplate = await this.loadTemplate(templateName);
      const renderedContent = this.render(contentTemplate, data);

      // Load base template
      const baseTemplate = await this.loadTemplate("base");

      // Combine base + content with company information from environment
      const email = this.render(baseTemplate, {
        title: data.title || process.env.COMPANY_NAME || "Shopping Site",
        content: renderedContent,
        companyName: process.env.COMPANY_NAME || "Shopping Site",
        companyAddress:
          process.env.COMPANY_ADDRESS ||
          "123 Commerce Street, City, State 12345",
        supportEmail: process.env.SUPPORT_EMAIL || "support@yourdomain.com",
      });

      return email;
    } catch (error) {
      logger.error(`Error rendering email template ${templateName}:`, error);
      throw error;
    }
  }

  /**
   * Clear template cache (useful for development)
   */
  clearCache() {
    this.cache.clear();
    logger.info("Template cache cleared");
  }
}

export default new TemplateService();
