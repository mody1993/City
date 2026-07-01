import 'dotenv/config';
import wolfjs from 'wolf.js';

const { WOLF } = wolfjs;

// ================== 🎛️ CONTROL PANEL (المتحكم الرئيسي) ==================

// 1. الإعدادات الرئيسية الافتراضية للعب (الغرفة الرئيسية)
const MAIN_ROOM = {
  channelId: 569,
 targetUserId: 84520028  // مرسل الكابتشا الرئيسي للعب
};

// 2. إعدادات الغرفة الفرعية/الثانية للعب
const SECOND_ROOM = {
     channelId: 13219769,
     targetUserId: 76023171  // مرسل الكابتشا الثاني للعب
};

// 3. 🎯 قنوات وغرفة فحص الصناديق الجديدة
const CHECK_ROOM = {
    channelId: 18654218,     // رقم قناة الفحص الخاصة بك
    targetUserId: 76023242   // معرف حساب اللعبة (المرسل) في قناة الفحص
};

// 4. أسماء الحسابات التي تريد نقلها للغرفة الثانية في اللعب
const SPECIAL_ROOM_USERS = [];
const specialUsersSet = new Set(SPECIAL_ROOM_USERS);

// =========================================================================

// ================== ACCOUNTS LIST (مصفوفة الحسابات والأوامر الخاصة بها) ==================
const ACCOUNTS = [
    { email: process.env.U_MAIL_1,  password: process.env.U_PASS_1,  allowedPlayers: ['King'],   cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_2,  password: process.env.U_PASS_2,  allowedPlayers: ['KSA'],    cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_3,  password: process.env.U_PASS_3,  allowedPlayers: ['MKH'],    cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_4,  password: process.env.U_PASS_4,  allowedPlayers: ['SAA'],    cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_5,  password: process.env.U_PASS_5,  allowedPlayers: ['JDH'],    cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_6,  password: process.env.U_PASS_6,  allowedPlayers: ['MLK'],    cmd: '!مد تحالف ايداع كل' }, 
    { email: process.env.U_MAIL_7,  password: process.env.U_PASS_7,  allowedPlayers: ['CRN'],    cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_8,  password: process.env.U_PASS_8,  allowedPlayers: ['REX'],    cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_9,  password: process.env.U_PASS_9,  allowedPlayers: ['LRD'],    cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_10, password: process.env.U_PASS_10, allowedPlayers: ['ROY'],    cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_11, password: process.env.U_PASS_11, allowedPlayers: ['EMP'],    cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_12, password: process.env.U_PASS_12, allowedPlayers: ['NOR'],    cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_13, password: process.env.U_PASS_13, allowedPlayers: ['Passion'], cmd: '!مد تحالف ايداع كل' }
];

