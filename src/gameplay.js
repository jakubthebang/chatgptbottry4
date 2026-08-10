const { goals } = require('mineflayer-pathfinder');

function loadGameplay(bot) {
  const pvp = require('mineflayer-pvp').plugin;
  const collectBlock = require('mineflayer-collectblock').plugin;
  const tool = require('mineflayer-tool').plugin;

  bot.loadPlugin(pvp);
  bot.loadPlugin(collectBlock);
  bot.loadPlugin(tool);
}

async function mine(bot, username, blockName) {
  const target = bot.findBlock({ matching: b => b && b.name === blockName, maxDistance: 32 });
  if (!target) return bot.chat(`Nenašiel som ${blockName} do 32 blokov.`);
  try {
    await bot.collectBlock.collect(target);
    bot.chat(`Vyťažil som ${blockName}.`);
  } catch (err) {
    bot.chat(`Ťažba zlyhala: ${err.message.slice(0, 60)}`);
  }
}

async function fightNearest(bot) {
  const mob = bot.nearestEntity(e =>
    e && e.type === 'mob' && e.position && bot.entity.position.distanceTo(e.position) < 16
  );
  if (!mob) return bot.chat('V okolí nevidím žiadneho moba.');
  try {
    bot.pvp.attack(mob);
  } catch (err) {
    bot.chat('Neviem zaútočiť na cieľ.');
  }
}

async function buildPlatform(bot) {
  const block = bot.inventory.items().find(i =>
    ['cobblestone', 'stone', 'dirt', 'oak_planks'].includes(i.name)
  );
  if (!block) return bot.chat('Potrebujem stavebný blok.');

  const base = bot.entity.position.floored().offset(1, -1, 0);
  const reference = bot.blockAt(base.offset(0, -1, 0));
  if (!reference) return bot.chat('Nemám vhodný podklad na stavanie.');

  try {
    await bot.equip(block, 'hand');
    await bot.placeBlock(reference, { x: 0.5, y: 1, z: 0.5 });
    bot.chat('Postavil som blok.');
  } catch (err) {
    bot.chat(`Stavanie zlyhalo: ${err.message.slice(0, 60)}`);
  }
}

function registerCommands(bot) {
  bot.on('chat', async (username, message) => {
    if (username === bot.username) return;
    const text = message.trim().toLowerCase();

    if (text === '!mine stone') return mine(bot, username, 'stone');
    if (text === '!mine cobblestone') return mine(bot, username, 'cobblestone');
    if (text === '!mine coal_ore') return mine(bot, username, 'coal_ore');
    if (text === '!mine iron_ore') return mine(bot, username, 'iron_ore');
    if (text === '!fight') return fightNearest(bot);
    if (text === '!build') return buildPlatform(bot);
    if (text === '!baritone') {
      bot.chat('Baritone je Java mod a nedá sa priamo vložiť do Mineflayer bota. Používam vlastný pathfinding podobný Baritone.');
    }
  });
}

module.exports = { loadGameplay, registerCommands };
