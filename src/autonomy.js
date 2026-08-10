const { goals } = require('mineflayer-pathfinder');
const sleep = ms => new Promise(r => setTimeout(r, ms));

function findBlock(bot, names, maxDistance = 48) {
  const set = new Set(names);
  return bot.findBlock({ matching: b => b && set.has(b.name), maxDistance });
}

function count(bot, names) {
  return bot.inventory.items().filter(i => names.includes(i.name)).reduce((n, i) => n + i.count, 0);
}

function firstRecipe(bot, output) {
  const item = bot.registry.itemsByName[output];
  return item ? (bot.recipesFor(item.id, null, 1, null)[0] || null) : null;
}

async function craft(bot, output) {
  const r = firstRecipe(bot, output);
  if (!r) return false;
  try { await bot.craft(r, 1, null); return true; } catch (_) { return false; }
}

async function collectLogs(bot, amount = 8) {
  let got = 0;
  for (let i = 0; i < amount; i++) {
    const b = findBlock(bot, ['oak_log','birch_log','spruce_log','jungle_log','acacia_log','dark_oak_log','mangrove_log','cherry_log']);
    if (!b) break;
    try { await bot.collectBlock.collect(b); got++; } catch (_) { break; }
  }
  return got;
}

async function collectStone(bot, amount = 12) {
  let got = 0;
  for (let i = 0; i < amount; i++) {
    const b = findBlock(bot, ['stone'], 32);
    if (!b) break;
    try { await bot.collectBlock.collect(b); got++; } catch (_) { break; }
  }
  return got;
}

async function starter(bot) {
  if (bot.autonomyStarted) return;
  bot.autonomyStarted = true;
  bot.chat('Začínam survival: drevo → crafting table → nástroje → kameň.');
  await sleep(1200);

  const logs = await collectLogs(bot, 8);
  if (!logs) { bot.chat('Nenašiel som drevo v okolí.'); return; }
  bot.chat(`Nazbieral som ${logs} drevo.`);

  const log = bot.inventory.items().find(i => i.name.endsWith('_log'));
  if (log) await craft(bot, log.name.replace('_log', '_planks'));
  if (count(bot, ['oak_planks','birch_planks','spruce_planks','jungle_planks','acacia_planks','dark_oak_planks','mangrove_planks','cherry_planks']) >= 4) await craft(bot, 'crafting_table');
  await craft(bot, 'stick');
  await craft(bot, 'wooden_pickaxe');

  if (bot.inventory.items().some(i => i.name === 'wooden_pickaxe')) {
    bot.chat('Mám drevený krompáč. Ťažím kameň.');
    const stone = await collectStone(bot, 12);
    if (stone) {
      await craft(bot, 'stone_pickaxe');
      await craft(bot, 'stone_axe');
      await craft(bot, 'stone_shovel');
      bot.chat('Kamenné nástroje sú hotové.');
    }
  }
}

function startHumanMovement(bot) {
  const timer = setInterval(() => {
    if (!bot.entity || bot.pathfinder.isMoving() || bot.pvp?.target || bot.autonomyBusy) return;
    if (Math.random() > 0.65) return;
    const p = bot.entity.position;
    bot.pathfinder.setGoal(new goals.GoalNear(p.x + Math.random()*12-6, p.y, p.z + Math.random()*12-6, 2));
  }, 4500);
  bot.once('end', () => clearInterval(timer));
}

module.exports = { starter, startHumanMovement };
