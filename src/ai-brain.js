const { askGemini } = require('./gemini');

function snapshot(bot) {
  const p = bot.entity?.position;
  const health = bot.health ?? null;
  const food = bot.food ?? null;
  const items = bot.inventory?.items?.().slice(0, 18).map(i => `${i.name} x${i.count}`).join(', ') || 'empty';
  const nearby = Object.values(bot.entities || {}).filter(e => e && e !== bot.entity && e.position && p && p.distanceTo(e.position) < 12).slice(0, 12).map(e => e.name || e.type).join(', ');
  return `pos=${p ? `${p.x.toFixed(1)},${p.y.toFixed(1)},${p.z.toFixed(1)}` : 'unknown'} health=${health} food=${food} inventory=${items} nearby=${nearby || 'none'}`;
}

async function askAI(bot, username, message) {
  const prompt = [
    'You control a Minecraft survival bot.',
    'Behave like a cautious human player. Never claim an action happened unless the bot actually performed it.',
    'The bot can follow, mine, craft, build, fight mobs, explore, eat and navigate using local tools.',
    `Current world state: ${snapshot(bot)}`,
    `Player ${username} says: ${message}`,
    'Reply in short natural Slovak. If the player asks for an action, say what you intend to do.'
  ].join('\n');
  const reply = await askGemini(prompt);
  return reply || 'Gemini AI mozog nemá nastavený GEMINI_API_KEY.';
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
      console.error(`[${bot.username}] Gemini AI:`, err.message);
      bot.chat('Gemini AI je momentálne nedostupné.');
    }
  });
}

module.exports = { registerAIBrain, askAI };
