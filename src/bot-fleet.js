const { startBot } = require('./bot');

function startFleet(config) {
  // One human-facing AI agent by default. Additional agents can be added later.
  const bots = Array.isArray(config.bots) && config.bots.length
    ? config.bots
    : [{ username: config.username || 'SurvivalCraftAI' }];

  const seen = new Set();
  for (const profile of bots) {
    const username = profile.username || 'SurvivalCraftAI';
    if (seen.has(username)) continue;
    seen.add(username);
    startBot({ ...config, ...profile, username });
  }
}

module.exports = { startFleet };
