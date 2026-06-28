import 'dotenv/config';
import wolfjs from 'wolf.js';

const { WOLF } = wolfjs;

// ================== 🎛️ CONTROL PANEL ==================
const MAIN_ROOM = { channelId: 569, targetUserId: 84520028 };
const SECOND_ROOM = { channelId: 13219769, targetUserId: 76023171 };
const SPECIAL_ROOM_USERS = []; // ضع أسماء اللاعبين هنا للغرفة الثانية

const ACCOUNTS = [
    { email: process.env.U_MAIL_1, password: process.env.U_PASS_1, allowedPlayers: ['King'] },
    { email: process.env.U_MAIL_2, password: process.env.U_PASS_2, allowedPlayers: ['KSA'] },
    { email: process.env.U_MAIL_3, password: process.env.U_PASS_3, allowedPlayers: ['MKH'] },
    { email: process.env.U_MAIL_4, password: process.env.U_PASS_4, allowedPlayers: ['SAA'] },
    { email: process.env.U_MAIL_5, password: process.env.U_PASS_5, allowedPlayers: ['JDH'] },
    { email: process.env.U_MAIL_6, password: process.env.U_PASS_6, allowedPlayers: ['MLK'] },
    { email: process.env.U_MAIL_7, password: process.env.U_PASS_7, allowedPlayers: ['CRN'] },
    { email: process.env.U_MAIL_8, password: process.env.U_PASS_8, allowedPlayers: ['REX'] },
    { email: process.env.U_MAIL_9, password: process.env.U_PASS_9, allowedPlayers: ['LRD'] },
    { email: process.env.U_MAIL_10, password: process.env.U_PASS_10, allowedPlayers: ['ROY'] },
    { email: process.env.U_MAIL_11, password: process.env.U_PASS_11, allowedPlayers: ['EMP'] },
    { email: process.env.U_MAIL_12, password: process.env.U_PASS_12, allowedPlayers: ['NOR'] },
    { email: process.env.U_MAIL_13, password: process.env.U_PASS_13, allowedPlayers: ['Passion'] }
];

const activeBots = [];

// ================== BOT FACTORY ==================
function createBot(config) {
    const client = new WOLF();
    const { channelId, targetUserId, allowedPlayers, email } = config;
    const name = allowedPlayers[0];
    let isTimerActive = false;

    async function send(cmd) {
        await client.messaging.sendGroupMessage(channelId, cmd);
        await new Promise(r => setTimeout(r, 2000));
    }

    async function checkStatus() {
        console.log(`[${name}] 🔍 فحص الحالة...`);
        await send('!مد صندوق');
    }

    client.on('groupMessage', async (msg) => {
        if (msg.sourceSubscriberId === targetUserId && msg.targetGroupId === channelId && msg.body?.startsWith('/me 📦 حالة الصناديق')) {
            isTimerActive = !msg.body.includes('غير نشط');
        }
    });

    client.on('ready', async () => {
        console.log(`✅ ${name} متصل.`);
        
        // مسار 1: المهام والإيداع (يتغير تردده بناءً على الحالة)
        setInterval(async () => {
            await send('!مد مهام');
            await send(email === process.env.U_MAIL_6 ? '!مد هدية 38770375 كل' : '!مد تحالف ايداع كل');
        }, isTimerActive ? 60000 : 300000);

        // مسار 2: الصناديق (ثابت كل 5 دقائق)
        setInterval(async () => await send('!مد صندوق فتح'), 300000);

        // مسار 3: فحص دوري
        setInterval(checkStatus, 300000);
        
        await checkStatus();
    });

    client.login(config.email, config.password);
    activeBots.push({ client, channelId });
}

// ================== SAFETY SHUTDOWN ==================
const TOTAL_RUNTIME = 358 * 60 * 1000; // 5 ساعات و 58 دقيقة

setTimeout(() => {
    console.log("⚠️ تفعيل الإغلاق الآمن...");
    activeBots.forEach(async b => {
        await b.client.messaging.sendGroupMessage(b.channelId, '!مد ايقاف');
    });
    setTimeout(() => process.exit(0), 120000);
}, TOTAL_RUNTIME - 120000);

// ================== START ==================
ACCOUNTS.forEach((acc, i) => {
    const room = SPECIAL_ROOM_USERS.includes(acc.allowedPlayers[0]) ? SECOND_ROOM : MAIN_ROOM;
    setTimeout(() => createBot({ ...acc, ...room }), i * 35000);
});
