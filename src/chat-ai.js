function registerChatAI(bot) {
  bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    const name = bot.username.toLowerCase();
    const text = message.trim();
    const lower = text.toLowerCase();
    if (!lower.includes(name) && !lower.includes('aibot')) return;

    const clean = text.replace(new RegExp(`@?${name}`, 'ig'), '').replace(/aibot/ig, '').trim();
    let reply = 'Počul som ťa. Čo mám spraviť?';
    if (/ahoj|čau|cau|hello|hi/.test(clean.toLowerCase())) reply = `Ahoj ${username}! Som pripravený.`;
    else if (/čo robíš|co robis|what are you doing/.test(clean.toLowerCase())) reply = 'Momentálne sa starám o survival a hľadám, čo treba spraviť.';
    else if (/nasleduj|follow/.test(clean.toLowerCase())) reply = 'Jasné, idem za tebou.';
    else if (/boj|mob|zombie|skeleton/.test(clean.toLowerCase())) reply = 'Ak bude treba, postarám sa o mobov.';
    else if (/ťaž|mine|kopa/.test(clean.toLowerCase())) reply = 'Môžem začať ťažiť a pripraviť si lepšie nástroje.';
    else if (/stav|build/.test(clean.toLowerCase())) reply = 'Môžem stavať jednoduché štruktúry.';
    else if (clean) reply = `Rozumiem, ${username}. Spracujem: ${clean.slice(0, 70)}`;
    bot.chat(reply);
  });
}
module.exports = { registerChatAI };
