import 'dotenv/config';
import wolfjs from 'wolf.js';

const { WOLF } = wolfjs;

// ================== فلتر تنظيف الكونسول ==================
const originalLog = console.log;
console.log = function (...args) {
    if (typeof args[0] === 'string' && (args[0].includes('[DEBUG]') || args[0].includes('[WARN]') || args[0].includes('WARNING:'))) {
        return; 
    }
    originalLog.apply(console, args);
};

// ================== الإعدادات ==================
const MAIN_ROOM = { channelId: 569, targetUserId: 84520028 };
const SECOND_ROOM = { channelId: 13219769, targetUserId: 76023171 };
const CHECK_ROOM = { channelId: 18654218, targetUserId: 76023242 };
const SPECIAL_ROOM_USERS = [];
const specialUsersSet = new Set(SPECIAL_ROOM_USERS);

const ACCOUNTS = [
    { email: process.env.U_MAIL_1, password: process.env.U_PASS_1, allowedPlayers: ['King'], cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_2, password: process.env.U_PASS_2, allowedPlayers: ['KSA'], cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_3, password: process.env.U_PASS_3, allowedPlayers: ['MKH'], cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_4, password: process.env.U_PASS_4, allowedPlayers: ['SAA'], cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_5, password: process.env.U_PASS_5, allowedPlayers: ['JDH'], cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_6, password: process.env.U_PASS_6, allowedPlayers: ['MLK'], cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_7, password: process.env.U_PASS_7, allowedPlayers: ['CRN'], cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_8, password: process.env.U_PASS_8, allowedPlayers: ['REX'], cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_9, password: process.env.U_PASS_9, allowedPlayers: ['LRD'], cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_10, password: process.env.U_PASS_10, allowedPlayers: ['ROY'], cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_11, password: process.env.U_PASS_11, allowedPlayers: ['EMP'], cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_12, password: process.env.U_PASS_12, allowedPlayers: ['NOR'], cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_13, password: process.env.U_PASS_13, allowedPlayers: ['Passion'], cmd: '!مد تحالف ايداع كل' }
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function createBot(config) {
    const client = new WOLF();
    const PLAY_CHANNEL_ID = config.channelId;
    const botName = config.allowedPlayers[0];
    const playCommand = config.cmd;
    
    // الميقاتي سيبدأ بـ 300 كاحتياط، لكن سيتم تحديثه فوراً في التشغيل الأولي
    let dynamicCheckTimer = 300; 

    async function sendMessage(groupId, text) {
        try {
            if (client.messaging && typeof client.messaging.sendChannelMessage === 'function') {
                return await client.messaging.sendChannelMessage(groupId, text);
            }
            if (client.messaging && typeof client.messaging.sendMessage === 'function') {
                return await client.messaging.sendMessage(groupId, text);
            }
            if (client.utility && client.utility.channel && typeof client.utility.channel.sendMessage === 'function') {
                return await client.utility.channel.sendMessage(groupId, text);
            }
        } catch (e) {
            // كتم أخطاء الشبكة المؤقتة
        }
    }

    async function processBox(g, s, b, points, notReady) {
        const send = async (cmd) => { await sendMessage(CHECK_ROOM.channelId, cmd); await sleep(2000); };
        if (notReady) {
            while (g > 0) { await send('!مد صندوق فتح ذهبي'); g--; }
            while (s > 0) { await send('!مد صندوق فتح فضي'); s--; }
            while (b > 0) { await send('!مد صندوق فتح برونزي'); b--; }
        } else {
            let need = Math.max(0, 42 - points);
            while (need > 0) {
                if (need >= 4 && g > 0) { await send('!مد صندوق فتح ذهبي'); g--; need -= 4; }
                else if (need >= 2 && s > 0) { await send('!مد صندوق فتح فضي'); s--; need -= 2; }
                else if (need >= 1 && b > 0) { await send('!مد صندوق فتح برونزي'); b--; need -= 1; }
                else break;
            }
        }
    }

    async function getBoxStatus() {
        return new Promise((resolve) => {
            sendMessage(CHECK_ROOM.channelId, '!مد صندوق');
            const handler = (msg) => {
                if (msg.sourceSubscriberId === CHECK_ROOM.targetUserId && msg.body?.startsWith('/me 📦')) {
                    client.removeListener('groupMessage', handler);
                    resolve(msg.body);
                }
            };
            client.on('groupMessage', handler);
            setTimeout(() => { client.removeListener('groupMessage', handler); resolve(null); }, 10000);
        });
    }

    // الدالة المسؤولة عن الفحص الذكي وتحديث الميقاتي ديناميكياً
    async function sendBoxCommand() {
        const reply = await getBoxStatus();
        if (!reply) return;

        if (reply.includes('موقوف')) {
            await sendMessage(CHECK_ROOM.channelId, '!مد تشغيل');
            await sleep(2000);
        } else if (reply.includes('غير نشط')) {
            await sendMessage(CHECK_ROOM.channelId, '!مد صندوق ضمان وقت');
            await sleep(2000);
        }

        const boxes = reply.match(/برونزي:\s*(\d+).*فضي:\s*(\d+).*ذهبي:\s*(\d+)/);
        const p = reply.match(/نقاط الضمان:\s*(\d+)\/50/);
        await processBox(boxes?.[3]||0, boxes?.[2]||0, boxes?.[1]||0, p?.[1]||0, !reply.includes('جاهز'));

        // استخراج وقت الجهاز الزمني المتبقي
        const timeMatch = reply.match(/(?:المتبقي|ينتهي|الوقت|وقت):\s*(\d+)(?:\s*:\s*(\d+))?/i);
        if (timeMatch) {
            const mins = parseInt(timeMatch[1], 10);
            const secs = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
            // ضبط النومة القادمة لتنتهي مع انتهاء الجهاز تماماً (+ 5 ثوانٍ أمان)
            dynamicCheckTimer = (mins * 60) + secs + 5;
            if (dynamicCheckTimer < 30) dynamicCheckTimer = 300; 
        } else {
            dynamicCheckTimer = 300; 
        }
    }

    // 2️⃣ دورة اللعب الأساسية
    async function mainActionLoop() {
        let minuteCounter = 0;
        while (true) {
            minuteCounter++;
            await sendMessage(PLAY_CHANNEL_ID, '!مد مهام'); 
            await sleep(2000);

            if (minuteCounter === 3) { 
                await sendMessage(PLAY_CHANNEL_ID, '!مد اسرق'); 
                await sleep(2000); 
                minuteCounter = 0; 
            }

            await sendMessage(PLAY_CHANNEL_ID, playCommand);
            await sleep(61000);
        }
    }

    // 3️⃣ دورة الفتح الدوري (كل 500 ثانية)
    async function openBoxLoop() {
        while (true) {
            await sleep(500000); 
            await sendMessage(CHECK_ROOM.channelId, '!مد صندوق فتح');
        }
    }

    // 4️⃣ دورة الفحص الذكي (تنام بناءً على القيمة المحددة من الفحص الأخير)
    async function checkLoop() {
        while (true) {
            await sleep(dynamicCheckTimer * 1000);
            await sendBoxCommand();
        }
    }

    // ربط خط السير بحدث الجاهزية والاستعداد
    client.on('ready', async () => {
        originalLog(`✅ [${botName}] متصل بنجاح وبدأ المسار الزمني المعياري.`);

        // 1️⃣ رحلة التشغيل الأولي: تفحص فوراً وتضبط قيمة dynamicCheckTimer الحقيقية
        await sendBoxCommand();

        // إطلاق الدورات المتوازية (الآن checkLoop ستنام بالوقت الدقيق المستخرج للتو)
        mainActionLoop(); 
        openBoxLoop(); 
        checkLoop();

        // 5️⃣ مرحلة الإغلاق النهائي (تغلق وتوقف كل شيء بعد 5 ساعات و 58 دقيقة تلقائياً)
        setTimeout(async () => {
            await sendMessage(CHECK_ROOM.channelId, '!مد ايقاف');
        }, 21480000);
    });

    client.login(config.email, config.password);
}

ACCOUNTS.forEach((acc, i) => {
    const settings = specialUsersSet.has(acc.allowedPlayers[0]) ? SECOND_ROOM : MAIN_ROOM;
    setTimeout(() => createBot({ ...acc, ...settings }), i * 15000);
});
