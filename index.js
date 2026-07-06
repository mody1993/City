import 'dotenv/config';
import wolfjs from 'wolf.js';
import sharp from 'sharp';
import { createWorker } from 'tesseract.js';
import fetch from 'node-fetch';

const { WOLF } = wolfjs;

// ================== 1. لوحة التحكم والإعدادات ==================
const MAIN_ROOM = { channelId: 569, targetUserId: 84520028 };
const SECOND_ROOM = { channelId: 13219769, targetUserId: 76023171 };
const CHECK_ROOM = { channelId: 18654218, targetUserId: 76023242 };
const SPECIAL_ROOM_USERS = [];
const specialUsersSet = new Set(SPECIAL_ROOM_USERS);

// مصفوفة الحسابات كاملة
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

// ================== 2. المصنع البرمجي (Bot Factory) ==================
function createBot(config) {
    const client = new WOLF();
    const PLAY_CHANNEL_ID = config.channelId;
    const botName = config.allowedPlayers[0];
    const playCommand = config.cmd;

    // --- منطق الكابتشا الأصلي (تم الحفاظ عليه بالكامل) ---
    async function isCaptchaByColor(buffer) {
        const { data, info } = await sharp(buffer).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
        let redPixels = 0;
        const totalPixels = info.width * info.height;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] > 120 && data[i] > (data[i + 1] + 30) && data[i] > (data[i + 2] + 30)) redPixels++;
        }
        return (redPixels / totalPixels) * 100 > 40;
    }

    async function solveCaptcha(buffer) {
        const { data, info } = await sharp(buffer).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
        let minX = info.width, minY = info.height, maxX = 0, maxY = 0, found = false;
        for (let y = 0; y < info.height; y++) {
            for (let x = 0; x < info.width; x++) {
                const idx = (y * info.width + x) * 4;
                if (data[idx] > 200 && data[idx + 1] > 200 && data[idx + 2] < 100) {
                    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
                    found = true;
                }
            }
        }
        if (!found) return null;
        const processedBuffer = await sharp(buffer).extract({ left: minX + 10, top: minY + 10, width: (maxX - minX) - 20, height: (maxY - minY) - 20 }).greyscale().normalize().linear(1.5, -0.2).sharpen().toBuffer();
        const worker = await createWorker('eng+ara');
        await worker.setParameters({ tessedit_pageseg_mode: '7' });
        const { data: { text } } = await worker.recognize(processedBuffer);
        await worker.terminate();
        return text.replace(/[^a-zA-Z0-9\u0621-\u064A]/g, '');
    }

    // --- دورات العمل المدمجة ---
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

    client.on('groupMessage', async (message) => {
        // مراقبة الكابتشا الأصلية
        if (message.sourceSubscriberId == 76023604 && message.targetGroupId == PLAY_CHANNEL_ID && message.type === 'text/image_link') {
            const response = await fetch(message.body);
            const buffer = Buffer.from(await response.arrayBuffer());
            if (await isCaptchaByColor(buffer)) {
                const code = await solveCaptcha(buffer);
                if (code) await client.messaging.sendGroupMessage(PLAY_CHANNEL_ID, "#" + code);
            }
        }
    });

    client.on('ready', async () => {
        console.log(`✅ الحساب [${botName}] شبك بنجاح في [${PLAY_CHANNEL_ID}]`);
        mainActionLoop();
    });

    client.login(config.email, config.password);
}

// ================== 3. التشغيل ==================
ACCOUNTS.forEach((acc, i) => {
    const roomSettings = specialUsersSet.has(acc.allowedPlayers[0]) ? SECOND_ROOM : MAIN_ROOM;
    setTimeout(() => createBot({ ...acc, ...roomSettings }), i * 15000);
});
