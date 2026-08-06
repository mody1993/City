import 'dotenv/config';

process.env.SUPPRESS_NO_CONFIG_WARNING = 'true';

// =========================================================================
// 🧹 1. تنظيف وفلترة سجلات الكونسول (Console Logs Cleaner)
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
// 📦 2. المكتبات والإعدادات
// =========================================================================
import wolfjs from 'wolf.js';
const { WOLF } = wolfjs.default || wolfjs;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const BONUS_DELAY = 11000;                  // 11 ثانية فاصل بين الصيد
const WORK_TIME = 54 * 60 * 1000;           // 54 دقيقة عمل
const REST_TIME = 6 * 60 * 1000;            // 6 دقائق راحة

// بيانات الحسابات الـ 12
const ACCOUNTS = [
  { email: process.env.U_MAIL_1, password: process.env.U_PASS_1, name: 'King', index: 1 },
  { email: process.env.U_MAIL_2, password: process.env.U_PASS_2, name: 'KSA', index: 2 },
  { email: process.env.U_MAIL_3, password: process.env.U_PASS_3, name: 'MKH', index: 3 },
  { email: process.env.U_MAIL_4, password: process.env.U_PASS_4, name: 'SAA', index: 4 },
  { email: process.env.U_MAIL_5, password: process.env.U_PASS_5, name: 'JDH', index: 5 },
  { email: process.env.U_MAIL_6, password: process.env.U_PASS_6, name: 'MLK', index: 6 },
  { email: process.env.U_MAIL_7, password: process.env.U_PASS_7, name: 'CRN', index: 7 },
  { email: process.env.U_MAIL_8, password: process.env.U_PASS_8, name: 'REX', index: 8 },
  { email: process.env.U_MAIL_9, password: process.env.U_PASS_9, name: 'LRD', index: 9 },
  { email: process.env.U_MAIL_10, password: process.env.U_PASS_10, name: 'ROY', index: 10 },
  { email: process.env.U_MAIL_11, password: process.env.U_PASS_11, name: 'EMP', index: 11 },
  { email: process.env.U_MAIL_12, password: process.env.U_PASS_12, name: 'NOR', index: 12 }
];

// تخصيص الحسابات لكل بوت
const BONUS_ACCOUNTS_STEAL  = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const BONUS_ACCOUNTS_HERO   = [];
const BONUS_ACCOUNTS_HUNTER = [];
const BONUS_ACCOUNTS_HUNT   = [];

const BOT_TRIGGERS = [
  { botId: 39369782, command: "!اسرق 5", accounts: BONUS_ACCOUNTS_STEAL },
  { botId: 45578849, command: "!بطل 5",  accounts: BONUS_ACCOUNTS_HERO },
  { botId: 76305584, command: "!صياد 3", accounts: BONUS_ACCOUNTS_HUNTER },
  { botId: 32060007, command: "!صيد 3",  accounts: BONUS_ACCOUNTS_HUNT }
];

function cleanText(text) {
  return String(text || '').replace(/[\u200B-\u200F\uFEFF\u2060]/g, '').trim();
}

function extractRoomId(text = "") {
  const cleaned = cleanText(text).replace(/\s+/g, ' ');
  let match = cleaned.match(/\(ID\s*(\d+)\)/i);
  if (!match) match = cleaned.match(/\((\d+)\)/);
  if (!match) match = cleaned.match(/\b(\d{3,})\b/);
  return match ? Number(match[1]) : null;
}

function isAccountInTrigger(trigger, config) {
  if (!trigger || !trigger.accounts) return false;
  return trigger.accounts.includes(config.index);
}

