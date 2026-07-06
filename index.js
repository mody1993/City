import 'dotenv/config';
import wolfjs from 'wolf.js';

const { WOLF } = wolfjs;

// ================== الإعدادات ==================
const MAIN_ROOM = { channelId: 569, targetUserId: 84520028 };
const SECOND_ROOM = { channelId: 13219769, targetUserId: 76023171 };
const CHECK_ROOM = { channelId: 18654218, targetUserId: 76023242 };

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
    { email: process.env.U_MAIL_13, password: process.env.U_PASS_13, allowedPlayers: ['Passion'], cmd: '!مد تحالف ايداع كل' }
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function createBot(config) {
    const client = new WOLF();
    const botName = config.allowedPlayers[0];
    const PLAY_CHANNEL_ID = config.channelId;
    let globalTimer = 300;

    // دالة إرسال ذكية تكتشف المسار المتاح في مكتبتك
    async function send(groupId, msg) {
        try {
            if (typeof client.sendGroupMessage === 'function') await client.sendGroupMessage(groupId, msg);
            else if (client.group && typeof client.group.send === 'function') await client.group.send(groupId, msg);
            else if (client.messaging && typeof client.messaging.sendGroupMessage === 'function') await client.messaging.sendGroupMessage(groupId, msg);
        } catch (e) { console.log(`[${botName}] خطأ إرسال: ${e.message}`); }
    }

    async function getBoxStatus(attempt = 1) {
        return new Promise((resolve) => {
            send(CHECK_ROOM.channelId, '!مد صندوق');
            const handler = (m) => {
                if (m.sourceSubscriberId === CHECK_ROOM.targetUserId && m.body?.includes('حالة الصناديق')) {
                    client.removeListener('groupMessage', handler);
                    resolve(m.body);
                }
            };
            client.on('groupMessage', handler);
            setTimeout(() => { client.removeListener('groupMessage', handler); resolve(null); }, 8000);
        });
    }

    client.on('ready', async () => {
        console.log(`✅ الحساب [${botName}] متصل.`);
        // محاولة الانضمام للغرف
        if (client.group && client.group.join) {
            await client.group.join(PLAY_CHANNEL_ID);
            await client.group.join(CHECK_ROOM.channelId);
        }

        // حلقة المهام
        setInterval(async () => {
            await send(PLAY_CHANNEL_ID, '!مد مهام');
            await sleep(2000);
            await send(PLAY_CHANNEL_ID, config.cmd);
        }, 65000);

        // حلقة الفحص
        while (true) {
            const status = await getBoxStatus();
            if (status) {
                if (status.includes('موقوف')) await send(CHECK_ROOM.channelId, '!مد تشغيل');
                else if (status.includes('غير نشط')) await send(CHECK_ROOM.channelId, '!مد صندوق ضمان وقت');
            }
            await sleep(globalTimer * 1000);
        }
    });

    client.login(config.email, config.password);
}

// تشغيل البوتات
ACCOUNTS.forEach((acc, i) => {
    setTimeout(() => createBot(acc), i * 15000);
});
