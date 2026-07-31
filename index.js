import 'dotenv/config';

process.env.SUPPRESS_NO_CONFIG_WARNING = 'true';

// =========================================================================
// 🧹 1. تنظيف وفلترة سجلات الكونسول (Console Logs)
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

    if (shouldHide(text)) {
        return true;
    }

    return originalStdoutWrite(chunk, encoding, callback);
};

const originalStderrWrite = process.stderr.write.bind(process.stderr);

process.stderr.write = (chunk, encoding, callback) => {
    const text = chunk?.toString?.() || '';

    if (shouldHide(text)) {
        return true;
    }

    return originalStderrWrite(chunk, encoding, callback);
};

// =========================================================================
// 📦 2. استيراد المكتبة والأدوات
// =========================================================================
const wolfjs = await import('wolf.js');
const { WOLF } = wolfjs.default || wolfjs;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// =========================================================================
// ⚙️ 3. الإعدادات وتخصيص الحسابات
// =========================================================================
const TRACKED_BOT_ID = 80277459;
const RACE_ROOM_ID = 569;

const AIRPLANE_ROOM_ID = 569;
const GRAND_ROOM_ID = 569;
const XO_ROOM_ID = 18187126;
const XO_BOT_ID = 82727814;
const XO_START_COMMAND = '!xo private ai 3';

const RACE_END_TIMEOUT_MS = 120 * 1000;    // 2 دقيقة لمراقبة انتهاء السباق
const ENERGY_FALLBACK_MS = 11 * 60 * 1000; // 11 دقيقة كحد أقصى لاسترجاع الطاقة
const BONUS_DELAY = 12000;                  // 12 ثانية بين إرسال المعززات
const WORK_TIME = 54 * 60 * 1000;           // 54 دقيقة عمل للمعززات
const REST_TIME = 6 * 60 * 1000;            // 6 دقائق راحة للمعززات

const ACCOUNTS = [
  { email: process.env.U_MAIL_1, password: process.env.U_PASS_1, name: 'King', id: 38770375, index: 1, sChannel: 569 },
  { email: process.env.U_MAIL_2, password: process.env.U_PASS_2, name: 'KSA', id: 27112980, index: 2, sChannel: 569 },
  { email: process.env.U_MAIL_3, password: process.env.U_PASS_3, name: 'MKH', id: 1780249, index: 3, sChannel: 569 },
  { email: process.env.U_MAIL_4, password: process.env.U_PASS_4, name: 'SAA', id: 2251312, index: 4, sChannel: 569 },
  { email: process.env.U_MAIL_5, password: process.env.U_PASS_5, name: 'JDH', id: 39043364, index: 5, sChannel: 569 },
  { email: process.env.U_MAIL_6, password: process.env.U_PASS_6, name: 'MLK', id: 34648535, index: 6, sChannel: 569 },
  { email: process.env.U_MAIL_7, password: process.env.U_PASS_7, name: 'CRN', id: 79996355, index: 7, sChannel: 569 },
  { email: process.env.U_MAIL_8, password: process.env.U_PASS_8, name: 'REX', id: 34435550, index: 8, sChannel: 569 },
  { email: process.env.U_MAIL_9, password: process.env.U_PASS_9, name: 'LRD', id: 15859439, index: 9, sChannel: 569 },
  { email: process.env.U_MAIL_10, password: process.env.U_PASS_10, name: 'ROY', id: 32198971, index: 10, sChannel: 569 },
  { email: process.env.U_MAIL_11, password: process.env.U_PASS_11, name: 'EMP', id: 39515341, index: 11, sChannel: 569 },
  { email: process.env.U_MAIL_12, password: process.env.U_PASS_12, name: 'NOR', id: 2374823, index: 12, sChannel: 569 }
];

// 🎯 تخصيص تفاعلات الألعاب (أرقام الحسابات index)
const ACTIVE_RACE_ACCOUNTS      = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const AIRPLANE_ACCOUNTS         = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const XO_ACCOUNTS                = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// 🎮 تخصيص حسابات قراند
const GRAND_COLLECT_ACCOUNTS       = [1, 2, 3, 4];
const GRAND_STEAL_ATTACK_COUNTS    = [1, 2, 3, 4];
const GRAND_LOTTERY_ACCOUNTS       = [1, 2, 3, 4];

// 🎁 تحديد الحسابات والأوامر المخصصة للمعززات
const BONUS_ACCOUNTS_STEAL  = [];
const BONUS_ACCOUNTS_HERO   = [];
const BONUS_ACCOUNTS_HUNTER = [];
const BONUS_ACCOUNTS_HUNT   = [];

