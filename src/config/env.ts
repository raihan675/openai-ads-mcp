import "dotenv/config";

const apiKey = process.env.OPENAI_ADS_API_KEY || "";
const baseUrl = process.env.OPENAI_ADS_API_BASE_URL || "https://api.ads.openai.com/v1";
const logLevel = process.env.LOG_LEVEL || "info";

export const env = {
  apiKey,
  baseUrl,
  logLevel,
  hasApiKey: Boolean(apiKey && apiKey.trim().length > 0),
};
