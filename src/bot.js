const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const { loadGameplay, registerCommands } = require('./gameplay');
const { starter, startHumanMovement } = require('./autonomy');
const { registerAIBrain } = require('./ai-brain');
const { startHumanBehavior, registerHumanEvents } = require('./human-behavior');

function createSafeMovements(bot) {
  const m = new Movements(bot);
  m.maxDropDown = 1;
  m.allowParkour = false;
  m.allow1by1towers = false;
  m.canDig = true;
  m.canOpenDoors = true;
  m.canUseDoors = true;
  m.liquidCost = 8;
  m.emptyCost = 1;
  m.lavaCost = 1000;
  m.waterCost = 8;
  m.mobCost = 20;
  return m;
}

function followPlayer(bot, username) {
  const target = bot.players[username]?.entity;
  if (!target) return bot.chat('Nevidím ťa.');
  bot.followingPlayer = username;
  bot.pathfinder.setMovements(createSafeMovements(bot));
  bot.pathfinder.setGoal(new goals.GoalNear(target.position.x, target.position.y, target.position.z, 2), true);
  bot.chat('Idem za tebou a priebežne hľadám bezpečnú trasu.');
}

function stopBot(bot) {
  bot.followingPlayer = null;
  bot.pathfinder.setGoal(null);
  bot.clearControlStates();
  if (bot.pvp) bot.pvp.stop();
}

function startBot(config) {
  let reconnectTimer = null;
  console.log(`[${config.username}] Connecting to ${config.host}:${config.port}...`);
  const bot = mineflayer.createBot({ host: config.host, port: config.port, username: config.username, auth: config.auth || 'offline', version: config.version || false });
  bot.loadPlugin(pathfinder);
  loadGameplay(bot);

  bot.once('spawn', async () => {
    console.log(`[${bot.username}] joined.`);
    bot.pathfinder.setMovements(createSafeMovements(bot));
    bot.chat('Ahoj! Som SurvivalCraftAI.');
    startHumanMovement(bot);
    startHumanBehavior(bot);
    registerHumanEvents(bot);
    await starter(bot);
  });

  bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    const text = message.trim().toLowerCase();
    if (text === '!help') return bot.chat('!follow !come !stop !pos !fight !build !mine <block> !baritone');
    if (text === '!pos') {
      const p = bot.entity.position;
      return bot.chat(`Pozícia: ${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)} | HP ${bot.health} | food ${bot.food}`);
    }
    if (text === '!stop') { stopBot(bot); return bot.chat('Zastavujem.'); }
    if (text === '!come' || text === '!follow') followPlayer(bot, username);
  });

  registerCommands(bot);
  registerAIBrain(bot);

  // Continuously refresh the follow target, so the bot follows a moving player.
  const followTimer = setInterval(() => {
    if (!bot.followingPlayer || !bot.entity) return;
    const target = bot.players[bot.followingPlayer]?.entity;
    if (!target) return;
    if (!bot.pathfinder.isMoving() || !bot.pathfinder.goal) {
      bot.pathfinder.setGoal(new goals.GoalNear(target.position.x, target.position.y, target.position.z, 2), true);
    }
  }, 700);

  bot.once('end', () => clearInterval(followTimer));
  bot.on('kicked', reason => console.log(`[${bot.username}] Kicked:`, reason));
  bot.on('error', err => console.error(`[${bot.username}] Error:`, err.message));
  bot.on('end', () => {
    console.log(`[${bot.username}] Disconnected. Reconnecting...`);
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => startBot(config), config.reconnectDelayMs || 5000);
  });
  return bot;
}

module.exports = { startBot };
