const fs = require('fs');
const path = require('path');

function memoryPath(bot) {
  return path.join(process.cwd(), 'data', `${bot.username}.json`);
}

function loadMemory(bot) {
  try {
    const file = memoryPath(bot);
    if (!fs.existsSync(file)) return { home: null, places: [], notes: [], deaths: 0 };
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) {
    return { home: null, places: [], notes: [], deaths: 0 };
  }
}

function saveMemory(bot) {
  try {
    const dir = path.dirname(memoryPath(bot));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(memoryPath(bot), JSON.stringify(bot.memory, null, 2));
  } catch (e) {
    console.warn(`[${bot.username}] memory save failed: ${e.message}`);
  }
}

function rememberPlace(bot, name, position) {
  if (!position) return;
  bot.memory.places = bot.memory.places || [];
  bot.memory.places = bot.memory.places.filter(p => p.name !== name);
  bot.memory.places.push({ name, x: Math.round(position.x), y: Math.round(position.y), z: Math.round(position.z), at: Date.now() });
  bot.memory.places = bot.memory.places.slice(-30);
  saveMemory(bot);
}

function setHome(bot, position = bot.entity?.position) {
  if (!position) return;
  bot.memory.home = { x: Math.round(position.x), y: Math.round(position.y), z: Math.round(position.z) };
  saveMemory(bot);
}

module.exports = { loadMemory, saveMemory, rememberPlace, setHome };
