const { GoogleGenAI } = require('@google/genai');
let client = null;
let warned = false;
function getClient(){const key=process.env.GEMINI_API_KEY;if(!key){if(!warned){console.warn('[Gemini] GEMINI_API_KEY is not set.');warned=true;}return null;}if(!client)client=new GoogleGenAI({apiKey:key});return client;}
async function askGemini(prompt){const ai=getClient();if(!ai)return null;const model=process.env.GEMINI_MODEL||'gemini-2.5-flash';try{const response=await ai.models.generateContent({model,contents:prompt,config:{temperature:0.45,maxOutputTokens:180}});return response.text?.trim()||null;}catch(e){console.error(`[Gemini] ${e.message}`);return null;}}
module.exports={askGemini};
