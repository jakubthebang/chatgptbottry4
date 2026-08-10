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

function isDangerousDrop(bot, position) {
  const x = Math.floor(position.x);
  const y = Math.floor(position.y);
  const z = Math.floor(position.z);

  for (let depth = 1; depth <= 4; depth++) {
    const block = bot.blockAt(bot.vec3(x, y - depth, z));
    if (!block) return true;
    if (block.boundingBox === 'block') return depth > 1;
  }
  return true;
}

function followPlayer(bot, username) {
  const target = bot.players[username]?.entity;
  if (!target) {
    bot.chat('Nevidím ťa.');
    return;
  }

  bot.pathfinder.setMovements(createSafeMovements(bot));
  bot.pathfinder.setGoal(
    new goals.GoalNear(target.position.x, target.position.y, target.position.z, 2),
    true
  );
  bot.chat('Idem za tebou. Hľadám bezpečnú trasu.');
}

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
    bot.pathfinder.setMovements(createSafeMovements(bot));
    bot.chat('Ahoj! Som AI bot.');
  });

  bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    const text = message.trim().toLowerCase();

    if (text === '!help') {
      bot.chat('Príkazy: !follow, !come, !stop, !pos');
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
      bot.chat('Zastavujem nasledovanie.');
      return;
    }

    if (text === '!come' || text === '!follow') {
      followPlayer(bot, username);
    }
  });

  const followTimer = setInterval(() => {
    if (!bot.entity || !bot.pathfinder.isMoving()) return;
    const activeGoal = bot.pathfinder.goal;
    if (!(activeGoal instanceof goals.GoalNear)) return;

    const target = Object.values(bot.players)
      .find(player => player.entity && player.username !== bot.username &&
        Math.abs(player.entity.position.x - activeGoal.x) < 3 &&
        Math.abs(player.entity.position.y - activeGoal.y) < 3 &&
        Math.abs(player.entity.position.z - activeGoal.z) < 3);

    if (target) {
      bot.pathfinder.setGoal(
        new goals.GoalNear(
          target.entity.position.x,
          target.entity.position.y,
          target.entity.position.z,
          2
        ),
        true
      );
    }

    if (isDangerousDrop(bot, bot.entity.position)) {
      bot.clearControlStates();
      bot.pathfinder.stop();
    }
  }, 500);

  bot.once('end', () => clearInterval(followTimer));
  bot.on('kicked', reason => console.log('Kicked:', reason));
  bot.on('error', err => console.error('Bot error:', err.message));
  bot.on('end', () => {
    console.log('Disconnected. Reconnecting...');
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(startBot, config.reconnectDelayMs || 5000);
  });
}

startBot();
