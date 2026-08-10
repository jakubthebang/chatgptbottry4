const { GoogleGenAI } = require('@google/genai');

let client = null;

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  if (!client) client = new GoogleGenAI({ apiKey: key });
  return client;
}

async function askGemini(prompt) {
  const ai = getClient();
  if (!ai) return null;

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text?.trim() || null;
}

module.exports = { askGemini };
