const { goals } = require('mineflayer-pathfinder');

const sleep = ms => new Promise(r => setTimeout(r, ms));

function nearestPlayer(bot, max = 24) {
  return bot.nearestEntity(e => e && e.type === 'player' && e !== bot.entity && e.position && bot.entity.position.distanceTo(e.position) <= max);
}

function nearestHostile(bot, max = 18) {
  const hostile = new Set(['zombie','husk','drowned','skeleton','stray','spider','cave_spider','creeper','witch','pillager','vindicator','phantom','enderman']);
  return bot.nearestEntity(e => e && e.type === 'mob' && hostile.has(e.name) && e.position && bot.entity.position.distanceTo(e.position) <= max);
}

async function eatIfHungry(bot) {
  if (!bot.food || bot.food > 14) return false;
  const food = bot.inventory.items().find(i => ['bread','cooked_beef','cooked_porkchop','cooked_chicken','cooked_mutton','baked_potato','golden_carrot','apple','carrot','potato'].includes(i.name));
  if (!food) return false;
  try {
    await bot.equip(food, 'hand');
    await bot.consume();
    console.log(`[${bot.username}] ate ${food.name}`);
    return true;
  } catch (e) {
    console.warn(`[${bot.username}] eating failed: ${e.message}`);
    return false;
  }
}

function avoidCreeper(bot) {
  const creeper = bot.nearestEntity(e => e && e.name === 'creeper' && e.position && bot.entity.position.distanceTo(e.position) < 5);
  if (!creeper) return false;
  const p = bot.entity.position;
  const dx = p.x - creeper.position.x;
  const dz = p.z - creeper.position.z;
  const len = Math.hypot(dx, dz) || 1;
  bot.pathfinder.setGoal(new goals.GoalNear(p.x + (dx / len) * 10, p.y, p.z + (dz / len) * 10, 2));
  bot.chat('Creeper! Ustupujem.');
  return true;
}

function startHumanBehavior(bot) {
  let lastIdle = 0;
  const timer = setInterval(async () => {
    if (!bot.entity || bot.autonomyBusy || bot.pvp?.target) return;
    if (await eatIfHungry(bot)) return;
    if (avoidCreeper(bot)) return;

    const now = Date.now();
    if (now - lastIdle < 9000 || bot.pathfinder.isMoving()) return;
    lastIdle = now;

    // Human-like idle behavior: look around, pause, or walk a short distance.
    const r = Math.random();
    if (r < 0.25) {
      bot.look(bot.entity.yaw + (Math.random() - 0.5), bot.entity.pitch + (Math.random() - 0.5), true).catch(() => {});
    } else if (r < 0.45) {
      await sleep(700 + Math.random() * 1800);
    } else {
      const p = bot.entity.position;
      bot.pathfinder.setGoal(new goals.GoalNear(p.x + (Math.random() * 14 - 7), p.y, p.z + (Math.random() * 14 - 7), 2));
    }
  }, 1200);
  bot.once('end', () => clearInterval(timer));
}

function registerHumanEvents(bot) {
  bot.on('entityHurt', entity => {
    if (entity !== bot.entity) return;
    bot.lastDamageAt = Date.now();
    if (bot.health <= 8) bot.chat('Som zranený, idem sa stiahnuť a nájsť jedlo.');
  });

  bot.on('death', () => {
    bot.autonomyBusy = false;
    bot.autonomyStage = 'respawned';
    bot.chat('Zomrel som. Začnem znova a skúsim sa pripraviť lepšie.');
  });

  bot.on('playerCollect', (collector, itemEntity) => {
    if (collector !== bot.entity) return;
    console.log(`[${bot.username}] collected ${itemEntity?.itemStack?.name || 'item'}`);
  });
}

module.exports = { startHumanBehavior, registerHumanEvents, nearestPlayer, nearestHostile, eatIfHungry };
