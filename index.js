import 'dotenv/config';
import wolfjs from 'wolf.js';

const { WOLF } = wolfjs;

// ================== 🎛️ CONTROL PANEL (المتحكم الرئيسي) ==================

const MAIN_ROOM = {
    channelId: 569,
    targetUserId: 84520028 
};

const SECOND_ROOM = {
    channelId: 13219769,
    targetUserId: 76023171 
};

const CHECK_ROOM = {
    channelId: 18654218,
    targetUserId: 76023242 
};

const SPECIAL_ROOM_USERS = [];
const specialUsersSet = new Set(SPECIAL_ROOM_USERS);

// ================== ACCOUNTS LIST ==================
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

// ================== BOT FACTORY ==================
function createBot(config) {
    const client = new WOLF();
    const PLAY_CHANNEL_ID = config.channelId; 
    const botName = config.allowedPlayers[0];  
    const playCommand = config.cmd; 
    
    let globalTimer = 0;  
    let isTimeDeviceActive = false; 

    // ================== BOX PROCESSING ==================
    async function processBox(g, s, b, points, notReady) {
        const send = async (cmd) => {
            await client.messaging.sendMessage(CHECK_ROOM.channelId, cmd);
            await sleep(2000); 
        };

        if (notReady) {
            while (g > 0) { await send('!مد صندوق فتح ذهبي'); g--; }
            while (s > 0) { await send('!مد صندوق فتح فضي'); s--; }
            while (b > 0) { await send('!مد صندوق فتح برونزي'); b--; }
            return;
        }

        let need = Math.max(0, 42 - points);
        while (need > 0) {
            if (need >= 4 && g > 0) { await send('!مد صندوق فتح ذهبي'); g--; need -= 4; } 
            else if (need >= 2 && s > 0) { await send('!مد صندوق فتح فضي'); s--; need -= 2; } 
            else if (need >= 1 && b > 0) { await send('!مد صندوق فتح برونزي'); b--; need -= 1; } 
            else { break; }
        }
    }

    async function getBoxStatus(attempt = 1) {
        return new Promise((resolve) => {
            client.messaging.sendMessage(CHECK_ROOM.channelId, '!مد صندوق');
            let isResolved = false;

            const handler = async (message) => {
                if (
                    message.sourceSubscriberId === CHECK_ROOM.targetUserId &&
                    message.targetGroupId === CHECK_ROOM.channelId &&
                    typeof message.body === 'string' &&
                    message.body.startsWith('/me 📦 حالة الصناديق')
                ) {
                    isResolved = true;
                    client.removeListener('groupMessage', handler);
                    clearTimeout(fallbackTimeout);
                    resolve(message.body);
                }
            };

            client.on('groupMessage', handler);

            const fallbackTimeout = setTimeout(async () => {
                if (isResolved) return;
                client.removeListener('groupMessage', handler);

                if (attempt < 3) {
                    console.log(`[${botName}] ⚠️ تعليق في الفحص! إعادة المحاولة رقم ${attempt}...`);
                    await sleep(4000);
                    resolve(await getBoxStatus(attempt + 1)); 
                } else {
                    resolve(null);
                }
            }, 12000);
        });
    }

    // ================== ADVANCED BOX CHECK ==================
    async function sendBoxCommand() {
        console.log(`[${botName}] 🔍 [المرحلة 1] جاري إرسال أمر الفحص...`);
        const firstReply = await getBoxStatus();
        
        if (!firstReply) {
            console.log(`[${botName}] 🚨 فشل الفحص! وضع الأمان (5 دقائق)...`);
            globalTimer = 300; 
            return;
        }

        let cleanBody = firstReply.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '');
        let lines = cleanBody.split('\n');
        let timerLine = lines.find(l => l.includes('الجهاز الزمني'));

        let stateChanged = false;

        if (timerLine) {
            if (timerLine.includes('موقوف')) {
                console.log(`[${botName}] 🎛️ الجهاز موقوف! إرسال أمر تشغيل...`);
                await client.messaging.sendMessage(CHECK_ROOM.channelId, '!مد تشغيل');
                await sleep(3000);
                stateChanged = true;
            } else if (timerLine.includes('غير نشط')) {
                console.log(`[${botName}] ⏳ الجهاز غير نشط! إرسال أمر ضمان وقت...`);
                await client.messaging.sendMessage(CHECK_ROOM.channelId, '!مد صندوق ضمان وقت');
                await sleep(3000);
                stateChanged = true;
            }
        }

        let finalReply = firstReply;
        
        if (stateChanged) {
            console.log(`[${botName}] 🔍 [المرحلة 2] تحديث البيانات بعد التنشيط...`);
            finalReply = await getBoxStatus();
            if (!finalReply) {
                globalTimer = 300;
                return;
            }
            cleanBody = finalReply.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '');
            lines = cleanBody.split('\n');
            timerLine = lines.find(l => l.includes('الجهاز الزمني'));
        }

        const guaranteeLine = lines.find(l => l.includes('الضمان') && !l.includes('نقاط'));
        const notReady = guaranteeLine ? !guaranteeLine.includes('جاهز') : true; 

        const boxes = cleanBody.match(/برونزي:\s*(\d+)\s*\|\s*فضي:\s*(\d+)\s*\|\s*ذهبي:\s*(\d+)/);
        const pointsMatch = cleanBody.match(/نقاط الضمان:\s*(\d+)\/50/);

        const g = boxes ? parseInt(boxes[3], 10) : 0;
        const s = boxes ? parseInt(boxes[2], 10) : 0;
        const b = boxes ? parseInt(boxes[1], 10) : 0;
        const p = pointsMatch ? parseInt(pointsMatch[1], 10) : 0;

        await processBox(g, s, b, p, notReady);

        let tempSeconds = 0;
        if (timerLine) {
            if (timerLine.includes('غير نشط') || timerLine.includes('موقوف')) {
                tempSeconds = 300;
                isTimeDeviceActive = false;
            } else {
                const h = timerLine.match(/(\d+)س/);
                const m = timerLine.match(/(\d+)د/);
                const sMatch = timerLine.match(/(\d+)ث/);

                if (h) tempSeconds += parseInt(h[1], 10) * 3600;
                if (m) tempSeconds += parseInt(m[1], 10) * 60;
                if (sMatch) tempSeconds += parseInt(sMatch[1], 10);
                
                tempSeconds += 5; // أمان
                isTimeDeviceActive = true;
            }
        }

        globalTimer = tempSeconds > 0 ? tempSeconds : 300;
        console.log(`[${botName}] ⏱️ الفحص انتهى -> الدورة القادمة بعد: ${globalTimer} ثانية.`);
    }

    // ================== 🎮 MAIN ACTION LOOP ==================
    async function mainActionLoop() {
        let minuteCounter = 0;
        while (true) {
            try {
                minuteCounter++;

                if (minuteCounter === 3) {
                    console.log(`[${botName}] 🥷 الدقيقة [3]: (مهام + سرقة + إيداع)...`);
                    await client.messaging.sendMessage(PLAY_CHANNEL_ID, '!مد مهام');
                    await sleep(2000);
                    await client.messaging.sendMessage(PLAY_CHANNEL_ID, '!مد اسرق');
                    await sleep(2000);
                    await client.messaging.sendMessage(PLAY_CHANNEL_ID, playCommand);
                    minuteCounter = 0; 
                } else {
                    console.log(`[${botName}] 🔄 الدقيقة [${minuteCounter}]: (مهام + إيداع)...`);
                    await client.messaging.sendMessage(PLAY_CHANNEL_ID, '!مد مهام');
                    await sleep(2000);
                    await client.messaging.sendMessage(PLAY_CHANNEL_ID, playCommand);
                }

                await sleep(61000); 

            } catch (e) {
                console.error(`[${botName}] ❌ خطأ الدورة الموحدة:`, e.message);
                await sleep(5000);
            }
        }
    }

    // ================== 📦 BOX OPEN LOOP ==================
    async function openBoxLoop() {
        while (true) {
            try {
                await sleep(500000); 
                console.log(`[${botName}] 📦 الفتح الدوري (!مد صندوق فتح)...`);
                await client.messaging.sendMessage(CHECK_ROOM.channelId, '!مد صندوق فتح');
            } catch (e) {
                await sleep(5000);
            }
        }
    }

    // ================== ⏱️ CHECK LOOP ==================
    async function checkLoop() {
        while (true) {
            try {
                await sleep((globalTimer > 0 ? globalTimer : 300) * 1000); 
                await sendBoxCommand();
            } catch (e) {
                await sleep(5000);
            }
        }
    }

    // ================== EVENTS ==================
    client.on('ready', async () => {
        console.log(`✅ الحساب [${botName}] شبك بنجاح!`);
        
        try {
            // الدخول الإجباري للغرف لمنع التجاهل (Shadowban)
            if (client.channel && typeof client.channel.join === 'function') {
                await client.channel.join(PLAY_CHANNEL_ID);
                await client.channel.join(CHECK_ROOM.channelId);
            } else if (client.group && typeof client.group.join === 'function') {
                await client.group.join(PLAY_CHANNEL_ID);
                await client.group.join(CHECK_ROOM.channelId);
            }
        } catch (joinErr) {}

        try {
            await sendBoxCommand();
            
            mainActionLoop();
            openBoxLoop();
            checkLoop();

            // الإغلاق النهائي الآمن بعد المدة المحددة
            setTimeout(async () => {
                console.log(`[${botName}] 🛑 مضت 5 ساعات و 58 دقيقة! جاري الإيقاف...`);
                try {
                    await client.messaging.sendMessage(CHECK_ROOM.channelId, '!مد ايقاف');
                    await sleep(2000);
                    await client.logout(); // فصل الحساب نهائياً
                } catch (stopErr) {}
            }, 21480000);

        } catch (err) {
            console.error(`[${botName}] ❌ خطأ تهيئة البوت:`, err.message);
        }
    });

    client.login(config.email, config.password);
}

// ================== START ==================
ACCOUNTS.forEach((acc, i) => {
    const playerName = acc.allowedPlayers[0];
    const roomSettings = specialUsersSet.has(playerName) ? SECOND_ROOM : MAIN_ROOM;

    const finalConfig = { ...acc, channelId: roomSettings.channelId, targetUserId: roomSettings.targetUserId };
    
    setTimeout(() => { createBot(finalConfig); }, i * 15000); 
});
