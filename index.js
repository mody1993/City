import 'dotenv/config';

process.env.SUPPRESS_NO_CONFIG_WARNING = 'true';

// =========================================================================
// 🧹 1. نظام تنظيف وفلترة سجلات الكونسول (Console Cleaner)
// =========================================================================
const originalLog = console.log.bind(console);
const originalWarn = console.warn.bind(console);
const originalError = console.error.bind(console);

const HIDE_LOGS = [
  '[DEBUG]', '[WARN]', 'DEBUG', 'WARN', 'CleanUp', 'Synchronise',
  'GroupAudioCountUpdated', 'MessageUpdate', 'Websocket', 'TipAdd',
  'Message from self ignoring', 'Store Reset', 'apiKey will be required',
  'APIKey will be required', 'No configurations found', 'SUPPRESS_NO_CONFIG_WARNING',
  'Logged in [profile:', 'channel that was not cached', 'privateMessageSubscription',
  'channelMessageSubscription', 'tipChannelSubscription'
];

function shouldHide(text) {
  return HIDE_LOGS.some(word => text.includes(word));
}

console.log = (...args) => {
  const text = args.map(String).join(' ');
  if (shouldHide(text)) return;
  originalLog(...args);
};
console.info = console.log;
console.debug = console.log;

console.warn = (...args) => {
  const text = args.map(String).join(' ');
  if (shouldHide(text)) return;
  originalWarn(...args);
};

console.error = (...args) => {
  const text = args.map(String).join(' ');
  if (shouldHide(text)) return;
  originalError(...args);
};

const originalStdoutWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = (chunk, encoding, callback) => {
  const text = chunk?.toString?.() || '';
  if (shouldHide(text)) return true;
  return originalStdoutWrite(chunk, encoding, callback);
};

const originalStderrWrite = process.stderr.write.bind(process.stderr);
process.stderr.write = (chunk, encoding, callback) => {
  const text = chunk?.toString?.() || '';
  if (shouldHide(text)) return true;
  return originalStderrWrite(chunk, encoding, callback);
};

// =========================================================================
// 📦 2. المكتبات والإعدادات الرئيسية
// =========================================================================
import wolfjs from 'wolf.js';
const { WOLF } = wolfjs.default || wolfjs;

const accounts = [
  { identity: process.env.U_MAIL_1, secret: process.env.U_PASS_1 },
  { identity: process.env.U_MAIL_2, secret: process.env.U_PASS_2 },
  { identity: process.env.U_MAIL_3, secret: process.env.U_PASS_3 },
  { identity: process.env.U_MAIL_4, secret: process.env.U_PASS_4 },
  { identity: process.env.U_MAIL_5, secret: process.env.U_PASS_5 },
  { identity: process.env.U_MAIL_6, secret: process.env.U_PASS_6 },
  { identity: process.env.U_MAIL_7, secret: process.env.U_PASS_7 },
  { identity: process.env.U_MAIL_8, secret: process.env.U_PASS_8 },
  { identity: process.env.U_MAIL_9, secret: process.env.U_PASS_9 },
  { identity: process.env.U_MAIL_10, secret: process.env.U_PASS_10 },
  { identity: process.env.U_MAIL_11, secret: process.env.U_PASS_11 },
  { identity: process.env.U_MAIL_12, secret: process.env.U_PASS_12 },
  { identity: process.env.U_MAIL_13, secret: process.env.U_PASS_13 },
  { identity: process.env.U_MAIL_14, secret: process.env.U_PASS_14 }
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// =========================================================================
// 🔥 3. استخراج Room ID
// =========================================================================
function extractRoomId(text = "") {
  const cleaned = text.replace(/[\u200B-\u200F\uFEFF]/g, '');
  const match = cleaned.match(/ID\s*(\d{5,})|\((\d{5,})\)/);
  const id = match?.[1] || match?.[2];
  return id ? parseInt(id, 10) : null;
}

// =========================================================================
// 🤖 4. تشغيل الحسابات بشكل مستقل
// =========================================================================
accounts.forEach((acc, index) => {  
  const service = new WOLF();

  // 📦 طابور + منع تكرار لكل حساب
  let queue = [];
  let queueSet = new Set(); // لمنع التكرار
  let isProcessing = false;

  // ⏱️ نظام الراحة
  let isResting = false;

  const WORK_TIME = 54 * 60 * 1000;
  const REST_TIME = 6 * 60 * 1000;
  const DELAY = 12000;

  // =====================
  // 📥 إضافة للروم (بدون تكرار + أولوية جديدة)
  // =====================
  function addToQueue(roomId) {
    if (!roomId) return;

    // 🔴 منع التكرار
    if (queueSet.has(roomId)) return;

    queueSet.add(roomId);

    // 🔥 أولوية للرومات الجديدة (تدخل أول الطابور)
    queue.unshift(roomId);
  }

  // =====================
  // 🔁 تنفيذ الطابور
  // =====================
  async function processQueue() {
    if (isProcessing) return;
    isProcessing = true;

    while (queue.length > 0) {

      if (isResting) break;

      const roomId = queue.shift();
      queueSet.delete(roomId); // إزالة من قائمة التكرار

      try {
        if (service.groups?.join) {
          await service.groups.join(roomId);
        } else if (service.group?.join) {
          await service.group.join(roomId);
        } else if (service.joinGroup) {
          await service.joinGroup(roomId);
        }

        await service.messaging.sendGroupMessage(roomId, "!اسرق 5");

        console.log(`🚀 [${index + 1}] نفذ على ${roomId}`);

      } catch (err) {
        console.log(`❌ [${index + 1}] خطأ:`, err.message);
      }

      await sleep(DELAY);
    }

    isProcessing = false;
  }

  // =====================
  // 📩 استقبال الرسائل
  // =====================
  service.on('message', async (message) => {
    if (message.isGroup) return;

    const content =
      message.body ||
      message.content ||
      message.text ||
      message.message ||
      "";

    const isBonus =
      content.includes("Bonus-Heist") ||
      content.includes("معزز") ||
      content.includes("Heist") ||
      content.includes("معزز إضافي");

    if (!isBonus) return;

    const roomId = extractRoomId(content);
    if (!roomId) return;

    console.log(`📥 [${index + 1}] استلم: ${roomId}`);

    addToQueue(roomId);

    if (!isResting) {
      processQueue();
    }
  });

  // =====================
  // ⏱️ دورة 54 / 6
  // =====================
  async function cycle() {
    while (true) {

      console.log(`🟢 [${index + 1}] تشغيل 54 دقيقة`);
      isResting = false;

      processQueue();

      await sleep(WORK_TIME);

      console.log(`🛑 [${index + 1}] راحة 6 دقائق`);
      isResting = true;

      await sleep(REST_TIME);
    }
  }

  service.on('ready', () => {
    console.log(`✅ الحساب ${index + 1} جاهز`);
    cycle();
  });

  service.login(acc.identity, acc.secret);
});
