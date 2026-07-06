import 'dotenv/config';
import wolfjs from 'wolf.js';
import sharp from 'sharp';
import { createWorker } from 'tesseract.js';
import fetch from 'node-fetch';

const { WOLF } = wolfjs;

// إعدادات الغرف
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
    let cachedSend = null;

    // --- نظام البحث الذكي عن دالة الإرسال (مستخلص من كودك الأول الناجح) ---
    function resolveSendMethod() {
        if (cachedSend) return cachedSend;
        const candidates = ['sendChannelMessage', 'sendGroupMessage', 'send', 'sendMessage'];
        for (let name of candidates) {
            if (typeof client.messaging[name] === 'function') {
                cachedSend = client.messaging[name].bind(client.messaging);
                return cachedSend;
            }
        }
        return null;
    }

    async function safeSend(id, msg) {
        const method = resolveSendMethod();
        if (method) {
            try { return await method(id, msg); } catch (e) { console.error("خطأ إرسال:", e.message); }
        }
    }

    // --- منطق المهام ---
    async function startTasks() {
        let count = 0;
        while (true) {
            count++;
            console.log(`[${config.allowedPlayers[0]}] إرسال الأوامر...`);
            await safeSend(config.channelId, '!مد مهام');
            await sleep(3000);
            if (count === 3) {
                await safeSend(config.channelId, '!مد اسرق');
                await sleep(3000);
                count = 0;
            }
            await safeSend(config.channelId, config.cmd);
            await sleep(65000);
        }
    }

    client.on('ready', async () => {
        console.log(`✅ ${config.allowedPlayers[0]} متصل!`);
        await sleep(10000); // انتظار 10 ثوانٍ لضمان استقرار الاتصال قبل بدء المهام
        startTasks();
    });

    client.login(config.email, config.password);
}

// تشغيل الحسابات بفاصل زمني كبير
ACCOUNTS.forEach((acc, i) => {
    const room = specialUsersSet.has(acc.allowedPlayers[0]) ? SECOND_ROOM : MAIN_ROOM;
    setTimeout(() => createBot({ ...acc, ...room }), i * 20000);
});
