const moment = require("moment-timezone");
moment.tz.setDefault("Asia/Jakarta");
module.exports = {
  info:  (...a) => console.log(`[${moment().format("HH:mm:ss")}] ℹ️ `, ...a),
  error: (...a) => console.error(`[${moment().format("HH:mm:ss")}] ❌ `, ...a),
};
