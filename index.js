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
  { identity: process.env.U_MAIL_12, secret: process.env.U_PASS_12 }
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// =========================================================================
// 🔥 3. استخراج Room ID ودوال التعامل مع المكتبة بشكل آمن
// =========================================================================
function extractRoomId(text = "") {
  if (!text) return null;
  const cleaned = text.replace(/[\u200B-\u200F\uFEFF]/g, '');
  // البحث عن أرقام الروم سواء مسبوقة بـ ID أو بين أقواس أو أرقام مجردة (5 أرقام فأكثر)
  const match = cleaned.match(/ID\s*(\d{5,})|\((\d{5,})\)|(\d{5,})/i);
  const id = match?.[1] || match?.[2] || match?.[3];
  return id ? parseInt(id, 10) : null;
}

// دالة الانضمام الآمنة
async function joinGroupSafe(service, roomId) {
  if (typeof service.groups?.join === 'function') {
    return await service.groups.join(roomId);
  } else if (typeof service.group?.join === 'function') {
    return await service.group.join(roomId);
  } else if (typeof service.joinGroup === 'function') {
    return await service.joinGroup(roomId);
  }
}

// دالة الإرسال الآمنة
async function sendMessageSafe(service, roomId, text) {
  if (typeof service.messaging?.sendGroupMessage === 'function') {
    return await service.messaging.sendGroupMessage(roomId, text);
  } else if (typeof service.messaging?.sendChannelMessage === 'function') {
    return await service.messaging.sendChannelMessage(roomId, text);
  } else if (typeof service.messaging?.sendMessage === 'function') {
    return await service.messaging.sendMessage(roomId, text);
  } else if (typeof service.sendGroupMessage === 'function') {
    return await service.sendGroupMessage(roomId, text);
  } else {
    throw new Error('لم يتم العثور على دالة إرسال متوافقة في المكتبة');
  }
}

// =========================================================================
// 🤖 4. تشغيل الحسابات الـ 14 بشكل مستقل
// =========================================================================
accounts.forEach((acc, index) => {  
  const service = new WOLF();

  // 📦 طابور + منع تكرار لكل حساب
  let queue = [];
  let queueSet = new Set();
  let isProcessing = false;

  // ⏱️ نظام الراحة والدورة الزمنية
  let isResting = false;

  const WORK_TIME = 54 * 60 * 1000; // 54 دقيقة عمل
  const REST_TIME = 6 * 60 * 1000;   // 6 دقائق راحة
  const DELAY = 3000;                // تأخير 3 ثوان بين كل إرسال

  // =====================
  // 📥 إضافة للروم مع إعطاء الأولوية للجديد
  // =====================
  function addToQueue(roomId) {
    if (!roomId) return;
    if (queueSet.has(roomId)) return; // منع التكرار

    queueSet.add(roomId);
    queue.unshift(roomId); // إدخال الروم في أول الطابور
  }

  // =====================
  // 🔁 تنفيذ عناصر الطابور
  // =====================
  async function processQueue() {
    if (isProcessing) return;
    isProcessing = true;

    while (queue.length > 0) {
      if (isResting) break;

      const roomId = queue.shift();
      queueSet.delete(roomId);

      try {
        // 1. محاولة الانضمام للروم
        await joinGroupSafe(service, roomId).catch(() => {});
        
        // مهلة بسيطة لتأكيد الانضمام لدى السيرفر
        await sleep(500);

        // 2. إرسال أمر السرقة
        await sendMessageSafe(service, roomId, "!اسرق 5");
        console.log(`🚀 [${index + 1}] تم الإرسال بنجاح إلى الروم: ${roomId}`);

      } catch (err) {
        console.log(`❌ [${index + 1}] فشل الإرسال للروم (${roomId}):`, err.message || err);
      }

      await sleep(DELAY);
    }

    isProcessing = false;
  }

  // =====================
  // 📩 استقبال وتحليل الرسائل
  // =====================
  service.on('message', async (message) => {
    // استقبال رسائل الخاص فقط
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

    console.log(`📥 [${index + 1}] استلم الروم: ${roomId}`);

    addToQueue(roomId);

    if (!isResting) {
      processQueue();
    }
  });

  // =====================
  // ⏱️ إدارة دورة 54 / 6
  // =====================
  async function cycle() {
    while (true) {
      console.log(`🟢 [${index + 1}] بدأت دورة العمل (54 دقيقة)`);
      isResting = false;

      processQueue();

      await sleep(WORK_TIME);

      console.log(`🛑 [${index + 1}] بدأت فترة الراحة (6 دقائق)`);
      isResting = true;

      await sleep(REST_TIME);
    }
  }

  service.on('ready', () => {
    console.log(`✅ الحساب [${index + 1}] جاهز ومتصل`);
    cycle();
  });

  // تسجيل الدخول
  service.login(acc.identity, acc.secret);
});
