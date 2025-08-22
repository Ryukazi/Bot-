‎const axios = require("axios");
‎const fs = require("fs-extra");
‎const path = require("path");
‎
‎module.exports = {
‎  config: {
‎    name: "hostmedia",
‎    aliases: ["hm", "mediaup", "hostfile"],
‎    version: "3.2",
‎    author: "Lord Denish",
‎    role: 0,
‎    shortDescription: "Host images, audio, or video and get a link",
‎    longDescription: "Uploads the replied media (image, audio, video) to GitHub and returns the raw link",
‎    category: "Utility",
‎    guide: "Reply to an image, audio, or video and use this command"
‎  },
‎
‎  onStart: async function({ message, event, api }) {
‎    try {
‎      const reply = message.reply_message || event.messageReply;
‎      if (!reply || !reply.attachments || reply.attachments.length === 0) {
‎        return message.reply("❌ Please reply to a media file (image, audio, or video).");
‎      }
‎
‎      const file = reply.attachments[0];
‎
‎      // --- FIXED MEDIA TYPE DETECTION ---
‎      let type = "file";
‎      const fileType = file.type?.toLowerCase() || "";
‎
‎      if (fileType.includes("image") || fileType === "photo") type = "image";
‎      else if (fileType.includes("audio") || fileType === "voice") type = "audio";
‎      else if (fileType.includes("video")) type = "video";
‎
‎      // File extension
‎      let ext = path.extname(file.filename || file.url).toLowerCase();
‎      const sizeMB = file.size / (1024 * 1024);
‎
‎      // Determine repo and folder
‎      let REPO = "", PATH_FOLDER = "";
‎      if (type === "image") {
‎        if (![".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) ext = ".jpg";
‎        REPO = "Ryukazi/host-image";
‎        PATH_FOLDER = "images";
‎        if (sizeMB > 25) return message.reply("⚠ Image too large! Must be under 25MB.");
‎      } else if (type === "audio") {
‎        if (!ext) ext = ".mp3";
‎        REPO = "Ryukazi/host-audio";
‎        PATH_FOLDER = "audios";
‎        if (sizeMB > 25) return message.reply("⚠ Audio too large! Must be under 25MB.");
‎      } else if (type === "video") {
‎        if (!ext) ext = ".mp4";
‎        REPO = "Ryukazi/video-hosting";
‎        PATH_FOLDER = "videos";
‎        if (sizeMB > 25) return message.reply("⚠ Video too large! Must be under 25MB.");
‎      } else {
‎        return message.reply("❌ Unsupported media type.");
‎      }
‎
‎      const fileName = `${PATH_FOLDER}-${Date.now()}${ext}`;
‎      await message.reply("⏳ Uploading media...");
‎
‎      // Download file
‎      const buffer = (await axios.get(file.url, { responseType: "arraybuffer" })).data;
‎      const base64Content = Buffer.from(buffer).toString("base64");
‎
‎      // --- HARD-CODED TOKEN FOR TESTING ---
‎      const GITHUB_TOKEN = "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";
‎      const BRANCH = "main";
‎      const githubApi = `https://api.github.com/repos/${REPO}/contents/${PATH_FOLDER}/${fileName}`;
‎
‎      await axios.put(
‎        githubApi,
‎        { message: `Upload ${fileName}`, content: base64Content, branch: BRANCH },
‎        { headers: { Authorization: `token ${GITHUB_TOKEN}`, "User-Agent": "HostMediaBot" } }
‎      );
‎
‎      const hostedLink = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${PATH_FOLDER}/${fileName}`;
‎      message.reply(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} hosted successfully:\n${hostedLink}`);
‎
‎    } catch (err) {
‎      console.error(err?.response?.data || err);
‎      message.reply("❌ Failed to host media. Check token, repo, or file size.");
‎    }
‎  }
‎};
