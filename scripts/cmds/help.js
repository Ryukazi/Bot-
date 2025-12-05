const axios = require("axios");

module.exports.config = {
  name: "help",
  version: "3.0",
  author: "Lord Denish",
  role: 0,
  category: "info",
  shortDescription: "Clean structured help",
  longDescription: "Shows all commands in long, record-style list",
  guide: "{p}help"
};

module.exports.onStart = async function ({ api, event }) {
  try {

    // --- BIG ARRAY FOR RANDOM TOPICS ---
    const topics = [
      "ichigo", "luffy", "Aizen", "Shi hao", "Zoro", "Sanji",
      "sinji", "goku", "k dash", "tokyo", "samurai", "retro",
      "night city", "dragon", "black wallpaper", "mountains", "sky",
      "flowers", "fog", "magical fantasy"
    ];
    const topic = topics[Math.floor(Math.random() * topics.length)];

    // --- FETCH PINTEREST IMAGE ---
    const pin = await axios.get(
      `https://denish-pin.vercel.app/api/search-download?query=${encodeURIComponent(topic)}`
    );

    const arr = pin.data?.data;
    if (!arr || !arr.length)
      return api.sendMessage("❌ Pinterest error.", event.threadID, event.messageID);

    const imgURL = arr[Math.floor(Math.random() * arr.length)];

    // --- UPTIME ---
    const up = process.uptime();
    const h = Math.floor(up / 3600);
    const m = Math.floor((up % 3600) / 60);
    const s = Math.floor(up % 60);
    const uptime = `${h}h ${m}m ${s}s`;

    // --- COMMAND LIST ---
    const commands = global.GoatBot?.commands;
    if (!commands)
      return api.sendMessage("❌ Cannot find command list.", event.threadID, event.messageID);

    const groups = {};

    for (const [name, info] of commands.entries()) {
      const cat = info.config.category || "Others";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(name);
    }

    // --- SIMPLE CLEAN SEPARATOR STYLE ---
    let text = "";
    text += "================ HELP MENU ================\n";
    text += `Bot Owner : Lord Denish\n`;
    text += `Total Cmds: ${commands.size}\n`;
    text += `Uptime    : ${uptime}\n`;
    text += `Topic Img : ${topic}\n`;
    text += "===========================================\n\n";

    // LONG ARRAY-LIKE LISTING
    for (const [cat, cmds] of Object.entries(groups)) {
      text += `== ${cat.toUpperCase()} ==\n`;
      text += cmds.sort().map(c => `• ${c}`).join("\n");
      text += "\n\n-------------------------------------------\n\n";
    }

    text += "================= END =====================";

    // --- SEND MESSAGE WITH IMAGE ---
    const stream = await axios.get(imgURL, { responseType: "stream" });

    api.sendMessage(
      { body: text, attachment: stream.data },
      event.threadID,
      event.messageID
    );

  } catch (e) {
    console.log(e);
    api.sendMessage("❌ Failed to load help menu.", event.threadID, event.messageID);
  }
};
