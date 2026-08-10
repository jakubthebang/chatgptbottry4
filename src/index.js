const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const fs = require('fs');
const { loadGameplay, registerCommands } = require('./gameplay');
const { starter, startHumanMovement } = require('./autonomy');
const { registerChatAI } = require('./chat-ai');

const config = fs.existsSync('config.json') ? JSON.parse(fs.readFileSync('config.json', 'utf8')) : {
  host: process.env.MC_HOST || 'localhost', port: Number(process.env.MC_PORT || 25565), version: process.env.MC_VERSION || false,
  username: process.env.MC_USERNAME || 'AIBot', auth: process.env.MC_AUTH || 'offline', reconnectDelayMs: 5000
};
let reconnectTimer = null;

function createSafeMovements(bot) {
  const m = new Movements(bot);
  m.maxDropDown = 1; m.allowParkour = false; m.allow1by1towers = false;
  m.canDig = true; m.canOpenDoors = true; m.canUseDoors = true;
  m.liquidCost = 8; m.emptyCost = 1; m.lavaCost = 1000; m.waterCost = 8; m.mobCost = 20;
  return m;
}

function followPlayer(bot, username) {
  const target = bot.players[username]?.entity;
  if (!target) return bot.chat('Nevidím ťa.');
  bot.pathfinder.setMovements(createSafeMovements(bot));
  bot.pathfinder.setGoal(new goals.GoalNear(target.position.x, target.position.y, target.position.z, 2), true);
  bot.chat('Idem za tebou a hľadám bezpečnú trasu.');
}

function startBot() {
  console.log(`Connecting to ${config.host}:${config.port} as ${config.username}...`);
  const bot = mineflayer.createBot({ host: config.host, port: config.port, username: config.username, auth: config.auth || 'offline', version: config.version || false });
  bot.loadPlugin(pathfinder);
  loadGameplay(bot);

  bot.once('spawn', async () => {
    console.log(`Bot joined the server as ${bot.username}.`);
    bot.pathfinder.setMovements(createSafeMovements(bot));
    bot.chat('Ahoj! Som AI survival bot.');
    startHumanMovement(bot);
    await starter(bot);
  });

  bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    const text = message.trim().toLowerCase();
    if (text === '!help') { bot.chat('!follow !come !stop !pos !fight !build !mine <block> !baritone'); return; }
    if (text === '!pos') { const p = bot.entity.position; bot.chat(`Pozícia: ${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}`); return; }
    if (text === '!stop') { bot.pathfinder.setGoal(null); bot.clearControlStates(); if (bot.pvp) bot.pvp.stop(); bot.chat('Zastavujem.'); return; }
    if (text === '!come' || text === '!follow') followPlayer(bot, username);
  });

  registerCommands(bot);
  registerChatAI(bot);
  bot.on('kicked', reason => console.log('Kicked:', reason));
  bot.on('error', err => console.error('Bot error:', err.message));
  bot.on('end', () => { console.log('Disconnected. Reconnecting...'); clearTimeout(reconnectTimer); reconnectTimer = setTimeout(startBot, config.reconnectDelayMs || 5000); });
}
startBot();
