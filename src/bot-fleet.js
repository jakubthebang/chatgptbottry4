const { startBot } = require('./bot');

function startFleet(config) {
  const bots = Array.isArray(config.bots) && config.bots.length ? config.bots : [{ username: config.username || 'AIBot' }];
  for (const profile of bots) {
    startBot({ ...config, ...profile });
  }
}

module.exports = { startFleet };
