const fs = require("fs");
const path = require("path");
function loadJson(file, fallback = []) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch (e) {
    require("./logger").error(`Gagal baca ${file}`, e.message);
    return fallback;
  }
}
function saveJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (e) {
    require("./logger").error(`Gagal tulis ${file}`, e.message);
  }
}
module.exports = { loadJson, saveJson };
