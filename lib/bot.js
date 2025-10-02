const path    = require("path");
const fs      = require("fs");
const moment  = require("moment-timezone");
const logger  = require("./logger");
const { loadJson, saveJson } = require("./file");

const statusFile = path.join(__dirname, "../statusHydro.json");

const MEDIA_DIR = path.resolve(__dirname, "../media");
const KODE_PATH = path.resolve(__dirname, "../kode_unik.json");

const TRIGGERS = {
  hydroOn: [
    "Yuk ikuti Promo *HYDROPLUS Nonstop Miliaran !*",
    "Selamat ya, kamu sudah dapat semua hadiahmu dari Hydroplus.",
  ],
  kode:   ["Silakan tuliskan kode unik"],
  foto:   ["Mohon kirimkan bukti foto kode unik"],
  ktp:    ["Untuk verifikasi lebih lanjut mohon kirimkan foto KTP"],
  sukses: ["Terima kasih, KTP dan kode unik kamu berhasil diproses"],
  thanks: ["Yuk coba lagi dengan kode unik yang lain di dalam tutup botol"],
};

async function handleAuto(sock, msg, from, OWNER_JID, TARGET_JID, TARGET_JID_VIP) {
  const body = msg.message?.conversation ||
               msg.message?.extendedTextMessage?.text || "";
  if (!body) return;

  const kodeData = loadJson(KODE_PATH);

  /* === HYDRO ON === */
  if (TRIGGERS.hydroOn.some(t => body.includes(t))) {
    const tanggal = moment().format("ddd, DD MMM YYYY");
    const jam     = moment().format("HH:mm");

    const pesan = `*INFO PENTING HYDRO ON!!* ⚡

╭──❍「 *HYDRO INFO* 」❍
├ Status : ON
├ Date   : ${tanggal}
├ Time   : ${jam}
╰───────────────❍
╭──❍「 *BOT INFO* 」❍
├ Bot Name  : HamsBotz
├ Author    : Hams
├ Status    : Aktif
╰───────────────❍`;

    try {
      const fileContent   = fs.readFileSync(statusFile, "utf8");
      const statusData    = JSON.parse(fileContent);
      const currentStatus = statusData[0].status;

      if (currentStatus === "OFF") {
        // Ubah jadi ON
        statusData[0].status = "ON";
        fs.writeFileSync(statusFile, JSON.stringify(statusData, null, 2), "utf8");

        // Kirim pesan ke target utama & owner
        await sock.sendMessage(TARGET_JID, {text: "✅ Pesan terdeteksi, *HYDRO ON!!*"})
        await sock.sendMessage(TARGET_JID, { text: pesan }).catch(logger.error);
        await sock.sendMessage(OWNER_JID, { text: pesan }).catch(logger.error);
      } else {
        console.log("Status sudah ON, tidak kirim ulang pesan.");
      }
      await new Promise(r => setTimeout(r, 30_000));
        await sock.sendMessage(from, { text: "Hi" });
    } catch (err) {
      console.error("Gagal membaca/menulis hydroStatus.json:", err);
    }
  }

  /* === Kirim kode unik === */
  if (TRIGGERS.kode.some(t => body.includes(t))) {
    const idx = kodeData.findIndex(k => k.status === "Elig");
    if (idx !== -1) {
      const { kode } = kodeData[idx];
      await sock.sendMessage(from, { text: kode }).catch(logger.error);

      kodeData[idx].status = "Pending";
      saveJson(KODE_PATH, kodeData);
    } else {
      await sock.sendMessage(from, {
        text: "Bang, kodenya abis. Hydro udah on 🔥",
      }).catch(logger.error);
    }
  }

  /* === Kirim gambar botol === */
  if (TRIGGERS.foto.some(t => body.includes(t))) {
    const file = path.join(MEDIA_DIR, "botol.jpg");
    if (fs.existsSync(file)) {
      await sock.sendMessage(from, { image: fs.readFileSync(file) }).catch(logger.error);
    } else {
      await sock.sendMessage(from, { text: "Gambar botol tidak tersedia." }).catch(logger.error);
    }
  }

  /* === Kirim KTP === */
  if (TRIGGERS.ktp.some(t => body.includes(t))) {
    const file = path.join(MEDIA_DIR, "ktp.jpg");
    if (fs.existsSync(file)) {
      await sock.sendMessage(from, { image: fs.readFileSync(file) }).catch(logger.error);
    } else {
      await sock.sendMessage(from, { text: "Gambar KTP tidak tersedia." }).catch(logger.error);
    }
  }

  /* === Sukses verifikasi === */
  if (TRIGGERS.sukses.some(t => body.includes(t))) {
    const idx = kodeData.findIndex(k => k.status === "Pending");
    if (idx !== -1) {
      kodeData[idx].status = "Used";
      saveJson(KODE_PATH, kodeData);
    }
  }

  /* === Thanks (Hydro MT) === */
  if (TRIGGERS.thanks.some(t => body.includes(t))) {
     try {
      const fileContent   = fs.readFileSync(statusFile, "utf8");
      const statusData    = JSON.parse(fileContent);
      const currentStatus = statusData[0].status;

      const tanggal = moment().format("ddd, DD MMM YYYY");
      const jam     = moment().format("HH:mm");

      if (currentStatus === "ON") {
        // Ubah jadi OFF
        statusData[0].status = "OFF";
        fs.writeFileSync(statusFile, JSON.stringify(statusData, null, 2), "utf8");

        const pesanMt = `🚨🚨 *ALERT!!! HYDRO MT* 🚨🚨

╭──❍「 *HYDRO INFO* 」❍
├ Status : OFF
├ Date   : ${tanggal}
├ Time   : ${jam}
╰───────────────❍
╭──❍「 *BOT INFO* 」❍
├ Bot Name  : HamsBotz
├ Author    : Hams
├ Status    : Aktif
╰───────────────❍`;

        await sock.sendMessage(TARGET_JID, { text: "🚨🚨 *ALERT!!! HYDRO MT* 🚨🚨" });
        await sock.sendMessage(TARGET_JID, { text: pesanMt });
      }
      await new Promise(r => setTimeout(r, 60_000));
      await sock.sendMessage(from, { text: "Hi" }).catch(logger.error);
    } catch (err) {
      console.error("Gagal membaca/menulis hydroStat.json:", err);
    }
  }
}

module.exports = { handleAuto };