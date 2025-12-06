module.exports = {
  config: {
    name: "groupinfo",
    aliases: ["ginfo"],
    version: "1.0",
    author: "Denesh",
    countDown: 3,
    role: 0,
    shortDescription: "Show group info + group image",
    longDescription: "Fetches group info and sends the real group image",
    category: "group"
  },

  onStart: async function ({ api, event }) {
    try {
      const threadID = event.threadID;

      // Fetch group info from Facebook
      const info = await api.getThreadInfo(threadID);

      const name = info.threadName || "Unknown";
      const emoji = info.emoji || "❌";
      const approval = info.approvalMode ? "ON" : "OFF";
      const totalMsg = info.messageCount || 0;

      // Count genders
      let male = 0, female = 0, unknown = 0;
      info.userInfo.forEach(u => {
        if (u.gender === 2) male++;
        else if (u.gender === 1) female++;
        else unknown++;
      });

      // Admin list
      const admins = info.adminIDs
        .map(x => info.userInfo.find(u => u.id == x.id))
        .filter(Boolean);

      // Nicknames
      const nicknames = Object.keys(info.nicknames || {}).map(id => {
        const user = info.userInfo.find(u => u.id == id);
        return `• ${user?.name || id}: ${info.nicknames[id]}`;
      }).join("\n");

      // Real group image from Messenger
      const groupImage = info.imageSrc; // URL of group photo

      // Build text message
      let text = `===== [ GROUP INFO ] =====

• Name: ${name}
• ID: ${threadID}
• Emoji: ${emoji}
• Approval Mode: ${approval}

===== [ MEMBERS ] =====
• Total: ${info.userInfo.length}
• Male: ${male}
• Female: ${female}
• Unknown: ${unknown}

===== [ ADMINS (${admins.length}) ] =====
${admins.map(a => `• ${a.name} (${a.id})`).join("\n")}

===== [ STATS ] =====
• Total Messages: ${totalMsg}

===== [ NICKNAMES ] =====
${nicknames || "No nicknames set"}`;

      // Send text + group photo
      api.sendMessage(
        {
          body: text,
          attachment: groupImage
            ? await global.utils.getStreamFromURL(groupImage)
            : null
        },
        threadID
      );

    } catch (e) {
      console.log(e);
      api.sendMessage("❌ Failed to fetch group info.", event.threadID);
    }
  }
};