const BOT_TRIGGERS = [
  { command: "!اسرق 5", accounts: 39369782 },
  { command: "!بطل 5",  accounts: 45578849 },
  { command: "!صياد 3", accounts: 76305584 },
  { command: "!صيد 3",  accounts: 32060007 }
];

function isAccountInTrigger(trigger, config) {
  if (!trigger || !trigger.accounts) return false;
  if (Array.isArray(trigger.accounts)) {
    return trigger.accounts.includes(config.index) || trigger.accounts.includes(config.id);
  }
  return trigger.accounts === config.index || trigger.accounts === config.id;
}

function isAccountActive(index) {
  return ACTIVE_RACE_ACCOUNTS.includes(Number(index));
}

function getFirstActiveIndex() {
  const sorted = [...ACTIVE_RACE_ACCOUNTS].sort((a, b) => a - b);
  return sorted.length > 0 ? sorted[0] : null;
}

function getNextActiveIndex(currentIndex) {
  const sorted = [...ACTIVE_RACE_ACCOUNTS].sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const next = sorted.find(index => index > currentIndex);
  return next ?? sorted[0];
}

// =========================================================================
// 🏢 4. نظام ومدير دورات قراند المركزي
// =========================================================================
const grandStealCycleCounter = new Map();
const GRAND_ACCOUNT_GAP_MS = 15 * 1000;
const GRAND_COMMAND_GAP_MS = 10 * 1000;
const GRAND_COLLECT_INTERVAL_MS = 70 * 1000;
const GRAND_STEAL_ATTACK_INTERVAL_MS = 130 * 1000;
const GRAND_LOTTERY_INTERVAL_MS = 65 * 1000;
const GRAND_LOTTERY_NUMBER_DELAY_MS = 10 * 1000;

const GRAND_BOTS = new Map();
let grandSchedulersStarted = false;

function registerGrandBot(index, name, send, isTerminated) {
  const accountIndex = Number(index);
  const oldBot = GRAND_BOTS.get(accountIndex);

  GRAND_BOTS.set(accountIndex, {
    index: accountIndex,
    name,
    send,
    isTerminated,
    grandQueue: oldBot?.grandQueue || Promise.resolve()
  });
}

function getGrandBots(accountIndexes) {
  return [...new Set(accountIndexes.map(Number))]
    .sort((a, b) => a - b)
    .map(index => GRAND_BOTS.get(index))
    .filter(bot => bot && !bot.isTerminated());
}

function enqueueGrandTask(bot, taskName, task) {
  const run = async () => {
    if (bot.isTerminated()) return false;
    try {
      return await task();
    } catch (error) {
      console.error(`[قراند] ❌ [${bot.name}] خطأ في ${taskName}:`, error?.message || error);
      return false;
    }
  };
  bot.grandQueue = bot.grandQueue.then(run, run);
  return bot.grandQueue;
}

async function runGrandAccountsInOrder(accountIndexes, taskName, taskFactory) {
  const bots = getGrandBots(accountIndexes);
  for (let position = 0; position < bots.length; position++) {
    const bot = bots[position];
    await enqueueGrandTask(bot, taskName, () => taskFactory(bot));
    if (position < bots.length - 1) {
      await sleep(GRAND_ACCOUNT_GAP_MS);
    }
  }
}

async function grandCollectScheduler() {
  while (true) {
    try {
      await runGrandAccountsInOrder(
        GRAND_COLLECT_ACCOUNTS,
        'جمع',
        bot => bot.send(GRAND_ROOM_ID, '!قراند جمع 5')
      );
    } catch (error) {
      console.error('[قراند جمع] ❌ خطأ في الدورة المركزية:', error?.message || error);
    }
    await sleep(GRAND_COLLECT_INTERVAL_MS);
  }
}

