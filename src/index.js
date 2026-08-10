const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const fs = require('fs');

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

let reconnectTimer = null;

function startBot() {
  console.log(`Connecting to ${config.host}:${config.port} as ${config.username}...`);

  const bot = mineflayer.createBot({
    host: config.host,
    port: config.port,
    username: config.username,
    auth: config.auth || 'offline',
    version: config.version || false
  });

  bot.loadPlugin(pathfinder);

  bot.once('spawn', () => {
    console.log(`Bot joined the server as ${bot.username}.`);
    const movements = new Movements(bot);
    bot.pathfinder.setMovements(movements);
    bot.chat('Ahoj! Som AI bot.');
  });

  bot.on('chat', (username, message) => {
    if (username === bot.username) return;

    const text = message.trim();
    if (text === '!help') {
      bot.chat('Príkazy: !come, !stop, !pos');
      return;
    }

    if (text === '!pos') {
      const p = bot.entity.position;
      bot.chat(`Moja pozícia: ${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}`);
      return;
    }

    if (text === '!stop') {
      bot.pathfinder.setGoal(null);
      bot.clearControlStates();
      bot.chat('Zastavujem.');
      return;
    }

    if (text === '!come') {
      const target = bot.players[username]?.entity;
      if (!target) {
        bot.chat('Nevidím tvoju pozíciu.');
        return;
      }
      bot.pathfinder.setGoal(new goals.GoalNear(
        target.position.x,
        target.position.y,
        target.position.z,
        2
      ));
      bot.chat('Idem za tebou.');
    }
  });

  bot.on('kicked', (reason) => console.log('Kicked:', reason));
  bot.on('error', (err) => console.error('Bot error:', err.message));
  bot.on('end', () => {
    console.log('Disconnected. Reconnecting...');
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(startBot, config.reconnectDelayMs || 5000);
  });
}

startBot();
