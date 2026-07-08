import 'dotenv/config';

process.env.SUPPRESS_NO_CONFIG_WARNING = 'true';

const originalLog = console.log.bind(console);
const originalWarn = console.warn.bind(console);
const originalError = console.error.bind(console);

const HIDE_LOGS = [
    '[DEBUG]',
    '[WARN]',
    'DEBUG',
    'WARN',
    'CleanUp',
    'Synchronise',
    'GroupAudioCountUpdated',
    'MessageUpdate',
    'Websocket',
    'TipAdd',
    'Message from self ignoring',
    'Store Reset',
    'apiKey will be required',
    'No configurations found',
    'SUPPRESS_NO_CONFIG_WARNING',
    'Logged in [profile:',
    'channel that was not cached',
    'privateMessageSubscription',
    'channelMessageSubscription',
    'tipChannelSubscription'
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

const stdoutWrite = process.stdout.write.bind(process.stdout);
const stderrWrite = process.stderr.write.bind(process.stderr);

process.stdout.write = (chunk, encoding, callback) => {
    const text = String(chunk);
    if (shouldHide(text)) return true;
    return stdoutWrite(chunk, encoding, callback);
};

process.stderr.write = (chunk, encoding, callback) => {
    const text = String(chunk);
    if (shouldHide(text)) return true;
    return stderrWrite(chunk, encoding, callback);
};

const wolfjs = await import('wolf.js');
const { WOLF } = wolfjs.default || wolfjs;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ================== CONTROL PANEL ==================

const MAIN_ROOM = {
    channelId: 569,
    targetUserId: 84520028
};

const SECOND_ROOM = {
    channelId: 13219769,
    targetUserId: 76023171
};

const CHECK_ROOM = {
    channelId: 445,
    targetUserId: 84520026
};

// ================== غرفة السرقة ==================
// ضع رقم غرفة السرقة بدل 0
const STEAL_ROOM = {
    channelId: 0
};

const SPECIAL_ROOM_USERS = [];
const specialUsersSet = new Set(SPECIAL_ROOM_USERS);

// ================== ACCOUNTS ==================

const ACCOUNTS = [
    { email: process.env.U_MAIL_1,  password: process.env.U_PASS_1,  allowedPlayers: ['King'],    cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_2,  password: process.env.U_PASS_2,  allowedPlayers: ['KSA'],     cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_3,  password: process.env.U_PASS_3,  allowedPlayers: ['MKH'],     cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_4,  password: process.env.U_PASS_4,  allowedPlayers: ['SAA'],     cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_5,  password: process.env.U_PASS_5,  allowedPlayers: ['JDH'],     cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_6,  password: process.env.U_PASS_6,  allowedPlayers: ['MLK'],     cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_7,  password: process.env.U_PASS_7,  allowedPlayers: ['CRN'],     cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_8,  password: process.env.U_PASS_8,  allowedPlayers: ['REX'],     cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_9,  password: process.env.U_PASS_9,  allowedPlayers: ['LRD'],     cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_10, password: process.env.U_PASS_10, allowedPlayers: ['ROY'],     cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_11, password: process.env.U_PASS_11, allowedPlayers: ['EMP'],     cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_12, password: process.env.U_PASS_12, allowedPlayers: ['NOR'],     cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_13, password: process.env.U_PASS_13, allowedPlayers: ['Passion'], cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_14, password: process.env.U_PASS_14, allowedPlayers: ['NOX'],   cmd: '!مد تحالف ايداع كل' }
];

// ================== SAFE SEND ==================

async function safeSend(client, roomId, cmd, accountName = 'UNKNOWN') {
    try {
        await client.messaging.sendChannelMessage(Number(roomId), cmd);
        originalLog(`🧢 [${accountName}] ${cmd}`);
        return true;
    } catch (err) {
        originalError(`❌ [${accountName}] فشل الإرسال: ${err.message}`);
        return false;
    }
}

// ================== BOT FACTORY ==================

function createBot(config) {
    const client = new WOLF();

    const acc = {
        name: config.allowedPlayers[0],
        email: config.email,
        password: config.password,
        allowedPlayers: config.allowedPlayers,
        cmd: config.cmd
    };

    const PLAY_CHANNEL_ID = config.channelId;
    const CHECK_ROOM_ID = CHECK_ROOM.channelId;
    const STEAL_ROOM_ID = STEAL_ROOM.channelId;

    const botName = acc.name;
    const playCommand = acc.cmd;

    let globalTimer = 0;

    let isMainLoopStarted = false;
    let isOpenBoxLoopStarted = false;
    let isCheckLoopStarted = false;
    let isInitialBoxCheckStarted = false;
    let isStealLoopStarted = false;

    const accountState = {
        isTerminated: false
    };

    async function processBox(g, s, b, points, notReady) {
        const send = async (cmd) => {
            await safeSend(client, CHECK_ROOM_ID, cmd, acc.name);
            await sleep(2000);
        };

        if (notReady) {
            while (g > 0) {
                await send('!مد صندوق فتح ذهبي');
                g--;
            }

            while (s > 0) {
                await send('!مد صندوق فتح فضي');
                s--;
            }

            while (b > 0) {
                await send('!مد صندوق فتح برونزي');
                b--;
            }

            return;
        }

        let need = Math.max(0, 42 - points);

        while (need > 0) {
            if (need >= 4 && g > 0) {
                await send('!مد صندوق فتح ذهبي');
                g--;
                need -= 4;
            } else if (need >= 2 && s > 0) {
                await send('!مد صندوق فتح فضي');
                s--;
                need -= 2;
            } else if (need >= 1 && b > 0) {
                await send('!مد صندوق فتح برونزي');
                b--;
                need -= 1;
            } else {
                break;
            }
        }
    }

    async function getBoxStatus(attempt = 1) {
        return new Promise(async (resolve) => {
            let isResolved = false;

            const handler = async (message) => {
                if (
                    Number(message.sourceUserId) === Number(CHECK_ROOM.targetUserId) &&
                    Number(message.targetChannelId) === Number(CHECK_ROOM.channelId) &&
                    typeof message.body === 'string' &&
                    message.body.startsWith('/me 📦 حالة الصناديق')
                ) {
                    isResolved = true;
                    client.removeListener('message', handler);
                    clearTimeout(fallbackTimeout);
                    resolve(message.body);
                }
            };

            client.on('message', handler);

            await safeSend(client, CHECK_ROOM_ID, '!مد صندوق', acc.name);

            const fallbackTimeout = setTimeout(async () => {
                if (isResolved) return;

                client.removeListener('message', handler);

                if (attempt < 3) {
                    console.log(`[${botName}] ⚠️ تعليق في الفحص! إعادة المحاولة رقم ${attempt}...`);
                    await sleep(4000);
                    resolve(await getBoxStatus(attempt + 1));
                } else {
                    resolve(null);
                }
            }, 12000);
        });
    }

    async function sendBoxCommand() {
        console.log(`[${botName}] 🔍 [المرحلة 1] جاري إرسال أمر الفحص...`);

        const firstReply = await getBoxStatus();

        if (!firstReply) {
            console.log(`[${botName}] 🚨 فشل الفحص! وضع الأمان 5 دقائق...`);
            globalTimer = 300;
            return;
        }

        let cleanBody = firstReply.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '');
        let lines = cleanBody.split('\n');
        let timerLine = lines.find(l => l.includes('الجهاز الزمني'));

        let stateChanged = false;

        if (timerLine) {
            if (timerLine.includes('موقوف')) {
                console.log(`[${botName}] 🎛️ الجهاز موقوف! إرسال أمر تشغيل...`);
                await safeSend(client, CHECK_ROOM_ID, '!مد تشغيل', acc.name);
                await sleep(3000);
                stateChanged = true;
            } else if (timerLine.includes('غير نشط')) {
                console.log(`[${botName}] ⏳ الجهاز غير نشط! إرسال أمر ضمان وقت...`);
                await safeSend(client, CHECK_ROOM_ID, '!مد صندوق ضمان وقت', acc.name);
                await sleep(3000);
                stateChanged = true;
            }
        }

        let finalReply = firstReply;

        if (stateChanged) {
            console.log(`[${botName}] 🔍 [المرحلة 2] تحديث البيانات بعد التنشيط...`);

            finalReply = await getBoxStatus();

            if (!finalReply) {
                console.log(`[${botName}] 🚨 فشل الفحص الثاني! وضع الأمان 5 دقائق...`);
                globalTimer = 300;
                return;
            }

            cleanBody = finalReply.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '');
            lines = cleanBody.split('\n');
            timerLine = lines.find(l => l.includes('الجهاز الزمني'));
        }

        const guaranteeLine = lines.find(l => l.includes('الضمان') && !l.includes('نقاط'));
        const isGuaranteeReady = guaranteeLine ? guaranteeLine.includes('جاهز') : false;
        const notReady = !isGuaranteeReady;

        const boxes = cleanBody.match(/برونزي:\s*(\d+)\s*\|\s*فضي:\s*(\d+)\s*\|\s*ذهبي:\s*(\d+)/);
        const pointsMatch = cleanBody.match(/نقاط الضمان:\s*(\d+)\/50/);

        const g = boxes ? parseInt(boxes[3], 10) : 0;
        const s = boxes ? parseInt(boxes[2], 10) : 0;
        const b = boxes ? parseInt(boxes[1], 10) : 0;
        const p = pointsMatch ? parseInt(pointsMatch[1], 10) : 0;

        await processBox(g, s, b, p, notReady);

        let tempSeconds = 0;

        if (timerLine) {
            if (timerLine.includes('غير نشط') || timerLine.includes('موقوف')) {
                tempSeconds = 300;
            } else {
                const h = timerLine.match(/(\d+)س/);
                const m = timerLine.match(/(\d+)د/);
                const sMatch = timerLine.match(/(\d+)ث/);

                if (h) tempSeconds += parseInt(h[1], 10) * 3600;
                if (m) tempSeconds += parseInt(m[1], 10) * 60;
                if (sMatch) tempSeconds += parseInt(sMatch[1], 10);

                tempSeconds += 5;
            }
        }

        globalTimer = tempSeconds > 0 ? tempSeconds : 300;

        console.log(`[${botName}] ⏱️ الفحص انتهى -> دورة الفحص القادمة بعد: ${globalTimer} ثانية.`);
    }

    async function mainActionLoop() {
        let minuteCounter = 0;

        while (!accountState.isTerminated) {
            try {
                minuteCounter++;

                if (minuteCounter === 3) {
                    console.log(`[${botName}] 🥷 الدقيقة [3]: إرسال مهام + سرقة + إيداع...`);

                    await safeSend(client, PLAY_CHANNEL_ID, '!مد مهام', acc.name);
                    await sleep(2000);

                    await safeSend(client, PLAY_CHANNEL_ID, '!مد اسرق', acc.name);
                    await sleep(2000);

                    await safeSend(client, PLAY_CHANNEL_ID, playCommand, acc.name);

                    minuteCounter = 0;
                } else {
                    console.log(`[${botName}] 🔄 الدقيقة [${minuteCounter}]: إرسال مهام + إيداع...`);

                    await safeSend(client, PLAY_CHANNEL_ID, '!مد مهام', acc.name);
                    await sleep(2000);

                    await safeSend(client, PLAY_CHANNEL_ID, playCommand, acc.name);
                }

                await sleep(61000);

            } catch (e) {
                console.error(`[${botName}] ❌ خطأ في الدورة الموحدة:`, e.message);
                await sleep(5000);
            }
        }
    }

    async function openBoxLoop() {
        while (!accountState.isTerminated) {
            try {
                console.log(`[${botName}] 📦 إرسال أمر الفتح الدوري في قناة الفحص...`);
                await safeSend(client, CHECK_ROOM_ID, '!مد صندوق فتح', acc.name);
                await sleep(500000);
            } catch (e) {
                console.error(`[${botName}] ❌ خطأ في دورة الفتح الدوري:`, e.message);
                await sleep(5000);
            }
        }
    }

    async function checkLoop() {
        while (!accountState.isTerminated) {
            try {
                const waitSeconds = globalTimer > 0 ? globalTimer : 300;

                console.log(`[${botName}] ⏳ انتظار ${waitSeconds} ثانية حتى فحص الجهاز الزمني...`);
                await sleep(waitSeconds * 1000);

                console.log(`[${botName}] 🔁 انتهى المؤقت، جاري إرسال !مد صندوق لفحص الضمان والجهاز...`);
                await sendBoxCommand();

            } catch (e) {
                console.error(`[${botName}] ❌ خطأ في دورة الفحص:`, e.message);
                await sleep(5000);
            }
        }
    }

    async function stealLoop() {
        if (!STEAL_ROOM_ID || Number(STEAL_ROOM_ID) <= 0) {
            console.log(`[${botName}] ⚠️ لم يتم ضبط غرفة السرقة STEAL_ROOM.channelId، تم تخطي دورة السرقة.`);
            return;
        }

        while (!accountState.isTerminated) {
            try {
                console.log(`[${botName}] 🥷 إرسال أمر السرقة في غرفة السرقة...`);
                await safeSend(client, STEAL_ROOM_ID, '!مد سرقة ٩٩٩٣', acc.name);

                await sleep((30 * 60 * 1000) + 3000);

            } catch (e) {
                console.error(`[${botName}] ❌ خطأ في دورة السرقة:`, e.message);
                await sleep(5000);
            }
        }
    }

    client.on('ready', async () => {
        console.log(`✅ الحساب [${botName}] شبك بنجاح! اللعب في [${PLAY_CHANNEL_ID}] | الفحص في [${CHECK_ROOM_ID}]`);

        try {
            console.log(`[${botName}] 🚀 بدء تنفيذ تسلسل أوامر التشغيل...`);

            if (!isMainLoopStarted) {
                isMainLoopStarted = true;
                mainActionLoop();
            }

            if (!isOpenBoxLoopStarted) {
                isOpenBoxLoopStarted = true;
                openBoxLoop();
            }

            if (!isCheckLoopStarted) {
                isCheckLoopStarted = true;
                checkLoop();
            }

            if (!isStealLoopStarted) {
                isStealLoopStarted = true;
                stealLoop();
            }

            if (!isInitialBoxCheckStarted) {
                isInitialBoxCheckStarted = true;
                sendBoxCommand().catch(err => {
                    console.error(`[${botName}] خطأ في فحص الصناديق الأولي:`, err.message);
                });
            }

            setTimeout(async () => {
                console.log(`[${botName}] 🛑 مضت 5 ساعات و 58 دقيقة! إرسال أمر الإيقاف...`);

                accountState.isTerminated = true;

                try {
                    await safeSend(client, CHECK_ROOM_ID, '!مد ايقاف', acc.name);
                } catch (stopErr) {
                    console.error(`[${botName}] خطأ أثناء إرسال أمر الإيقاف:`, stopErr.message);
                }
            }, 21480000);

        } catch (err) {
            console.error(`[${botName}] ❌ خطأ تهيئة البوت:`, err.message);
        }
    });

    client.login(acc.email, acc.password);
}

// ================== START ==================

ACCOUNTS.forEach((acc, i) => {
    const playerName = acc.allowedPlayers[0];
    const roomSettings = specialUsersSet.has(playerName) ? SECOND_ROOM : MAIN_ROOM;

    const finalConfig = {
        ...acc,
        channelId: roomSettings.channelId,
        targetUserId: roomSettings.targetUserId
    };

    setTimeout(() => {
        createBot(finalConfig);
    }, i * 10000);
});
