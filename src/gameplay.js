const { goals } = require('mineflayer-pathfinder');

function loadGameplay(bot) {
  bot.loadPlugin(require('mineflayer-pvp').plugin);
  bot.loadPlugin(require('mineflayer-collectblock').plugin);
  bot.loadPlugin(require('mineflayer-tool').plugin);
}

function countItem(bot, name) { return bot.inventory.items().filter(i => i.name === name).reduce((n, i) => n + i.count, 0); }
function inventoryText(bot) { return bot.inventory.items().map(i => `${i.name} x${i.count}`).join(', ') || 'prázdny'; }

async function mine(bot, username, blockName) {
  const before = countItem(bot, blockName);
  const target = bot.findBlock({ matching: b => b && b.name === blockName, maxDistance: 32 });
  if (!target) return bot.chat(`Nenašiel som ${blockName} do 32 blokov.`);
  try {
    await bot.collectBlock.collect(target);
    const after = countItem(bot, blockName);
    bot.chat(after > before ? `Vyťažil som ${blockName} a mám ho reálne v inventári.` : `Ťažba ${blockName} prebehla, ale inventár sa nezmenil.`);
  } catch (err) { bot.chat(`Ťažba zlyhala: ${err.message.slice(0, 60)}`); }
}

async function fightNearest(bot) {
  const mob = bot.nearestEntity(e => e && e.type === 'mob' && e.position && bot.entity.position.distanceTo(e.position) < 16);
  if (!mob) return bot.chat('V okolí nevidím žiadneho moba.');
  try { bot.pvp.attack(mob); } catch (_) { bot.chat('Neviem zaútočiť na cieľ.'); }
}

async function eat(bot) {
  const foods = ['bread','cooked_beef','cooked_porkchop','cooked_chicken','cooked_mutton','baked_potato','golden_carrot','apple','carrot','potato'];
  const item = bot.inventory.items().find(i => foods.includes(i.name));
  if (!item) return bot.chat('Nemám jedlo.');
  try { await bot.equip(item, 'hand'); await bot.consume(); bot.chat(`Zjedol som ${item.name}. Food: ${bot.food}.`); }
  catch (e) { bot.chat(`Jedlo sa nepodarilo použiť: ${e.message.slice(0, 50)}`); }
}

function status(bot) {
  const p = bot.entity?.position;
  bot.chat(`HP ${bot.health} | food ${bot.food} | stage ${bot.autonomyStage || 'unknown'} | inv: ${inventoryText(bot).slice(0, 180)}`);
}

function stop(bot) {
  bot.followingPlayer = null;
  bot.pathfinder.setGoal(null);
  bot.clearControlStates();
  if (bot.pvp) bot.pvp.stop();
  bot.chat('Zastavujem aktuálne úlohy.');
}

function buildPlatform(bot) {
  const block = bot.inventory.items().find(i => ['cobblestone','stone','dirt','oak_planks'].includes(i.name));
  if (!block) return bot.chat('Potrebujem stavebný blok.');
  const base = bot.entity.position.floored().offset(1, -1, 0);
  const reference = bot.blockAt(base.offset(0, -1, 0));
  if (!reference) return bot.chat('Nemám vhodný podklad.');
  return bot.equip(block, 'hand').then(() => bot.placeBlock(reference, {x:0.5,y:1,z:0.5})).then(() => bot.chat('Postavil som blok.')).catch(e => bot.chat(`Stavanie zlyhalo: ${e.message.slice(0, 50)}`));
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
    if (text === '!eat') return eat(bot);
    if (text === '!status' || text === '!inventory') return status(bot);
    if (text === '!stop') return stop(bot);
    if (text === '!build') return buildPlatform(bot);
    if (text === '!baritone') return bot.chat('Používam Mineflayer pathfinding namiesto Java Baritone modu.');
    if (text === '!help') return bot.chat('!follow !come !stop !pos !status !inventory !eat !fight !build !mine <block>');
  });
}

module.exports = { loadGameplay, registerCommands };
