import 'dotenv/config';
import wolfjs from 'wolf.js';

const { WOLF } = wolfjs;

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

// دالة مساعدة لقراءة الدوال المخفية داخل الكلاسات
function getAllMethods(obj) {
    if (!obj) return [];
    let methods = new Set();
    let current = obj;
    while (current && current !== Object.prototype) {
        Object.getOwnPropertyNames(current).forEach(prop => {
            try { if (typeof obj[prop] === 'function') methods.add(prop); } catch(e){}
        });
        current = Object.getPrototypeOf(current);
    }
    return Array.from(methods);
}

function createBot(config) {
    const client = new WOLF();
    const PLAY_CHANNEL_ID = config.channelId;
    const botName = config.allowedPlayers[0];
    const playCommand = config.cmd;
    let globalTimer = 300;

    // دالة إرسال خارقة تخترق الكلاسات وتجرب مسارات الـ Channel الجديدة
    async function sendMessage(groupId, text) {
        try {
            // مسار 1: التحديث الجديد للمكتبات (messaging + channelMessage)
            if (client.messaging && typeof client.messaging.sendChannelMessage === 'function') {
                return await client.messaging.sendChannelMessage(groupId, text);
            }
            // مسار 2: تحديث (messaging + sendMessage)
            if (client.messaging && typeof client.messaging.sendMessage === 'function') {
                return await client.messaging.sendMessage(groupId, text);
            }
            // مسار 3: عبر كائن channel المباشر إذا كان مدعوماً
            if (client.channel && typeof client.channel.sendMessage === 'function') {
                return await client.channel.sendMessage(groupId, text);
            }
            // مسار 4: عبر الـ utility المكتشف في سجلاتك
            if (client.utility && client.utility.channel && typeof client.utility.channel.sendMessage === 'function') {
                return await client.utility.channel.sendMessage(groupId, text);
            }
            // مسار 5: الاحتياطي القديم لـ group
            if (client.messaging && typeof client.messaging.sendGroupMessage === 'function') {
                return await client.messaging.sendGroupMessage(groupId, text);
            }

            // إذا فشلت كل المحاولات التلقائية، هنا يتدخل المستكشف لطباعة الدوال المخفية
            console.error(`[${botName}] ❌ فشل الإرسال التلقائي. جاري استخراج الدوال المخفية...`);
            if (client.messaging) console.log(`دوال كائن messaging المخفية:`, getAllMethods(client.messaging));
            if (client.channel) console.log(`دوال كائن channel المخفية:`, getAllMethods(client.channel));
            if (client.utility && client.utility.channel) console.log(`دوال كائن utility.channel المخفية:`, getAllMethods(client.utility.channel));
        } catch (e) {
            console.error(`[${botName}] خطأ غير متوقع عند محاولة الإرسال:`, e.message);
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

    async function sendBoxCommand() {
        const reply = await getBoxStatus();
        if (!reply) return;
        if (reply.includes('موقوف')) await sendMessage(CHECK_ROOM.channelId, '!مد تشغيل');
        else if (reply.includes('غير نشط')) await sendMessage(CHECK_ROOM.channelId, '!مد صندوق ضمان وقت');
        const boxes = reply.match(/برونزي:\s*(\d+).*فضي:\s*(\d+).*ذهبي:\s*(\d+)/);
        const p = reply.match(/نقاط الضمان:\s*(\d+)\/50/);
        await processBox(boxes?.[3]||0, boxes?.[2]||0, boxes?.[1]||0, p?.[1]||0, !reply.includes('جاهز'));
    }

    async function mainActionLoop() {
        let min = 0;
        while (true) {
            min++;
            await sendMessage(PLAY_CHANNEL_ID, '!مد مهام'); await sleep(2000);
            if (min === 3) { await sendMessage(PLAY_CHANNEL_ID, '!مد اسرق'); await sleep(2000); min = 0; }
            await sendMessage(PLAY_CHANNEL_ID, playCommand);
            await sleep(61000);
        }
    }

    async function openBoxLoop() {
        while (true) {
            await sendMessage(CHECK_ROOM.channelId, '!مد صندوق فتح');
            await sleep(500000);
        }
    }

    async function checkLoop() {
        while (true) {
            await sleep(globalTimer * 1000);
            await sendBoxCommand();
        }
    }

    client.on('ready', () => {
        console.log(`✅ ${botName} متصل بنجاح.`);
        mainActionLoop(); openBoxLoop(); checkLoop();
        setTimeout(async () => await sendMessage(CHECK_ROOM.channelId, '!مد ايقاف'), 21480000);
    });

    client.login(config.email, config.password);
}

ACCOUNTS.forEach((acc, i) => {
    const settings = specialUsersSet.has(acc.allowedPlayers[0]) ? SECOND_ROOM : MAIN_ROOM;
    setTimeout(() => createBot({ ...acc, ...settings }), i * 15000);
});
