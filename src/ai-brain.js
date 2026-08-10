const API_URL = process.env.AI_API_URL || 'https://api.openai.com/v1/responses';
const MODEL = process.env.AI_MODEL || 'gpt-5-mini';
const API_KEY = process.env.OPENAI_API_KEY || '';

function snapshot(bot) {
  const p = bot.entity?.position;
  const health = bot.health ?? null;
  const food = bot.food ?? null;
  const items = bot.inventory?.items?.().slice(0, 18).map(i => `${i.name} x${i.count}`).join(', ') || 'empty';
  const nearby = Object.values(bot.entities || {}).filter(e => e && e !== bot.entity && e.position && p && p.distanceTo(e.position) < 12).slice(0, 12).map(e => e.name || e.type).join(', ');
  return `pos=${p ? `${p.x.toFixed(1)},${p.y.toFixed(1)},${p.z.toFixed(1)}` : 'unknown'} health=${health} food=${food} inventory=${items} nearby=${nearby || 'none'}`;
}

async function askAI(bot, username, message) {
  if (!API_KEY) return `Rozumiem, ${username}. AI mozog ešte nemá nastavený OPENAI_API_KEY.`;

  const prompt = [
    'You control a Minecraft survival bot.',
    'Behave like a cautious human player. Never claim an action happened unless the bot actually performed it.',
    'The bot can follow, mine, craft, build, fight mobs, explore, eat, and navigate using its local tools.',
    `Current world state: ${snapshot(bot)}`,
    `Player ${username} says: ${message}`,
    'Reply in short natural Slovak. If the message asks for an action, state the intended action clearly.'
  ].join('\n');

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ model: MODEL, input: prompt, max_output_tokens: 120 })
  });
  if (!response.ok) throw new Error(`AI HTTP ${response.status}`);
  const data = await response.json();
  return data.output_text || data.output?.flatMap(x => x.content || []).map(x => x.text).filter(Boolean).join(' ') || 'Neviem čo povedať.';
}

function registerAIBrain(bot) {
  bot.on('chat', async (username, message) => {
    if (username === bot.username) return;
    const lower = message.toLowerCase();
    const mentioned = lower.includes(bot.username.toLowerCase()) || lower.includes('@aibot');
    if (!mentioned) return;
    try {
      const clean = message.replace(new RegExp(`@?${bot.username}`, 'ig'), '').replace(/@?aibot/ig, '').trim();
      const reply = await askAI(bot, username, clean || message);
      bot.chat(reply.slice(0, 240));
    } catch (err) {
      console.error('AI brain:', err.message);
      bot.chat('Môj AI mozog je momentálne nedostupný.');
    }
  });
}

module.exports = { registerAIBrain, askAI };