async function grandStealAttackScheduler() {
  while (true) {
    try {
      await runGrandAccountsInOrder(
        GRAND_STEAL_ATTACK_COUNTS,
        'سرقة وهجوم',
        async bot => {
          const stealSent = await bot.send(GRAND_ROOM_ID, '!قراند سرقة 5');
          await sleep(GRAND_COMMAND_GAP_MS);

          if (bot.isTerminated()) return false;

          const attackSent = await bot.send(GRAND_ROOM_ID, '!قراند هجوم 5');
          if (attackSent) {
            const cycle = (grandStealCycleCounter.get(bot.index) || 0) + 1;
            grandStealCycleCounter.set(bot.index, cycle);

            if (cycle >= 3) {
              grandStealCycleCounter.set(bot.index, 0);
              await sleep(10000);
              if (!bot.isTerminated()) {
                await bot.send(GRAND_ROOM_ID, '!قراند سلاح تجهيز 30');
              }
            }
          }
          return Boolean(stealSent && attackSent);
        }
      );
    } catch (error) {
      console.error('[قراند سرقة وهجوم] ❌ خطأ في الدورة المركزية:', error?.message || error);
    }
    await sleep(GRAND_STEAL_ATTACK_INTERVAL_MS);
  }
}

async function grandLotteryScheduler() {
  while (true) {
    try {
      await runGrandAccountsInOrder(
        GRAND_LOTTERY_ACCOUNTS,
        'اليانصيب',
        async bot => {
          const lotterySent = await bot.send(GRAND_ROOM_ID, '!قراند يانصيب اسطوري');
          await sleep(GRAND_LOTTERY_NUMBER_DELAY_MS);

          if (bot.isTerminated()) return false;

          const numberSent = await bot.send(GRAND_ROOM_ID, '5');
          return Boolean(lotterySent && numberSent);
        }
      );
    } catch (error) {
      console.error('[قراند يانصيب] ❌ خطأ في الدورة المركزية:', error?.message || error);
    }
    await sleep(GRAND_LOTTERY_INTERVAL_MS);
  }
}

function startGrandSchedulersOnce() {
  if (grandSchedulersStarted) return;
  grandSchedulersStarted = true;

  setTimeout(() => {
    grandCollectScheduler().catch(err => console.error('[قراند جمع] توقف:', err?.message));
    grandStealAttackScheduler().catch(err => console.error('[قراند سرقة وهجوم] توقف:', err?.message));
    grandLotteryScheduler().catch(err => console.error('[قراند يانصيب] توقف:', err?.message));
  }, 35000);
}

// =========================================================================
// 🛠️ 5. أدوات المعالجة واستخراج البيانات
// =========================================================================
function getSenderId(message) {
  return Number(
    message.sourceSubscriberId || message.sourceUserId ||
    message.sourceId || message.senderId || message.userId || 0
  );
}

function getMessageText(message) {
  return (message.body || message.content || message.text || message.message || '').toString().trim();
}

function getRoomId(message) {
  return Number(
    message.targetChannelId || message.targetGroupId || message.groupId ||
    message.channelId || message.recipientGroupId || message.group?.id || message.channel?.id || 0
  );
}

function cleanText(text) {
  return String(text || '').replace(/[\u200B-\u200F\uFEFF\u2060]/g, '').trim();
}

function isEnergyReadyMessage(text) {
  const body = cleanText(text).toLowerCase();
  return (
    body.includes('your animal is back to full energy') ||
    body.includes('animal is back to full energy') ||
    body.includes('عاد حيوانك لطاقته الكاملة') ||
    body.includes('عاد حيوانك إلى طاقته الكاملة') ||
    body.includes('طاقته الكاملة') ||
    body.includes('full energy')
  );
}

function extractLastIdFromRaceMessage(body) {
  const cleanBody = cleanText(body);
  const ids = [...cleanBody.matchAll(/\((\d+)\)/g)];
  if (ids.length === 0) return null;
  return ids[ids.length - 1][1];
}

function extractRoomIdFromBonus(text = "") {
  const cleaned = cleanText(text).replace(/\s+/g, ' ');
  let match = cleaned.match(/\(ID\s*(\d+)\)/i);
  if (!match) match = cleaned.match(/\((\d+)\)/);
  if (!match) match = cleaned.match(/\b(\d{3,})\b/);
  return match ? Number(match[1]) : null;
}

function extractSenderIdFromBonus(text = "") {
  const cleaned = cleanText(text).replace(/\s+/g, ' ');
  const matches = [...cleaned.matchAll(/\(ID\s*(\d+)\)|\((\d+)\)/gi)];
  if (matches.length < 2) return null;
  const last = matches[matches.length - 1];
  return Number(last[1] || last[2]);
}

function isBonusMessage(content = "") {
  return (
    /Bonus-/i.test(content) ||
    content.includes("معزز") ||
    content.includes("معزز إضافي")
  );
}

