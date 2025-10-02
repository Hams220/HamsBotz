const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const path = require("path");

const logger = require("./lib/logger");
const { handleAuto } = require("./lib/bot");

// ====== Konstanta Utama ======
const AUTH_DIR      = path.resolve(__dirname, "auth");
const OWNER_JID     = "6281462328581@s.whatsapp.net";
const TARGET_JID    = "120363164235959904@g.us";
const HYDRO_JID     = "6287780010053@s.whatsapp.net";
const OWNER_LID     = "73521501876361@lid";

let sock;
let qrShown = false;

// ====== Fungsi Utama Koneksi ======
async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
  });

  // Simpan perubahan creds
  sock.ev.on("creds.update", saveCreds);

  // ====== Event: Update Koneksi ======
  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    // QR Code
    if (qr && !qrShown) {
      qrShown = true;
      console.log("Scan QR di bawah ini:");
      qrcode.generate(qr, { small: true });
    }

    // Handle koneksi close / open
    if (connection === "close") {
      const reason    = lastDisconnect?.error?.output?.statusCode;
      const reconnect = reason !== DisconnectReason.loggedOut;

      logger.error("Koneksi tertutup. Reconnect =", reconnect);
      if (reconnect) connect();

    } else if (connection === "open") {
      logger.info("Bot WhatsApp sudah terhubung ✅");
    }
  });

  // ====== Event: Pesan Masuk ======
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg || msg.key?.fromMe) return;

    const from   = msg.key.remoteJid;
    const isAuthor = msg.key.participant === OWNER_LID;

    // Ambil isi pesan (fallback banyak tipe message)
    const body = (
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption ||
      msg.message?.audioMessage?.caption ||
      msg.message?.documentMessage?.caption ||
      msg.message?.documentWithCaptionMessage?.message?.documentMessage?.caption ||
      msg.message?.stickerMessage?.caption ||
      msg.message?.locationMessage?.name ||
      msg.message?.contactMessage?.displayName ||
      msg.message?.contactsArrayMessage?.contacts?.[0]?.displayName ||
      msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation ||
      msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text ||
      msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage?.caption ||
      msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage?.caption ||
      msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.documentMessage?.caption ||
      msg.message?.liveLocationMessage?.caption ||
      msg.message?.listResponseMessage?.title ||
      msg.message?.buttonsResponseMessage?.selectedButtonId ||
      msg.message?.templateButtonReplyMessage?.selectedId ||
      msg.message?.productMessage?.product?.title ||
      msg.message?.orderMessage?.itemCount?.toString() ||
      ""
    ).trim();
    // ====== Perintah: Test Bot ======
    if (body.toLowerCase() === "test bot") {
      await sock.sendMessage(TARGET_JID, {
        text: "Test berhasil, BOT Aktif, untuk memulai looping silahkan ketik *!start*."
      });
      return;
    }

    // ====== Perintah: Start Looping ======
    if (body.toLowerCase() === "!start") {
        if (!isAuthor) {
        return await sock.sendMessage(
          from,
          { text: "🚨 Kamu bukan admin" },
          { quoted: msg }
        );
      }

      await sock.sendMessage(
        from,
        { text: "Bot Aktif, sedang mencoba looping. *Mohon tunggu sampai Hydro ON*" },
        { quoted: msg }
      );

      await sock.sendMessage(HYDRO_JID, { text: "Hi" });
      return;
    }
    
    if (body === "!mt ON") {
      if (!isAuthor) {
        return await sock.sendMessage(
          from,
          { text: "🚨 Kamu bukan admin" },
          { quoted: msg }
        );
      }
      
      await sock.groupSettingUpdate(from, 'announcement')
      await sock.sendMessage(from, {text: "Group sedang Maintenance, jika ada pesan apapun dari bot, Mohon diabaikan terlebih dahulu"}, {quoted: msg})
    }
    
    if (body === "!mt OFF") {
      if (!isAuthor) {
        return await sock.sendMessage(
          from,
          { text: "🚨 Kamu bukan admin" },
          { quoted: msg }
        );
      }
      
      await sock.groupSettingUpdate(from, 'not_announcement')
      await sock.sendMessage(from, {text: "Maintenance berakhir!! Terima kasih telah berbaik hati"}, {quoted: msg})
    }
    
    if (body.toLowerCase().includes("bot")) {
      await sock.sendMessage(from, {text: "Ada apa memanggil tuan muda? Butuh bantuan kah?"}, {quoted: msg})
    }

    // ====== Handler Otomatis Lain ======
    await handleAuto(sock, msg, from, OWNER_JID, TARGET_JID);
  });
}

// ====== Handle Exit Process ======
process.on("SIGINT", () => {
  logger.info("Shutting down...");
  process.exit(0);
});

// ====== Jalankan Bot ======
connect().catch(logger.error);