// دالة الانتظار الموحدة
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ================== BOT FACTORY ==================
function createBot(config) {
    const client = new WOLF();
    const PLAY_CHANNEL_ID = config.channelId; 
    const botName = config.allowedPlayers[0];  
    const playCommand = config.cmd; 
    
    let globalTimer = 0;  
    let isTimeDeviceActive = false; 

    // ================== BOX PROCESSING (قناة الفحص) ==================
    async function processBox(g, s, b, points, notReady) {
        const send = async (cmd) => {
            await client.messaging.sendGroupMessage(CHECK_ROOM.channelId, cmd);
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
            if (need >= 4 && g > 0) {
                await send('!مد صندوق فتح ذهبي');
                g--; need -= 4;
            } else if (need >= 2 && s > 0) {
                await send('!مد صندوق فتح فضي');
                s--; need -= 2;
            } else if (need >= 1 && b > 0) {
                await send('!مد صندوق فتح برونزي');
                b--; need -= 1;
            } else {
                break;
            }
        }
    }

    // دالة فرعية لجلب حالة الصناديق وانتظار رد السيرفر بدقة
    async function getBoxStatus(attempt = 1) {
        return new Promise((resolve) => {
            client.messaging.sendGroupMessage(CHECK_ROOM.channelId, '!مد صندوق');
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

    // ================== ADVANCED MECHANICAL BOX CHECK (الفحص الميكانيكي المطور) ==================
    async function sendBoxCommand() {
        console.log(`[${botName}] 🔍 [المرحلة 1] جاري إرسال أمر الفحص الكلي (!مد صندوق) وتحليل الرد...`);
        
        // 1. إرسال الفحص الأول وتحليله
        const firstReply = await getBoxStatus();
        if (!firstReply) {
            console.log(`[${botName}] 🚨 فشل الفحص الأول بسبب تعليق اللعبة! فرض وضع الأمان (63 ثانية)...`);
            globalTimer = 63; 
            isTimeDeviceActive = true; 
            return;
        }

        // 2. إرسال أمر ضمان الوقت فوراً بعد تحليل الرد الأول
        console.log(`[${botName}] ⏱️ [المرحلة 2] إرسال أمر ضمان الوقت (!مد صندوق ضمان وقت)...`);
        await client.messaging.sendGroupMessage(CHECK_ROOM.channelId, '!مد صندوق ضمان وقت');
        await sleep(3000); // انتظار 3 ثوانٍ لضمان معالجة الأمر في السيرفر

        // 3. إرسال أمر !مد صندوق للمرة الثانية لتحديث الحالات الحقيقية بعد الضمان
        console.log(`[${botName}] 🔍 [المرحلة 3] إرسال أمر الفحص الثاني (!مد صندوق) لتحديث البيانات...`);
        const secondReply = await getBoxStatus();
        if (!secondReply) {
            console.log(`[${botName}] 🚨 فشل الفحص الثاني بعد الضمان! فرض وضع الأمان (63 ثانية)...`);
            globalTimer = 63; 
            isTimeDeviceActive = true; 
            return;
        }

        // 4. تحليل الرد الثاني لفتح الصناديق للوصول لنقطة الأمان (42) وإعادة ضبط المؤقت
        const cleanBody = secondReply.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '');
        const lines = cleanBody.split('\n');
        
        const guaranteeLine = lines.find(l => l.includes('الضمان') && !l.includes('نقاط'));
        const isGuaranteeReady = guaranteeLine ? guaranteeLine.includes('جاهز') : false;
        const notReady = !isGuaranteeReady; 

        const boxes = cleanBody.match(/برونزي:\s*(\d+)\s*\|\s*فضي:\s*(\d+)\s*\|\s*ذهبي:\s*(\d+)/);
        const pointsMatch = cleanBody.match(/نقاط الضمان:\s*(\d+)\/50/);

        const g = boxes ? parseInt(boxes[3], 10) : 0;
        const s = boxes ? parseInt(boxes[2], 10) : 0;
        const b = boxes ? parseInt(boxes[1], 10) : 0;
        const p = pointsMatch ? parseInt(pointsMatch[1], 10) : 0;

        // فتح الصناديق بناءً على البيانات المحدثة
        await processBox(g, s, b, p, notReady);

        // إعادة ضبط المؤقت الذكي بناءً على الوقت المتبقي في اللعبة
        const timerLine = lines.find(l => l.includes('الجهاز الزمني'));
        let tempSeconds = 0;

        if (timerLine) {
            if (timerLine.includes('غير نشط')) {
                console.log(`[${botName}] ⏳ الجهاز غير نشط. لعب آمن وفحص بعد 10 دقائق...`);
                tempSeconds = 600; 
                isTimeDeviceActive = false;
            } else if (timerLine.includes('موقوف')) {
                console.log(`[${botName}] 🎛️ الجهاز موقوف! تشغيل فوري...`);
                await client.messaging.sendGroupMessage(CHECK_ROOM.channelId, '!مد تشغيل');
                
                const h = timerLine.match(/(\d+)س/);
                const m = timerLine.match(/(\d+)د/);
                const sMatch = timerLine.match(/(\d+)ث/);

                if (h) tempSeconds += parseInt(h[1], 10) * 3600;
                if (m) tempSeconds += parseInt(m[1], 10) * 60;
                if (sMatch) tempSeconds += parseInt(sMatch[1], 10);
                
                tempSeconds = tempSeconds > 0 ? tempSeconds + 60 : 63; 
                isTimeDeviceActive = true;
            } else {
                // الجهاز نشط ويعمل -> قراءة التوقيت التنازلي المتبقي بدقة
                const h = timerLine.match(/(\d+)س/);
                const m = timerLine.match(/(\d+)د/);
                const sMatch = timerLine.match(/(\d+)ث/);

                if (h) tempSeconds += parseInt(h[1], 10) * 3600;
                if (m) tempSeconds += parseInt(m[1], 10) * 60;
                if (sMatch) tempSeconds += parseInt(sMatch[1], 10);
                
                tempSeconds += 60; // دقيقة أمان فوق التوقيت المتبقي
                isTimeDeviceActive = true;
            }
        }

        globalTimer = tempSeconds;
        console.log(`[${botName}] ⏱️ معالجة الفحص الميكانيكي تمت -> المؤقت القادم: ${globalTimer} ثانية.`);
    }

    // ================== 🎮 LOOP 1: PLAYING ROOM (دورة غرف اللعب التلقائية) ==================
    async function playLoop() {
        while (true) {
            try {
                await client.messaging.sendGroupMessage(PLAY_CHANNEL_ID, '!مد مهام');
                await sleep(2000);

                await client.messaging.sendGroupMessage(PLAY_CHANNEL_ID, playCommand);
                
                if (isTimeDeviceActive) {
                    await sleep(61000); 
                } else {
                    console.log(`[${botName}] ⚠️ الجهاز الزمني غير نشط! وضع الأمان لدورة اللعب (كل 5 دقائق و 3 ثوانٍ)...`);
                    await sleep(301000); 
                }
            } catch (e) {
                console.error(`[${botName}] ❌ خطأ في دورة اللعب:`, e.message);
                await sleep(5000);
            }
        }
    }

    // ================== 📦 LOOP 2: FIVE MINUTE OPEN (دورة الفتح الدوري كل 5 دقائق) ==================
    async function openBoxLoop() {
        while (true) {
            try {
                console.log(`[${botName}] 📦 إرسال أمر الفتح الدوري (!مد صندوق فتح) في قناة الفحص...`);
                await client.messaging.sendGroupMessage(CHECK_ROOM.channelId, '!مد صندوق فتح');
                await sleep(500000); 
            } catch (e) {
                console.error(`[${botName}] ❌ خطأ في دورة الفتح الدوري:`, e.message);
                await sleep(5000);
            }
        }
    }

    // ================== ⏱️ LOOP 3: INTELLIGENT CHECK (دورة الفحص الدوري المنظم) ==================
    async function checkLoop() {
        while (true) {
            try {
                if (globalTimer > 0) {
                    console.log(`[${botName}] ⏱️ ارتباط ذكي: البوت ينام لـ ${globalTimer} ثانية تزامناً مع انتهاء حالة الفحص السابقة...`);
                    await sleep(globalTimer * 1000); 
                } else {
                    await sleep(600000); 
                }
                
                await sendBoxCommand();

            } catch (e) {
                console.error(`[${botName}] ❌ خطأ في دورة الفحص:`, e.message);
                await sleep(5000);
            }
        }
    }

    // ================== 🥷 LOOP 4: STEAL LOOP (دورة السرقة والإيداع كل 3 دقائق و 3 ثواني) ==================
    async function stealLoop() {
        while (true) {
            try {
                console.log(`[${botName}] 🥷 إرسال أمر السرقة التلقائي (!مد اسرق) في غرفة اللعب...`);
                await client.messaging.sendGroupMessage(PLAY_CHANNEL_ID, '!مد اسرق');
                
                await sleep(3000); 

                console.log(`[${botName}] 💰 إرسال أمر إيداع التحالف (!مد تحالف ايداع كل) في غرفة اللعب...`);
                await client.messaging.sendGroupMessage(PLAY_CHANNEL_ID, '!مد تحالف ايداع كل');
                
                await sleep(180000); 
            } catch (e) {
                console.error(`[${botName}] ❌ خطأ في دورة السرقة:`, e.message);
                await sleep(5000);
            }
        }
    }

    // ================== EVENTS (تسلسل أوامر التشغيل بالتتابع الصارم) ==================
    client.on('ready', async () => {
        console.log(`✅ الحساب [${botName}] شبك بنجاح! اللعب في [${PLAY_CHANNEL_ID}] | الفحص في [${CHECK_ROOM.channelId}]`);
        
        try {
            console.log(`[${botName}] 🚀 بدء تنفيذ تسلسل أوامر التشغيل بالتتابع...`);
            
            // 1. قناة الفحص أولاً
            await client.messaging.sendGroupMessage(CHECK_ROOM.channelId, '!مد تشغيل');
            await sleep(3000);
            
            await client.messaging.sendGroupMessage(CHECK_ROOM.channelId, '!مد صندوق ضمان وقت');
            await sleep(3000);
            
            // 2. قناة اللعب
            await client.messaging.sendGroupMessage(PLAY_CHANNEL_ID, '!مد مهام');
            await sleep(3000);
            
            await client.messaging.sendGroupMessage(PLAY_CHANNEL_ID, playCommand);
            await sleep(3000);
            
            // 3. إطلاق أمر الفحص الميكانيكي الأول المطور
            await sendBoxCommand();
            
            // 4. انطلاق الدورات التزامنية بكفاءة واستقرار تام
            playLoop();
            openBoxLoop();
            checkLoop();
            stealLoop(); 

            // 5. 🛑 مؤقت الأمان للإيقاف التلقائي بعد 5 ساعات و 58 دقيقة
            setTimeout(async () => {
                console.log(`[${botName}] 🛑 مضت 5 ساعات و 58 دقيقة! إرسال أمر (!مد ايقاف) في قناة الفحص...`);
                try {
                    await client.messaging.sendGroupMessage(CHECK_ROOM.channelId, '!مد ايقاف');
                } catch (stopErr) {
                    console.error(`[${botName}] خطأ أثناء إرسال أمر الإيقاف:`, stopErr.message);
                }
            }, 21480000);

        } catch (err) {
            console.error(`[${botName}] ❌ خطأ تهيئة البوت:`, err.message);
        }
    });

    client.login(config.email, config.password);
}

// ================== START MULTI ACCOUNTS WITH AUTO-ROUTING ==================
ACCOUNTS.forEach((acc, i) => {
    const playerName = acc.allowedPlayers[0];
    const roomSettings = specialUsersSet.has(playerName) ? SECOND_ROOM : MAIN_ROOM;

    const finalConfig = {
        ...acc,
        channelId: roomSettings.channelId,
        targetUserId: roomSettings.targetUserId
    };

    setTimeout(() => {
        createBot(finalConfig);
    }, i * 15000); 
});
