const fs = require('fs');
const { startFleet } = require('./bot-fleet');

const config = fs.existsSync('config.json')
  ? JSON.parse(fs.readFileSync('config.json', 'utf8'))
  : {
      host: process.env.MC_HOST || 'localhost',
      port: Number(process.env.MC_PORT || 25565),
      version: process.env.MC_VERSION || false,
      username: process.env.MC_USERNAME || 'AIBot',
      auth: process.env.MC_AUTH || 'offline',
      reconnectDelayMs: 5000
    };

startFleet(config);
