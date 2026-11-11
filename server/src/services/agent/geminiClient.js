const { GoogleGenAI } = require('@google/genai');

let aiInstance = null;

/**
 * Returns an initialized GoogleGenAI instance or null if GEMINI_API_KEY is not set.
 */
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey });
  }

  return aiInstance;
}

const DEFAULT_MODEL = 'gemini-3.8-flash';

module.exports = {
  getGeminiClient,
  DEFAULT_MODEL,
};