// =========================================================================
// 🛡️ 6. طابور الإرسال الآمن (SafeQueue)
// =========================================================================
class SafeQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  async add(client, channelId, command, accountName = 'UNKNOWN') {
    return new Promise((resolve) => {
      this.queue.push({ client, channelId, command, accountName, resolve });
      this.process();
    });
  }

  async process() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    const { client, channelId, command, accountName, resolve } = this.queue.shift();
    let success = false;

    try {
      if (typeof client.messaging?.sendChannelMessage === 'function') {
        await client.messaging.sendChannelMessage(Number(channelId), command);
      } else if (typeof client.messaging?.sendGroupMessage === 'function') {
        await client.messaging.sendGroupMessage(Number(channelId), command);
      }
      console.log(`📤 [${accountName}] ${command}`);
      success = true;
      await sleep(2000);
    } catch (err) {
      console.error(`❌ [${accountName}] خطأ إرسال: ${err.message}`);
    }

    this.isProcessing = false;
    resolve(success);
    this.process();
  }
}

const globalQueue = new SafeQueue();

// =========================================================================
// 🚦 7. مدير سباق الحصان (RaceManager)
// =========================================================================
class RaceManager {
  constructor() {
    this.currentTurnIndex = 1;
    this.clientsMap = new Map();
    this.accountStates = new Map();
    this.isRaceRunning = false;
    this.activeRaceIndex = null;
    this.lastRaceId = null;
    this.lastRaceTime = 0;
    this.hasStarted = false;
    this.raceWatchdog = null;
    this.energyWaitTimer = null;
    this.energyWaitIndex = null;
  }

  registerClient(index, config, client, triggerFunc) {
    this.clientsMap.set(index, { config, client, triggerFunc });

    if (!this.accountStates.has(index)) {
      this.accountStates.set(index, {
        energyReady: true,
        inRace: false,
        lastStartedAt: 0,
        lastFinishedAt: 0
      });
    }

    if (this.hasStarted && !this.isRaceRunning && this.currentTurnIndex === index) {
      this.tryStartCurrentTurn();
    }
  }

  getState(index) {
    if (!this.accountStates.has(index)) {
      this.accountStates.set(index, {
        energyReady: true,
        inRace: false,
        lastStartedAt: 0,
        lastFinishedAt: 0
      });
    }
    return this.accountStates.get(index);
  }

  start() {
    if (this.hasStarted) return;
    const firstActiveIndex = getFirstActiveIndex();
    if (firstActiveIndex === null) return;
    this.hasStarted = true;
    this.currentTurnIndex = firstActiveIndex;
    console.log(`🚀 بدء نظام سباق الحصان من الحساب رقم ${firstActiveIndex}.`);
    this.tryStartCurrentTurn();
  }

  clearRaceWatchdog() {
    if (this.raceWatchdog) {
      clearTimeout(this.raceWatchdog);
      this.raceWatchdog = null;
    }
  }

  startRaceWatchdog(index) {
    this.clearRaceWatchdog();
    this.raceWatchdog = setTimeout(() => {
      if (this.isRaceRunning && this.activeRaceIndex === index) {
        const bot = this.clientsMap.get(index);
        const state = this.getState(index);

        console.log(`⚠️ لم تصل رسالة انتهاء السباق لـ ${bot?.config?.name || index}، الانتقال للحساب التالي.`);

        state.inRace = false;
        state.energyReady = false;
        state.lastFinishedAt = Date.now();

        this.isRaceRunning = false;
        this.activeRaceIndex = null;

        const nextActiveIndex = getNextActiveIndex(index);
        if (nextActiveIndex === null) return;

        this.currentTurnIndex = nextActiveIndex;
        this.tryStartCurrentTurn();
      }
    }, RACE_END_TIMEOUT_MS);
  }

  clearEnergyWaitTimer() {
    if (this.energyWaitTimer) {
      clearTimeout(this.energyWaitTimer);
      this.energyWaitTimer = null;
    }
    this.energyWaitIndex = null;
  }

  scheduleEnergyFallback(index, remainingMs) {
    this.clearEnergyWaitTimer();
    this.energyWaitIndex = index;

    this.energyWaitTimer = setTimeout(() => {
      if (this.isRaceRunning || this.currentTurnIndex !== index || this.energyWaitIndex !== index) return;

      const bot = this.clientsMap.get(index);
      const state = this.getState(index);

      state.energyReady = true;
      this.energyWaitTimer = null;
      this.energyWaitIndex = null;

      console.log(`✅ [طاقة احتياطية] تم اعتبار ${bot?.config?.name || index} جاهزاً.`);
      this.tryStartCurrentTurn();
    }, Math.max(0, remainingMs));
  }

