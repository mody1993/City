import 'dotenv/config';
import wolfjs from 'wolf.js';
import sharp from 'sharp';
import { createWorker } from 'tesseract.js';

const { WOLF } = wolfjs;
const client = new WOLF();

// --- الإعدادات ---
// هام جداً: تأكد أن هذه الأرقام صحيحة تماماً لكي يقرأ البوت الرسائل
const TARGET_USER_ID = 76023604; 
const CHANNEL_TASKS = 224;
const CHANNEL_ALLIANCE = 224;

// القائمة المحدثة (مجموعة أسماء بدلاً من اسم واحد)
const ALLOWED_PLAYERS = ['أوكسجينه', 'أوكسجيته', 'أوكسجيئه'];

let currentInterval = 306000;
let isWaitingForBoxStatus = false;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- منطق الصناديق ---
async function manageGuarantee(points, gold, silver, bronze, isReady) {
    let currentPoints = points;
    let g = gold, s = silver, b = bronze;

    while (true) {
        // شرط التوقف: إذا كانت الحالة "جاهز" والنقاط بين 40 و 45
        if (isReady && currentPoints >= 40 && currentPoints <= 45) break;
        // إذا نفدت الصناديق
        if (g === 0 && s === 0 && b === 0) break;

        if (g > 0) {
            await client.messaging.sendGroupMessage(CHANNEL_TASKS, '!مد صندوق فتح ذهبي');
            g--; currentPoints += 4;
        } else if (s > 0) {
            await client.messaging.sendGroupMessage(CHANNEL_TASKS, '!مد صندوق فتح فضي');
            s--; currentPoints += 2;
        } else if (b > 0) {
            await client.messaging.sendGroupMessage(CHANNEL_TASKS, '!مد صندوق فتح برونزي');
            b--; currentPoints += 1;
        }
        isReady = (currentPoints >= 50);
        await sleep(1500);
    }
}

// --- الأتمتة ---
client.on('ready', async () => {
    await client.group.joinById(CHANNEL_TASKS);
    await client.group.joinById(CHANNEL_ALLIANCE);
    
    // طلب الحالة فور التشغيل
    client.messaging.sendGroupMessage(CHANNEL_TASKS, '!مد صندوق');
    isWaitingForBoxStatus = true;
});

// المهام الدورية
setInterval(() => client.messaging.sendGroupMessage(CHANNEL_TASKS, '!مد صندوق فتح'), 5 * 60 * 1000);
setInterval(() => client.messaging.sendGroupMessage(CHANNEL_TASKS, '!مد صندوق ضمان وقت'), 60 * 60 * 1000);
setInterval(() => { 
    client.messaging.sendGroupMessage(CHANNEL_TASKS, '!مد صندوق');
    isWaitingForBoxStatus = true;
}, 30 * 60 * 1000);

(async () => {
    while (true) {
        try {
            await client.messaging.sendGroupMessage(CHANNEL_TASKS, '!مد مهام');
            await sleep(2000);
            await client.messaging.sendGroupMessage(CHANNEL_ALLIANCE, '!مد تحالف ايداع كل');
            await sleep(currentInterval);
        } catch (e) { await sleep(5000); }
    }
})();

// --- معالجة الرسائل ---
client.on('groupMessage', async (message) => {
    // 1. معالجة الصناديق
    if (message.sourceSubscriberId === TARGET_USER_ID) {
        const body = message.body;
        const pointsMatch = body.match(/(\d+)\/50/);
        const isReady = body.includes('جاهز');
        
        if (pointsMatch) {
            const points = parseInt(pointsMatch[1]);
            const goldMatch = body.match(/(?:ذهبي|gold)[:\s]*(\d+)/i);
            const silverMatch = body.match(/(?:فضي|silver)[:\s]*(\d+)/i);
            const bronzeMatch = body.match(/(?:برونزي|bronze)[:\s]*(\d+)/i);
            
            const gold = goldMatch ? parseInt(goldMatch[1]) : 0;
            const silver = silverMatch ? parseInt(silverMatch[1]) : 0;
            const bronze = bronzeMatch ? parseInt(bronzeMatch[1]) : 0;

            if (body.includes('الجهاز الزمني')) {
                const timeMatch = body.match(/(\d+)[د|m]/);
                if (!timeMatch) { 
                    if (isReady) {
                        client.messaging.sendGroupMessage(CHANNEL_TASKS, '!مد صندوق ضمان وقت');
                    } else {
                        await manageGuarantee(points, gold, silver, bronze, isReady);
                        currentInterval = 306000;
                    }
                } else {
                    currentInterval = 64000;
                }
            }
            isWaitingForBoxStatus = false;
        }
    }

    // 2. معالجة الكابتشا (باستخدام المجموعة المحدثة)
    if ((message.targetGroupId === CHANNEL_TASKS || message.targetGroupId === CHANNEL_ALLIANCE) && 
        message.sourceSubscriberId === TARGET_USER_ID && 
        message.type === 'text/image_link') {
        
        try {
            const response = await fetch(message.body);
            const buffer = Buffer.from(await response.arrayBuffer());
            if (!(await isCaptchaByColor(buffer))) return;

            const name = await extractPlayerName(buffer);
            
            // تحقق من وجود أي اسم من القائمة في الاسم المستخرج
            if (ALLOWED_PLAYERS.some(p => name.includes(p))) {
                const code = await solveCaptcha(buffer);
                if (code) await client.messaging.sendGroupMessage(message.targetGroupId, `#${code}`);
            }
        } catch (e) {}
    }
});

// --- الدوال ---
async function isCaptchaByColor(b) { /* منطق اللون */ return true; }
async function extractPlayerName(b) { /* منطق الاسم */ return " "; }
async function solveCaptcha(b) { /* منطق الكود */ return "1234"; }

client.login(process.env.U_MAIL, process.env.U_PASS);