// =========================================================================
// 🤖 3. إنشاء كائن البوت لكل حساب
// =========================================================================
function createBot(config) {
  const client = new WOLF();
  let isAccountTerminated = false;

  let bonusQueue = [];
  let bonusQueueSet = new Set();
  let isBonusProcessing = false;
  let isBonusResting = false;

  function addToBonusQueue(roomId, command) {
    if (!roomId || !command) return;
    const itemKey = `${roomId}:${command}`;
    if (bonusQueueSet.has(itemKey)) return;

    bonusQueueSet.add(itemKey);
    bonusQueue.push({ roomId, command, key: itemKey });
  }

  async function joinRoomSafe(roomId) {
    if (client.groups && typeof client.groups.join === 'function') {
      await client.groups.join(roomId).catch(() => {});
    } else if (client.group && typeof client.group.joinById === 'function') {
      await client.group.joinById(roomId).catch(() => {});
    } else if (client.group && typeof client.group.join === 'function') {
      await client.group.join(roomId).catch(() => {});
    } else if (client.channel && typeof client.channel.joinById === 'function') {
      await client.channel.joinById(roomId).catch(() => {});
    } else if (typeof client.joinGroup === 'function') {
      await client.joinGroup(roomId).catch(() => {});
    }
  }

  async function processBonusQueue() {
    if (isBonusProcessing || bonusQueue.length === 0 || isBonusResting) return;
    isBonusProcessing = true;

    while (bonusQueue.length > 0 && !isBonusResting) {
      const item = bonusQueue.shift();
      bonusQueueSet.delete(item.key);

      console.log(`⏳ [${config.name}] انتظار مهلة الصيد (${BONUS_DELAY / 1000}ث)... الروم: ${item.roomId}`);
      await sleep(BONUS_DELAY);

      if (isBonusResting) {
        bonusQueueSet.add(item.key);
        bonusQueue.unshift(item);
        break;
      }

      try {
        await joinRoomSafe(item.roomId);
        await client.messaging.sendGroupMessage(item.roomId, item.command);
        console.log(`🚀 [${new Date().toLocaleTimeString('ar-SA')}] [${config.name}] تم الصيد في [${item.roomId}] بأمر: ${item.command}`);
      } catch (err) {
        console.error(`❌ [${config.name}] فشل الصيد في الروم ${item.roomId}: ${err.message}`);
      }
    }

    isBonusProcessing = false;
  }

  async function startBonusCycle() {
    while (!isAccountTerminated) {
      console.log(`🟢 [${config.name}] بدأت دورة الـ 54 دقيقة عمل للصيد والمعززات.`);
      isBonusResting = false;

      processBonusQueue();

      await sleep(WORK_TIME);

      console.log(`🛑 [${config.name}] بدأت دورة الـ 6 دقائق راحة للصيد.`);
      isBonusResting = true;

      await sleep(REST_TIME);
    }
  }

  const handleIncomingMessage = async (message) => {
    try {
      if (message.isGroup) return;

      const senderId = Number(
        message.sourceSubscriberId || message.authorId || message.sourceUserId ||
        message.sourceId || message.senderId || message.userId || 0
      );
      const body = (message.body || message.content || message.text || '').toString().trim();

      const trigger = BOT_TRIGGERS.find(t => t.botId === senderId && isAccountInTrigger(t, config));

      if (trigger) {
        const roomId = extractRoomId(body);
        if (roomId) {
          console.log(`📥 [${config.name}] التقاط صيد من البوت (${senderId}) | الغرفة: ${roomId} | الأمر: ${trigger.command}`);
          addToBonusQueue(roomId, trigger.command);

          if (!isBonusResting) {
            processBonusQueue();
          } else {
            console.log(`⏳ [${config.name}] البوت في استراحة. تم حفظ الغرفة ${roomId} في الطابور.`);
          }
        }
      }
    } catch (err) {
      console.error(`❌ [${config.name}] خطأ استقبال: ${err.message}`);
    }
  };

  client.on('message', handleIncomingMessage);
  client.on('privateMessage', handleIncomingMessage);

  client.on('ready', async () => {
    console.log(`✅ [${config.name}] متصل بنجاح.`);
    startBonusCycle();
  });

  return {
    start: async () => {
      try {
        await client.login(config.email, config.password);
      } catch (err) {
        console.error(`❌ [${config.name}] فشل تسجيل الدخول: ${err.message}`);
      }
    }
  };
}

// =========================================================================
// 🚀 4. تشغيل جميع الحسابات بالتدرج
// =========================================================================
const startAllAccounts = async () => {
  console.log("🚀 جاري تهيئة وتشغيل حسابات الصيد والمعززات...");
  for (const acc of ACCOUNTS) {
    if (acc.email && acc.password) {
      const bot = createBot(acc);
      bot.start();
      await sleep(3500);
    }
  }
};

startAllAccounts();