  async tryStartCurrentTurn() {
    if (this.isRaceRunning) return;

    const turnIndex = this.currentTurnIndex;
    const currentBot = this.clientsMap.get(turnIndex);

    if (!currentBot) {
      const nextActive = getNextActiveIndex(turnIndex);
      if (nextActive === null) return;
      this.currentTurnIndex = nextActive;
      return this.tryStartCurrentTurn();
    }

    const state = this.getState(turnIndex);

    if (!state.energyReady) {
      if (state.lastFinishedAt > 0) {
        const elapsed = Date.now() - state.lastFinishedAt;
        const remaining = ENERGY_FALLBACK_MS - elapsed;

        if (remaining <= 0) {
          state.energyReady = true;
        } else {
          this.scheduleEnergyFallback(turnIndex, remaining);
          return;
        }
      } else {
        return;
      }
    }

    if (state.inRace) return;

    this.clearEnergyWaitTimer();
    state.energyReady = false;
    state.inRace = true;
    state.lastStartedAt = Date.now();

    this.isRaceRunning = true;
    this.activeRaceIndex = turnIndex;

    console.log(`🎯 [${currentBot.config.name}] حان دوري في السباق...`);
    const sent = await currentBot.triggerFunc();

    if (!sent) {
      state.inRace = false;
      state.energyReady = true;
      this.isRaceRunning = false;
      this.activeRaceIndex = null;
      return;
    }

    this.startRaceWatchdog(turnIndex);
  }

  handleEnergyReady(accountIndex) {
    const bot = this.clientsMap.get(accountIndex);
    const state = this.getState(accountIndex);

    if (state.energyReady) return;
    state.energyReady = true;

    console.log(`🔋 [${bot?.config?.name || accountIndex}] استعاد الطاقة وصار جاهزاً.`);

    if (!this.isRaceRunning && accountIndex === this.currentTurnIndex) {
      this.clearEnergyWaitTimer();
      this.tryStartCurrentTurn();
    }
  }

  async handleRaceEndMessage(body) {
    body = cleanText(body);
    if (!body.includes('انتهى السباق')) return;

    const extractedId = extractLastIdFromRaceMessage(body);
    if (!extractedId) return;

    const now = Date.now();
    if (this.lastRaceId === extractedId && now - this.lastRaceTime < 5000) return;

    const finishedBot = [...this.clientsMap.values()].find(
      bot => String(bot.config.id) === String(extractedId)
    );

    if (!finishedBot) return;

    const finishedIndex = finishedBot.config.index;
    if (this.activeRaceIndex !== finishedIndex) return;

    this.lastRaceId = extractedId;
    this.lastRaceTime = now;

    const finishedState = this.getState(finishedIndex);
    finishedState.inRace = false;
    finishedState.energyReady = false;
    finishedState.lastFinishedAt = Date.now();

    console.log(`🏁 [السباق] الحساب ${finishedBot.config.name} أنهى السباق.`);

    this.clearRaceWatchdog();
    this.isRaceRunning = false;
    this.activeRaceIndex = null;

    const nextActiveIndex = getNextActiveIndex(finishedIndex);
    if (nextActiveIndex === null) return;

    this.currentTurnIndex = nextActiveIndex;
    this.tryStartCurrentTurn();
  }
}

const raceManager = new RaceManager();

// =========================================================================
// 🎮 8. محرك لعبة XO
// =========================================================================
const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

function checkWinner(board) {
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (
      board[a] &&
      board[a] === board[b] &&
      board[a] === board[c]
    ) {
      return board[a];
    }
  }

  if (board.every(cell => cell !== null)) {
    return "draw";
  }

  return null;
}

function minimax(board, depth, isMaximizing, mySign, botSign) {
  const result = checkWinner(board);

  if (result === mySign) return 10 - depth;
  if (result === botSign) return depth - 10;
  if (result === "draw") return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;

    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = mySign;
        const score = minimax(board, depth + 1, false, mySign, botSign);
        board[i] = null;
        bestScore = Math.max(bestScore, score);
      }
    }

    return bestScore;
  } else {
    let bestScore = Infinity;

    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = botSign;
        const score = minimax(board, depth + 1, true, mySign, botSign);
        board[i] = null;
        bestScore = Math.min(bestScore, score);
      }
    }

    return bestScore;
  }
}

function getBestXOMove(board, mySign, botSign) {
  let bestScore = -Infinity;
  let bestMove = -1;

  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      board[i] = mySign;

      const score = minimax(
        board,
        0,
        false,
        mySign,
        botSign
      );

      board[i] = null;

      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }

  return bestMove;
}

