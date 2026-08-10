const { askGemini } = require('./gemini');

function snapshot(bot) {
  const p = bot.entity?.position;
  const items = bot.inventory?.items?.().slice(0, 24).map(i => `${i.name} x${i.count}`).join(', ') || 'empty';
  const nearby = Object.values(bot.entities || {})
    .filter(e => e && e !== bot.entity && e.position && p && p.distanceTo(e.position) < 16)
    .slice(0, 16)
    .map(e => e.username || e.name || e.type).join(', ');
  return [
    `position=${p ? `${p.x.toFixed(1)},${p.y.toFixed(1)},${p.z.toFixed(1)}` : 'unknown'}`,
    `health=${bot.health ?? null}`,
    `food=${bot.food ?? null}`,
    `weather=${bot.isRaining ? 'rain' : 'clear'}`,
    `time=${bot.time?.timeOfDay ?? null}`,
    `stage=${bot.autonomyStage || 'unknown'}`,
    `urgency=${bot.humanUrgency || 'normal'}`,
    `following=${bot.followingPlayer || 'none'}`,
    `inventory=${items}`,
    `nearby=${nearby || 'none'}`
  ].join(' | ');
}

async function askAI(bot, username, message) {
  const prompt = [
    'You are SurvivalCraftAI, an autonomous Minecraft survival player.',
    'Think like a careful human player: observe first, choose a realistic next action, and never invent inventory, mining, crafting, combat or movement results.',
    'Prefer survival, food, safety and useful tools before risky exploration. Never destroy player builds for resources.',
    'If an action is requested, answer briefly and naturally in Slovak. The game controller, not the chat reply, is the source of truth for whether an action succeeded.',
    `WORLD: ${snapshot(bot)}`,
    `PLAYER ${username}: ${message}`
  ].join('\n');
  const reply = await askGemini(prompt);
  return reply || 'Gemini AI mozog nemá nastavený GEMINI_API_KEY.';
}

function registerAIBrain(bot) {
  bot.on('chat', async (username, message) => {
    if (username === bot.username) return;
    const lower = message.toLowerCase();
    if (!lower.includes(bot.username.toLowerCase()) && !lower.includes('@survivalcraftai') && !lower.includes('@aibot')) return;
    try {
      const clean = message.replace(new RegExp(`@?${bot.username}`, 'ig'), '').replace(/@?(survivalcraftai|aibot)/ig, '').trim();
      const reply = await askAI(bot, username, clean || message);
      bot.chat(reply.slice(0, 240));
    } catch (err) {
      console.error(`[${bot.username}] Gemini AI:`, err.message);
      bot.chat('Gemini AI je momentálne nedostupné.');
    }
  });
}

module.exports = { registerAIBrain, askAI, snapshot };
