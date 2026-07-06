import 'dotenv/config';
import wolfjs from 'wolf.js';

const { WOLF } = wolfjs;

// ================== 🎛️ CONTROL PANEL ==================
const MAIN_ROOM = { channelId: 569, targetUserId: 84520028 };
const SECOND_ROOM = { channelId: 13219769, targetUserId: 76023171 };
const CHECK_ROOM = { channelId: 18654218, targetUserId: 76023242 };

const SPECIAL_ROOM_USERS = [];
const specialUsersSet = new Set(SPECIAL_ROOM_USERS);

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
    const PLAY_CHANNEL_ID = config.channelId; 
    const botName = config.allowedPlayers[0];  
    const playCommand = config.cmd; 
    
    let globalTimer = 0;

    async function getBoxStatus() {
        return new Promise((resolve) => {
            client.messaging.sendGroupMessage(CHECK_ROOM.channelId, '!مد صندوق');
            let isResolved = false;
            const handler = (message) => {
                if (message.sourceSubscriberId === CHECK_ROOM.targetUserId && message.body?.startsWith('/me 📦 حالة الصناديق')) {
                    isResolved = true;
                    client.removeListener('groupMessage', handler);
                    resolve(message.body);
                }
            };
            client.on('groupMessage', handler);
            setTimeout(() => { if(!isResolved) { client.removeListener('groupMessage', handler); resolve(null); } }, 12000);
        });
    }

    async function sendBoxCommand() {
        const reply = await getBoxStatus();
        if (!reply) { globalTimer = 300; return; }

        const keys = parseInt(reply.match(/مفاتيح:\s*(\d+)/)?.[1] || 0);
        const points = parseInt(reply.match(/نقاط الضمان:\s*(\d+)\/50/)?.[1] || 0);
        const isReady = reply.includes('جاهز ✅');
        const timerLine = reply.match(/⏳ الجهاز الزمني:\s*(.+)/)?.[1] || "";

        if (keys === 0) { globalTimer = 300; return; }

        if (!isReady && points < 50) {
            await client.messaging.sendGroupMessage(CHECK_ROOM.channelId, '!مد صندوق فتح');
            await sleep(3000);
        }

        if (timerLine.includes('موقوف')) {
            await client.messaging.sendGroupMessage(CHECK_ROOM.channelId, '!مد تشغيل');
            await sleep(3000);
            globalTimer = 5;
        } else if (timerLine.includes('غير نشط') && isReady) {
            await client.messaging.sendGroupMessage(CHECK_ROOM.channelId, '!مد صندوق ضمان وقت');
            await sleep(3000);
            globalTimer = 5;
        } else {
            const h = timerLine.match(/(\d+)س/);
            const m = timerLine.match(/(\d+)د/);
            const s = timerLine.match(/(\d+)ث/);
            let totalMs = ((h ? parseInt(h[1]) : 0) * 3600 + (m ? parseInt(m[1]) : 0) * 60 + (s ? parseInt(s[1]) : 0)) * 1000;
            globalTimer = totalMs > 0 ? (totalMs / 1000) + 3 : 300;
        }
    }

    async function mainActionLoop() {
        let minuteCounter = 0;
        while (true) {
            try {
                minuteCounter++;
                await client.messaging.sendGroupMessage(PLAY_CHANNEL_ID, '!مد مهام');
                await sleep(2000);
                if (minuteCounter === 3) {
                    await client.messaging.sendGroupMessage(PLAY_CHANNEL_ID, '!مد اسرق');
                    await sleep(2000);
                    minuteCounter = 0;
                }
                await client.messaging.sendGroupMessage(PLAY_CHANNEL_ID, playCommand);
                await sleep(61000);
            } catch (e) { await sleep(5000); }
        }
    }

    async function openBoxLoop() {
        while (true) {
            await client.messaging.sendGroupMessage(CHECK_ROOM.channelId, '!مد صندوق فتح');
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
        console.log(`✅ ${botName} متصل`);
        mainActionLoop();
        openBoxLoop();
        checkLoop();
        
        setTimeout(async () => {
            await client.messaging.sendGroupMessage(CHECK_ROOM.channelId, '!مد ايقاف');
        }, 21480000);
    });

    client.login(config.email, config.password);
}

ACCOUNTS.forEach((acc, i) => {
    const playerName = acc.allowedPlayers[0];
    const roomSettings = specialUsersSet.has(playerName) ? SECOND_ROOM : MAIN_ROOM;
    setTimeout(() => createBot({ ...acc, ...roomSettings }), i * 15000);
});