// =========================================================================
// 🤖 9. إنشاء الحسابات وإدارة المهام (Bot Instance)
// =========================================================================
function createBot(config) {
  const client = new WOLF();
console.log("Messaging methods:", Object.keys(client.messaging));
  
  let isAccountTerminated = false;

  // ----- متغيرات المعززات -----
  let bonusQueue = [];
  let bonusQueueSet = new Set();
  let isBonusProcessing = false;
  let isBonusResting = false;

  function addToBonusQueue(roomId, command) {
    if (!roomId || !command) return;
    const itemKey = `${roomId}:${command}`;
    if (bonusQueueSet.has(itemKey)) return;

    bonusQueueSet.add(itemKey);
    bonusQueue.unshift({ roomId, command, key: itemKey });
  }

  async function processBonusQueue() {
    if (isBonusProcessing) return;
    isBonusProcessing = true;

    while (bonusQueue.length > 0) {
      if (isBonusResting) break;

      const item = bonusQueue.shift();
      bonusQueueSet.delete(item.key);

      try {
        if (typeof client.group?.joinById === 'function') await client.group.joinById(item.roomId);
        else if (typeof client.channel?.joinById === 'function') await client.channel.joinById(item.roomId);
        else if (typeof client.groups?.join === 'function') await client.groups.join(item.roomId);
        else if (typeof client.group?.join === 'function') await client.group.join(item.roomId);

        await client.messaging.sendGroupMessage(item.roomId, item.command);
        console.log(`🚀 [حساب ${config.index} - ${config.name}] دخل ${item.roomId} وأرسل: ${item.command}`);

      } catch (err) {
        console.log(`❌ [حساب ${config.index} - ${config.name}] خطأ معزز: ${err.message}`);
      }

      await sleep(BONUS_DELAY);
    }

    isBonusProcessing = false;
  }

  async function startBonusCycle() {
    while (true) {
      console.log(`🟢 [حساب ${config.index} - ${config.name}] تشغيل 54 دقيقة معززات`);
      isBonusResting = false;

      processBonusQueue();

      await sleep(WORK_TIME);

      console.log(`🛑 [حساب ${config.index} - ${config.name}] راحة 6 دقائق معززات`);
      isBonusResting = true;

      await sleep(REST_TIME);
    }
  }

  // ----- متغيرات XO -----
  let xoBoard = Array(9).fill(null);
  let xoMySign = 'X';
  let xoBotSign = 'O';
  let xoIsGameEnding = false;
  let xoIsSending = false;

 function handleXOIncomingData(message) {

   console.log(`📩 XO من ${config.name}`);

   const text = getMessageText(message).toLowerCase();
   //console.log("TEXT:", text);
   //console.log("ENDING:", xoIsGameEnding);
   //console.log("SENDING:", xoIsSending);
if (text.includes('لقد فزت') || text.includes('فزت!')) {
    console.log("🏆 تم الفوز");
}

if (text.includes('لقد خسرت') || text.includes('خسرت')) {
    console.log("💀 تم الخسارة");
}

if (text.includes('تعادل')) {
    console.log("🤝 تعادل");
}
   
if (
    text.includes('won') ||
    text.includes('lost') ||
    text.includes('tie') ||
    text.includes('draw') ||
    text.includes('game over') ||

    text.includes('لقد فزت') ||
    text.includes('فزت') ||
    text.includes('لقد خسرت') ||
    text.includes('خسرت') ||
    text.includes('تعادل') ||
    text.includes('اعادة') ||
    text.includes('إعادة') ||
    text.includes('تنتهي خلال')
) {
  if (!xoIsGameEnding) {
        xoIsGameEnding = true;
        xoIsSending = false;
        console.log(`🏁 [${config.name}] انتهاء لعبة XO، إعادة البدء بعد 5 ثوانٍ...`);
        xoBoard = Array(9).fill(null);

     setTimeout(async () => {
  console.log("🔥 دخل مؤقت إعادة البداية");

  // افتح استقبال اللعبة الجديدة قبل الإرسال
  xoBoard = Array(9).fill(null);
  xoIsSending = false;
  xoIsGameEnding = false;

  try {
    console.log("🎮 إرسال أمر البداية...");

    const ok = await globalQueue.add(
      client,
      XO_ROOM_ID,
      XO_START_COMMAND,
      config.name
    );

    console.log("RESULT:", ok);
  } catch (e) {
    console.error("XO ERROR:", e);
  }
}, 5000);
      }
      return;
    }

    if (text.includes('your turn! (❌)') || text.includes('turn! (❌)')) { xoMySign = 'X'; xoBotSign = 'O'; }
    else if (text.includes('your turn! (⭕)') || text.includes('turn! (⭕)')) { xoMySign = 'O'; xoBotSign = 'X'; }

    const positions = text.split('xobot-mp-private__content__middle__position');
    if (positions.length > 1) {
      for (let i = 0; i < 9; i++) {
        const block = positions[i + 1] || '';
        if (block.includes('--x') || block.includes('❌')) xoBoard[i] = 'X';
        else if (block.includes('--o') || block.includes('⭕')) xoBoard[i] = 'O';
        else xoBoard[i] = null;
      }
    }

const isMyTurn =
    text.includes('your turn! (❌)') ||
    text.includes('your turn! (⭕)') ||
    text.includes('دورك!');
   if (isMyTurn && !xoIsGameEnding && !xoIsSending) {
      const moveIndex = getBestXOMove(xoBoard, xoMySign, xoBotSign);
      console.log("BOARD:", xoBoard);
console.log("MOVE:", moveIndex);
      
      if (moveIndex !== undefined && moveIndex !== -1) {
        const squareToPlay = (moveIndex + 1).toString();
        xoIsSending = true;
        xoBoard[moveIndex] = xoMySign;

        xoIsSending = true;

setTimeout(async () => {
    try {
        console.log("🎯 سأرسل:", squareToPlay);

        await client.messaging.sendPrivateMessage(
            XO_BOT_ID,
            squareToPlay
        );

        console.log(`✅ [${config.name}] XO لعب الخانة: ${squareToPlay}`);

    } catch (e) {
        console.error(e);

    } finally {
        xoIsSending = false;
    }

}, 2000);
      }
    }
  }

  // ----- دالة إرسال أمر السباق -----
  async function triggerRaceCommand() {
    const subId = config.id || client.currentSubscriber?.id || client.currentUser?.id;
    return await globalQueue.add(
      client,
      config.sChannel,
      `!س جلد خاص ${subId}`,
      config.name
    );
  }

  // ----- دالة إرسال آمنة خاصة بقراند -----
  async function safeSendGrand(roomId, command) {
    try {
      if (typeof client.messaging?.sendChannelMessage === 'function') {
        await client.messaging.sendChannelMessage(Number(roomId), command);
      } else if (typeof client.messaging?.sendGroupMessage === 'function') {
        await client.messaging.sendGroupMessage(Number(roomId), command);
      }
      console.log(`🧢 [${config.name}] ${command}`);
      await sleep(2000);
      return true;
    } catch (err) {
      console.error(`❌ [${config.name}] خطأ إرسال قراند: ${err.message}`);
      return false;
    }
  }

  // ----- دورة الطائرة المحدثة من الكود الثاني -----
  async function startAirplaneLoop() {
    while (!isAccountTerminated) {
      const cycleStartedAt = Date.now();

      try {
        await globalQueue.add(client, AIRPLANE_ROOM_ID, '!ط قصف', config.name);
        if (isAccountTerminated) break;

        if (config.index === 1) {
          await sleep(2000);
          await globalQueue.add(client, AIRPLANE_ROOM_ID, '!ط هدية 20300554 2000', config.name);

          // بعد الهدية بـ7 ثوانٍ: إيداع الخزينة
          await sleep(7000);
          await globalQueue.add(client, AIRPLANE_ROOM_ID, '!ط خزينة إيداع كل', config.name);

          // الهجوم بعد 3 ثوانٍ إضافية (مجموع 10 ثوانٍ من الهدية)
          await sleep(3000);
          await globalQueue.add(client, AIRPLANE_ROOM_ID, '!ط هجوم 20300554', config.name);
        } else {
          await sleep(2000);
          await globalQueue.add(client, AIRPLANE_ROOM_ID, '!ط هدية 38770375 2000', config.name);
        }
      } catch (error) {
        console.error(`❌ [${config.name}] خطأ في دورة الطائرة:`, error?.message || error);
      }

      const elapsed = Date.now() - cycleStartedAt;
      await sleep(Math.max(1000, (8 * 60 * 1000) - elapsed));
    }
  }

  // ----- معالجة كافة الرسائل الواردة -----
  async function handleIncomingMessage(message) {
    try {
      const senderId = getSenderId(message);
      const roomId = getRoomId(message);
      let body = getMessageText(message);
      if (!body) return;

      // 1. سباق الحصان
      if (senderId === Number(TRACKED_BOT_ID)) {
        const cleanedBody = cleanText(body);
        if (isEnergyReadyMessage(cleanedBody)) {
          raceManager.handleEnergyReady(config.index);
          return;
        }
        if (roomId === Number(RACE_ROOM_ID) && cleanedBody.includes('انتهى السباق')) {
          await raceManager.handleRaceEndMessage(cleanedBody);
        }
      }

      // 2. XO
      if (!message.isGroup && senderId === XO_BOT_ID && XO_ACCOUNTS.includes(config.index)) {
        handleXOIncomingData(message);
      }

      // 3. المعززات (البونص)
      if (!message.isGroup && isBonusMessage(body)) {
        const bonusRoomId = extractRoomIdFromBonus(body);
        if (!bonusRoomId) return;

        const bonusSenderId = extractSenderIdFromBonus(body);

        BOT_TRIGGERS.forEach(trigger => {
          if (isAccountInTrigger(trigger, config)) {
            console.log(`📥 [حساب ${config.index} - ${config.name}] غرفة: ${bonusRoomId} | صاحب المعزز: ${bonusSenderId || 'عام'} | الأمر: ${trigger.command}`);
            addToBonusQueue(bonusRoomId, trigger.command);
          }
        });

        if (!isBonusResting) {
          processBonusQueue();
        }
      }
    } catch (err) {
      console.error(`❌ [${config.name}] خطأ استقبال: ${err.message}`);
    }
  }

  client.on('message', handleIncomingMessage);
  client.on('groupMessage', handleIncomingMessage);

  // ----- عند جاهزية الاتصال -----
  client.on('ready', () => {
    console.log(`✅ الحساب ${config.index} (${config.name}) جاهز`);

    // أ) التسجيل بالسباق
    if (isAccountActive(config.index)) {
      raceManager.registerClient(config.index, config, client, triggerRaceCommand);
      if (config.index === getFirstActiveIndex()) {
        setTimeout(() => raceManager.start(), 5000);
      }
    }

    // ب) تشغيل دورة المعززات للحسابات المخصصة
    const isAssignedToBonus = BOT_TRIGGERS.some(t => isAccountInTrigger(t, config));
    if (isAssignedToBonus) {
      startBonusCycle();
    }

    // ج) لعبة XO
    // ج) لعبة XO
if (XO_ACCOUNTS.includes(config.index)) {
    setTimeout(async () => {
        try {
            console.log(`🎮 [${config.name}] جاري إرسال أمر البداية...`);

           await globalQueue.add(
    client,
    XO_ROOM_ID,
    XO_START_COMMAND,
    config.name
);

            console.log(`✅ [${config.name}] تم إرسال أمر البداية`);
        } catch (e) {
            console.error(`❌ [${config.name}] فشل إرسال أمر XO`);
            console.error(e);
        }
    }, 3000);
}

    // د) تسجيل الحساب في مدير قراند المركزي
    if (
      GRAND_COLLECT_ACCOUNTS.includes(config.index) ||
      GRAND_STEAL_ATTACK_COUNTS.includes(config.index) ||
      GRAND_LOTTERY_ACCOUNTS.includes(config.index)
    ) {
      registerGrandBot(
        config.index,
        config.name,
        safeSendGrand,
        () => isAccountTerminated
      );
      startGrandSchedulersOnce();
    }

    // هـ) تشغيل دورة الطائرة المطورة
    if (AIRPLANE_ACCOUNTS.includes(config.index)) {
      startAirplaneLoop().catch(err => {
        console.error(`❌ [${config.name}] خطأ في حلقة الطائرة:`, err?.message);
      });
    }
  });

  // تسجيل الدخول
  try {
    const loginResult = client.login(config.email, config.password);
    if (loginResult && typeof loginResult.catch === 'function') {
      loginResult.catch((err) => {
        console.error(`❌ [${config.name}] فشل تسجيل الدخول: ${err.message}`);
      });
    }
  } catch (err) {
    console.error(`❌ [${config.name}] خطأ تسجيل الدخول: ${err.message}`);
  }
}

// =========================================================================
// 🚀 10. تشغيل الحسابات بالتتابع (فاصل 4 ثوانٍ)
// =========================================================================
let loginOrder = 0;

ACCOUNTS.forEach((account) => {
  if (!account.email || !account.password) {
    return;
  }

  setTimeout(() => createBot(account), loginOrder * 4000);
  loginOrder++;
});
