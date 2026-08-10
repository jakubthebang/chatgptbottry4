const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const fs = require('fs');
const { loadGameplay, registerCommands } = require('./gameplay');

const config = fs.existsSync('config.json') ? JSON.parse(fs.readFileSync('config.json', 'utf8')) : {
  host: process.env.MC_HOST || 'localhost', port: Number(process.env.MC_PORT || 25565),
  version: process.env.MC_VERSION || false, username: process.env.MC_USERNAME || 'AIBot',
  auth: process.env.MC_AUTH || 'offline', reconnectDelayMs: 5000
};

let reconnectTimer = null;

function createSafeMovements(bot) {
  const movements = new Movements(bot);
  movements.maxDropDown = 1;
  movements.allowParkour = false;
  movements.allow1by1towers = false;
  movements.canDig = true;
  movements.canOpenDoors = true;
  movements.canUseDoors = true;
  movements.liquidCost = 8;
  movements.emptyCost = 1;
  movements.lavaCost = 1000;
  movements.waterCost = 8;
  movements.mobCost = 20;
  return movements;
}

function followPlayer(bot, username) {
  const target = bot.players[username]?.entity;
  if (!target) return bot.chat('Nevidím ťa.');
  bot.pathfinder.setMovements(createSafeMovements(bot));
  bot.pathfinder.setGoal(new goals.GoalNear(target.position.x, target.position.y, target.position.z, 2), true);
  bot.chat('Idem za tebou. Hľadám bezpečnú trasu.');
}

function startBot() {
  console.log(`Connecting to ${config.host}:${config.port} as ${config.username}...`);
  const bot = mineflayer.createBot({ host: config.host, port: config.port, username: config.username, auth: config.auth || 'offline', version: config.version || false });
  bot.loadPlugin(pathfinder);
  loadGameplay(bot);

  bot.once('spawn', () => {
    console.log(`Bot joined the server as ${bot.username}.`);
    bot.pathfinder.setMovements(createSafeMovements(bot));
    bot.chat('Ahoj! Som AI bot.');
  });

  bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    const text = message.trim().toLowerCase();
    if (text === '!help') {
      bot.chat('!follow !come !stop !pos !fight !build !mine <block> !baritone');
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
      if (bot.pvp) bot.pvp.stop();
      bot.chat('Zastavujem.');
      return;
    }
    if (text === '!come' || text === '!follow') followPlayer(bot, username);
  });

  registerCommands(bot);

  bot.on('kicked', reason => console.log('Kicked:', reason));
  bot.on('error', err => console.error('Bot error:', err.message));
  bot.on('end', () => {
    console.log('Disconnected. Reconnecting...');
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(startBot, config.reconnectDelayMs || 5000);
  });
}

startBot();
