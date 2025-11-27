import { I18n } from "i18n";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure i18n
const i18n = new I18n({
  locales: ["en", "es", "fr", "de", "ar", "zh", "ja"],
  defaultLocale: "en",
  directory: path.join(__dirname, "../locales"),
  updateFiles: false,
  syncFiles: false,
  autoReload: process.env.NODE_ENV === "development",
  objectNotation: true,
  register: global,
  api: {
    __: "t",
    __n: "tn",
  },
});

logger.info("i18n configured with locales:", i18n.getLocales());

export default i18n;
