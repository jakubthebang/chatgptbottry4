const { goals } = require('mineflayer-pathfinder');
const { setHome, rememberPlace, saveMemory } = require('./memory');

const hostile = new Set(['zombie','husk','drowned','skeleton','stray','creeper','spider','cave_spider','witch','pillager','vindicator','phantom','enderman','piglin','hoglin','zoglin','blaze','magma_cube','silverfish','endermite']);
const foods = ['bread','cooked_beef','cooked_porkchop','cooked_chicken','cooked_mutton','cooked_rabbit','baked_potato','golden_carrot','apple','carrot','potato','beetroot'];
const tools = ['wooden_pickaxe','stone_pickaxe','iron_pickaxe','diamond_pickaxe','netherite_pickaxe'];

function count(bot, names) { return bot.inventory.items().filter(i => names.includes(i.name)).reduce((n,i)=>n+i.count,0); }
function has(bot, name) { return count(bot,[name]) > 0; }
function danger(bot) { return bot.nearestEntity(e => e && (e.type === 'mob' && hostile.has(e.name)) && e.position && bot.entity.position.distanceTo(e.position) < 10); }
function chooseGoal(bot) {
  if (!bot.entity) return 'waiting';
  if ((bot.health ?? 20) <= 6) return 'recover';
  if ((bot.food ?? 20) <= 10 && count(bot, foods) === 0) return 'find_food';
  if ((bot.food ?? 20) <= 10 && count(bot, foods) > 0) return 'eat';
  if (!tools.some(t => has(bot,t))) return 'get_tools';
  if (danger(bot)) return 'escape';
  if (bot.time?.timeOfDay > 13000 && bot.time?.timeOfDay < 23000 && bot.memory.home) return 'return_home';
  if (bot.inventory.items().length > 32 && bot.memory.home) return 'return_home';
  return 'explore';
}

function startGoalManager(bot) {
  if (bot.goalManagerStarted) return;
  bot.goalManagerStarted = true;
  bot.currentGoal = 'starting';
  const timer = setInterval(() => {
    if (!bot.entity || bot.autonomyBusy || bot.pathfinder.isMoving() || bot.pvp?.target) return;
    const goal = chooseGoal(bot);
    bot.currentGoal = goal;
    if (goal === 'recover' || goal === 'escape') {
      const d = danger(bot);
      if (d) {
        const p = bot.entity.position, dx = p.x-d.position.x, dz = p.z-d.position.z, len=Math.max(.1,Math.hypot(dx,dz));
        bot.pathfinder.setGoal(new goals.GoalNear(p.x+dx/len*12,p.y,p.z+dz/len*12,3));
      }
    }
  }, 2500);
  bot.once('end', () => clearInterval(timer));
}

function registerGoalCommands(bot) {
  bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    const text = message.trim();
    const lower = text.toLowerCase();
    if (lower === '!sethome') { setHome(bot); rememberPlace(bot,'home',bot.entity.position); bot.chat('Zapamätal som si túto základňu.'); }
    else if (lower === '!remember') { rememberPlace(bot, 'location-'+Date.now(), bot.entity.position); bot.chat('Zapamätal som si túto pozíciu.'); }
    else if (lower === '!goal') bot.chat(`Môj aktuálny cieľ: ${bot.currentGoal || 'neznámy'} | fáza: ${bot.autonomyStage || 'unknown'}`);
    else if (lower === '!home') {
      const h=bot.memory?.home;
      if (!h) return bot.chat('Nemám uloženú základňu. Použi !sethome.');
      bot.followingPlayer=null;
      bot.pathfinder.setGoal(new goals.GoalNear(h.x,h.y,h.z,2),true);
      bot.chat('Vraciavam sa na základňu.');
    }
  });
}

module.exports = { startGoalManager, registerGoalCommands, chooseGoal };
