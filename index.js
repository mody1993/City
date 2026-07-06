import 'dotenv/config';
import wolfjs from 'wolf.js';

const { WOLF } = wolfjs;

// ================== الإعدادات ==================
const MAIN_ROOM = { channelId: 569, targetUserId: 84520028 };
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
    const PLAY_CHANNEL_ID = MAIN_ROOM.channelId;
    let sendFn = null; // سيتم تحديدها لاحقاً

    // وظيفة لاكتشاف دالة الإرسال الصحيحة في نسختك من المكتبة
    function findSendMethod() {
        if (typeof client.sendGroupMessage === 'function') return client.sendGroupMessage.bind(client);
        if (client.group && typeof client.group.send === 'function') return client.group.send.bind(client.group);
        if (client.messaging && typeof client.messaging.sendGroupMessage === 'function') return client.messaging.sendGroupMessage.bind(client.messaging);
        if (client.messaging && typeof client.messaging.sendMessage === 'function') return client.messaging.sendMessage.bind(client.messaging);
        return null;
    }

    async function send(groupId, msg) {
        if (!sendFn) sendFn = findSendMethod();
        if (!sendFn) {
            console.log(`[${botName}] ❌ خطأ فادح: لم يتم العثور على دالة إرسال!`);
            return;
        }
        try {
            await sendFn(groupId, msg);
            console.log(`[${botName}] ✅ أرسل: ${msg}`);
        } catch (e) {
            console.log(`[${botName}] ⚠️ فشل الإرسال: ${e.message}`);
        }
    }

    async function getBoxStatus() {
        return new Promise((resolve) => {
            send(CHECK_ROOM.channelId, '!مد صندوق');
            const handler = (m) => {
                if (m.sourceSubscriberId === CHECK_ROOM.targetUserId && m.body?.includes('حالة الصناديق')) {
                    client.removeListener('groupMessage', handler);
                    resolve(m.body);
                }
            };
            client.on('groupMessage', handler);
            setTimeout(() => { client.removeListener('groupMessage', handler); resolve(null); }, 10000);
        });
    }

    client.on('ready', async () => {
        console.log(`✅ الحساب [${botName}] متصل وجاهز.`);
        
        // الانضمام للغرف
        if (client.group && client.group.join) {
            await client.group.join(PLAY_CHANNEL_ID);
            await client.group.join(CHECK_ROOM.channelId);
        }

        // حلقة المهام الدورية
        setInterval(async () => {
            await send(PLAY_CHANNEL_ID, '!مد مهام');
            await sleep(2000);
            await send(PLAY_CHANNEL_ID, config.cmd);
        }, 65000);

        // حلقة فحص الصناديق
        while (true) {
            const status = await getBoxStatus();
            if (status?.includes('موقوف')) await send(CHECK_ROOM.channelId, '!مد تشغيل');
            else if (status?.includes('غير نشط')) await send(CHECK_ROOM.channelId, '!مد صندوق ضمان وقت');
            await sleep(300000); // فحص كل 5 دقائق
        }
    });

    client.login(config.email, config.password);
}

// تشغيل البوتات
ACCOUNTS.forEach((acc, i) => {
    if (acc.email) { // تأكد من وجود إيميل
        setTimeout(() => createBot(acc), i * 15000);
    }
});
