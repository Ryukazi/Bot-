const axios = require("axios");
const fs = require("fs");
const path = require("path");

async function downloadAttachment(url) {
  const filePath = path.join(__dirname, "temp_attachment.jpg");
  const response = await axios.get(url, { responseType: "arraybuffer" });
  fs.writeFileSync(filePath, Buffer.from(response.data, "binary"));
  return fs.createReadStream(filePath);
}

module.exports = { downloadAttachment };
