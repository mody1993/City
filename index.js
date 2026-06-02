import 'dotenv/config';
import wolfjs from 'wolf.js';
import sharp from 'sharp';
import { createWorker } from 'tesseract.js';
import fetch from 'node-fetch';

const { WOLF } = wolfjs;
const client = new WOLF();

// --- الإعدادات الثابتة ---
const TARGET_USER_ID = 80055399 ;
const CHANNEL_TASKS = 81889058;
const CHANNEL_ALLIANCE = 81889058;
const TARGET_PLAYER_NAME = 'أوكسجينه';

// --- متغيرات الحالة المستقلة لكل وحدة ---
const BoxController = {
    isFarming: false,
    waitingForData: false,
    lastRequestTime: 0
};

const TaskController = {
    timer: null,
    currentInterval: 306000 // 5 دقائق افتراضياً
};

const CaptchaController = {
    isProcessing: false
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ==========================================
// 1. وحدة إدارة الصناديق (Box Logic)
// ==========================================
async function requestBoxStatus() {
    BoxController.waitingForData = true;
    BoxController.lastRequestTime = Date.now();
    await client.messaging.sendGroupMessage(CHANNEL_TASKS, '!مد صندوق');
}

async function processBoxData(body) {
    const gold = parseInt(body.match(/ذهبي:\s*(\d+)/)?.[1] || 0);
    const silver = parseInt(body.match(/فضي:\s*(\d+)/)?.[1] || 0);
    const bronze = parseInt(body.match(/برونزي:\s*(\d+)/)?.[1] || 0);
    const points = parseInt(body.match(/نقاط الضمان:\s*(\d+)/)?.[1] || 0);
    const isReady = body.includes('حالة الضمان: جاهز');
    
    // إدارة وقت المهام بناءً على حالة الجهاز الزمني
    const timeStatus = body.match(/الجهاز الزمني:\s*(.*)/)?.[1] || "";
    if (timeStatus.includes('س') || timeStatus.includes('د')) {
        updateTaskInterval(64000); // نشط
    } else {
        updateTaskInterval(306000); // غير نشط
    }

    if (BoxController.isFarming) return;
    if (isReady && points >= 40) return;

    BoxController.isFarming = true;
    let p = points;
    let g = gold, s = silver, b = bronze;

    while (g > 0 || s > 0 || b > 0) {
        if (isReady && p >= 40) break;
        let cmd = "";
        if (g > 0) { cmd = "!مد صندوق فتح ذهبي"; g--; p += 4; }
        else if (s > 0) { cmd = "!مد صندوق فتح فضي"; s--; p += 2; }
        else if (b > 0) { cmd = "!مد صندوق فتح برونزي"; b--; p += 1; }
        else break;

        await client.messaging.sendGroupMessage(CHANNEL_TASKS, cmd);
        await sleep(20000);
    }
    BoxController.isFarming = false;
}

// ==========================================
// 2. وحدة إدارة المهام (Task Logic)
// ==========================================
async function performTasks() {
    try {
        await client.messaging.sendGroupMessage(CHANNEL_TASKS, '!مد مهام');
        await sleep(2000);
        await client.messaging.sendGroupMessage(CHANNEL_ALLIANCE, '!مد تحالف ايداع كل');
    } catch (e) { console.error(`[TASK ERROR] ${e.message}`); }
}

function updateTaskInterval(newInterval) {
    if (TaskController.currentInterval === newInterval) return;
    TaskController.currentInterval = newInterval;
    if (TaskController.timer) clearInterval(TaskController.timer);
    TaskController.timer = setInterval(performTasks, TaskController.currentInterval);
    console.log(`[LOG] ⏱️ تم ضبط توقيت المهام على: ${newInterval / 1000} ثانية.`);
}

// ==========================================
// 3. وحدة معالجة الكابتشا (Captcha Logic)
// ==========================================
async function handleCaptcha(message) {
    if (CaptchaController.isProcessing) return;
    CaptchaController.isProcessing = true;

    try {
        const response = await fetch(message.body);
        const buffer = Buffer.from(await response.arrayBuffer());

        // التحقق من اللون
        const { data, info } = await sharp(buffer).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
        let redPixels = 0;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] > 120 && data[i] > (data[i + 1] + 30) && data[i] > (data[i + 2] + 30)) redPixels++;
        }

        if ((redPixels / (info.width * info.height)) * 100 > 40) {
            // استخراج الاسم
            const worker = await createWorker('ara+eng');
            const { data: { text } } = await worker.recognize(await sharp(buffer).greyscale().threshold(160).toBuffer());
            await worker.terminate();

            if (text.includes(TARGET_PLAYER_NAME)) {
                const code = await solveCaptchaCode(buffer);
                if (code) await client.messaging.sendGroupMessage(message.targetGroupId, `#${code}`);
            }
        }
    } catch (e) { console.error(`[CAPTCHA ERROR] ${e.message}`); }
    CaptchaController.isProcessing = false;
}

async function solveCaptchaCode(buffer) {
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
    const margin = 10;
    const processed = await sharp(buffer)
        .extract({ left: minX + margin, top: minY + margin, width: (maxX - minX) - (margin * 2), height: (maxY - minY) - (margin * 2) })
        .greyscale().normalize().linear(1.5, -0.2).sharpen().toBuffer();
    const worker = await createWorker('eng+ara');
    await worker.setParameters({ tessedit_pageseg_mode: '7' });
    const { data: { text } } = await worker.recognize(processed);
    await worker.terminate();
    return text.replace(/[^a-zA-Z0-9\u0621-\u064A]/g, '').trim();
}

// ==========================================
// 4. المستمع الرئيسي والمشغل
// ==========================================
client.on('groupMessage', async (message) => {
    if (message.sourceSubscriberId !== TARGET_USER_ID) return;

    // معالجة الصناديق
    if (BoxController.waitingForData && message.body.includes('ذهبي:')) {
        BoxController.waitingForData = false;
        await processBoxData(message.body);
    }

    // معالجة الكابتشا
    if (message.type === 'text/image_link') {
        await handleCaptcha(message);
    }
});

client.on('ready', async () => {
    console.log("🚀 البوت متصل ومفعل.");
    
    // تشغيل المهام الدوري
    updateTaskInterval(306000); 
    
    // طلب الصناديق كل 30 دقيقة
    setInterval(requestBoxStatus, 30 * 60 * 1000);
    await requestBoxStatus();
});

client.login(process.env.U_MAIL, process.env.U_PASS);
