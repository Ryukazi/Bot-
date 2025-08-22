const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "pending",
    aliases: ["pen"],
    version: "2.0",
    author: "Denish x Ryukazi ",
    countDown: 2,
    role: 2,
    shortDescription: "Manage pending messages",
    longDescription: "Approve or view pending user/thread requests.",
    category: "Utility",
  },

  // Handle replies (approvals)
  onReply: async function ({ message, api, event, Reply }) {
    const { author, pending } = Reply;
    if (String(event.senderID) !== String(author)) return;

    const { body, threadID, messageID } = event;
    if (!body) return api.sendMessage("[ ERR ] Invalid response!", threadID, messageID);

    // Cancel option
    if (body.trim().toLowerCase().startsWith("c")) {
      return api.sendMessage(`[ OK ] Canceled approval.`, threadID, messageID);
    }

    // Parse selected indices
    const indices = body.split(/\s+/).map(n => parseInt(n)).filter(n => !isNaN(n) && n > 0 && n <= pending.length);
    if (!indices.length) return api.sendMessage("[ ERR ] No valid numbers provided!", threadID, messageID);

    api.unsendMessage(messageID);

    const filePath = path.join(__dirname, "assets/box.mp4");
    const downloadUrl = "https://raw.githubusercontent.com/Ryukazi/video-hosting/main/videos/videos-1755868405790.mp4";

    try {
      // Download video file
      const response = await axios({ method: "GET", url: downloadUrl, responseType: "stream" });
      const writer = fs.createWriteStream(filePath);

      response.data.pipe(writer);

      writer.on("finish", async () => {
        for (const i of indices) {
          const targetThread = pending[i - 1].threadID;

          api.changeNickname(`[ ${global.GoatBot.config.prefix} ] ${global.GoatBot.config.nickNameBot || "Bot"}`, targetThread, api.getCurrentUserID());

          api.sendMessage(
            {
              body: `${global.GoatBot.config.nickNameBot || "Bot"} is now connected! Use ${global.GoatBot.config.prefix}help to see available commands.`,
              attachment: fs.createReadStream(filePath)
            },
            targetThread
          );
        }
        api.sendMessage(`[ ✅ ] Approved ${indices.length} thread(s)!`, threadID);
      });

      writer.on("error", (error) => {
        console.error(error);
        api.sendMessage("[ ERR ] Failed to save video file!", threadID);
      });
    } catch (error) {
      console.error(error);
      api.sendMessage("[ ERR ] Failed to download video file!", threadID);
    }
  },

  // Command start
  onStart: async function ({ message, api, event, args, usersData }) {
    const { threadID, messageID, senderID } = event;
    const admins = global.GoatBot.config.adminBot || [];

    if (!args.length) {
      return api.sendMessage(
        "❯ Usage:\n" +
        "• pending user : Show pending user requests\n" +
        "• pending thread : Show pending group requests\n" +
        "• pending all : Show all pending requests",
        threadID, messageID
      );
    }

    if (!admins.includes(senderID)) {
      return api.sendMessage("[ ⛔ ] You don't have permission to use this command!", threadID, messageID);
    }

    const type = args[0].toLowerCase();
    let list = [];

    try {
      const spam = await api.getThreadList(100, null, ["OTHER"]) || [];
      const pending = await api.getThreadList(100, null, ["PENDING"]) || [];
      const combinedList = [...spam, ...pending];

      if (["user", "u", "-u"].includes(type)) {
        list = combinedList.filter(t => !t.isGroup);
      } else if (["thread", "t", "-t"].includes(type)) {
        list = combinedList.filter(t => t.isGroup && t.isSubscribed);
      } else if (["all", "a", "-a"].includes(type)) {
        list = combinedList;
      } else {
        return api.sendMessage("[ ERR ] Invalid option! Use 'user', 'thread', or 'all'.", threadID, messageID);
      }
    } catch (e) {
      console.error(e);
      return api.sendMessage("[ ERR ] Can't fetch pending list.", threadID, messageID);
    }

    if (!list.length) {
      return api.sendMessage(`[ - ] No ${type}(s) pending approval.`, threadID, messageID);
    }

    let msg = list.map((item, i) => {
      const name = item.isGroup ? (item.name || "Unnamed Group") : (usersData.getName(item.threadID) || "Unknown User");
      return `${i + 1}. ${name} (${item.threadID})`;
    }).join("\n");

    api.sendMessage(
      `❯ Found ${list.length} ${type}(s) pending approval:\n\n${msg}\n\nReply with numbers to approve (or "c" to cancel).`,
      threadID,
      (err, info) => {
        if (!err) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            messageID: info.messageID,
            author: senderID,
            pending: list
          });
        }
      },
      messageID
    );
  }
};
