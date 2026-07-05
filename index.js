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
     channelId: 18654218,
     targetUserId: 76023242   // معرف حساب اللعبة (المرسل) في قناة الفحص
};

// 4. أسماء الحسابات التي تريد نقلها للغرفة الثانية في اللعب
const SPECIAL_ROOM_USERS = [];
const specialUsersSet = new Set(SPECIAL_ROOM_USERS);

// =========================================================================

// ================== ACCOUNTS LIST (مصفوفة الحسابات والأوامر الخاصة بها) ==================
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

    // مستمع لأخطاء الحساب والاتصال لتكشف سبب اختفاء أي حساب
    client.on('error', (err) => {
        console.error(`🚨 [${botName}] خطأ في الاتصال أو الحساب:`, err.message || err);
    });

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
        console.log(`[${botName}] 🔍 [المرحلة 1] جاري إرسال أمر الفحص...`);
        const firstReply = await getBoxStatus();
        
        if (!firstReply) {
            console.log(`[${botName}] 🚨 فشل الفحص (السيرفر لا يرد)! دورة اللعب مستمرة، لكن الفحص سيدخل في وضع الأمان (5 دقائق)...`);
            globalTimer = 300; 
            return;
        }

        let cleanBody = firstReply.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '');
        let lines = cleanBody.split('\n');
        let timerLine = lines.find(l => l.includes('الجهاز الزمني'));

        let stateChanged = false;

        // التحقق من حالة الجهاز الزمني واتخاذ قرار التنشيط
        if (timerLine) {
            if (timerLine.includes('موقوف')) {
                console.log(`[${botName}] 🎛️ الجهاز موقوف! إرسال أمر تشغيل...`);
                await client.messaging.sendGroupMessage(CHECK_ROOM.channelId, '!مد تشغيل');
                await sleep(3000);
                stateChanged = true;
            } else if (timerLine.includes('غير نشط')) {
                console.log(`[${botName}] ⏳ الجهاز غير نشط! إرسال أمر ضمان وقت...`);
                await client.messaging.sendGroupMessage(CHECK_ROOM.channelId, '!مد صندوق ضمان وقت');
                await sleep(3000);
                stateChanged = true;
            }
        }

        let finalReply = firstReply;
        
        // إذا تم تنشيط الجهاز، نفحص مرة ثانية لنحصل على الوقت الفعلي
        if (stateChanged) {
            console.log(`[${botName}] 🔍 [المرحلة 2] تحديث البيانات بعد التنشيط...`);
            finalReply = await getBoxStatus();
            if (!finalReply) {
                console.log(`[${botName}] 🚨 فشل الفحص الثاني! وضع الأمان للفحص (5 دقائق)...`);
                globalTimer = 300;
                return;
            }
            cleanBody = finalReply.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '');
            lines = cleanBody.split('\n');
            timerLine = lines.find(l => l.includes('الجهاز الزمني'));
        }

        // تحليل الرد لفتح الصناديق
        const guaranteeLine = lines.find(l => l.includes('الضمان') && !l.includes('نقاط'));
        const isGuaranteeReady = guaranteeLine ? guaranteeLine.includes('جاهز') : false;
        const notReady = !isGuaranteeReady; 

        const boxes = cleanBody.match(/برونزي:\s*(\d+)\s*\|\s*فضي:\s*(\d+)\s*\|\s*ذهبي:\s*(\d+)/);
        const pointsMatch = cleanBody.match(/نقاط الضمان:\s*(\d+)\/50/);

        const g = boxes ? parseInt(boxes[3], 10) : 0;
        const s = boxes ? parseInt(boxes[2], 10) : 0;
        const b = boxes ? parseInt(boxes[1], 10) : 0;
        const p = pointsMatch ? parseInt(pointsMatch[1], 10) : 0;

        await processBox(g, s, b, p, notReady);

        // قراءة التوقيت وتسجيله بدقة مع 5 ثواني أمان
        let tempSeconds = 0;
        if (timerLine) {
            if (timerLine.includes('غير نشط') || timerLine.includes('موقوف')) {
                tempSeconds = 300; // أمان في حال عدم التنشيط لسبب ما
                isTimeDeviceActive = false;
            } else {
                const h = timerLine.match(/(\d+)س/);
                const m = timerLine.match(/(\d+)د/);
                const sMatch = timerLine.match(/(\d+)ث/);

                if (h) tempSeconds += parseInt(h[1], 10) * 3600;
                if (m) tempSeconds += parseInt(m[1], 10) * 60;
                if (sMatch) tempSeconds += parseInt(sMatch[1], 10);
                
                tempSeconds += 5; // 5 ثواني أمان فوق التوقيت المتبقي
                isTimeDeviceActive = true;
            }
        }

        globalTimer = tempSeconds > 0 ? tempSeconds : 300;
        console.log(`[${botName}] ⏱️ الفحص انتهى -> دورة الفحص القادمة بعد: ${globalTimer} ثانية.`);
    }

    // ================== 🎮 ACTION LOOP (الدورة الموحدة: مهام - لعب - سرقة - إيداع) ==================
    async function mainActionLoop() {
        let minuteCounter = 0;
        while (true) {
            try {
                minuteCounter++;

                if (minuteCounter === 3) {
                    console.log(`[${botName}] 🥷 الدقيقة [3]: إرسال (مهام + سرقة + إيداع)...`);
                    
                    await client.messaging.sendGroupMessage(PLAY_CHANNEL_ID, '!مد مهام');
                    await sleep(2000);

                    await client.messaging.sendGroupMessage(PLAY_CHANNEL_ID, '!مد اسرق');
                    await sleep(2000);

                    await client.messaging.sendGroupMessage(PLAY_CHANNEL_ID, playCommand);
                    
                    minuteCounter = 0; 
                } else {
                    console.log(`[${botName}] 🔄 الدقيقة [${minuteCounter}]: إرسال (مهام + إيداع)...`);
                    
                    await client.messaging.sendGroupMessage(PLAY_CHANNEL_ID, '!مد مهام');
                    await sleep(2000);

                    await client.messaging.sendGroupMessage(PLAY_CHANNEL_ID, playCommand);
                }

                await sleep(61000); 

            } catch (e) {
                console.error(`[${botName}] ❌ خطأ في الدورة الموحدة:`, e.message);
                await sleep(5000);
            }
        }
    }

    // ================== 📦 LOOP 2: FIVE MINUTE OPEN (دورة الفتح الدوري) ==================
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
                    console.log(`[${botName}] ⏱️ ارتباط ذكي: دورة الفحص تنام لـ ${globalTimer} ثانية...`);
                    await sleep(globalTimer * 1000); 
                } else {
                    await sleep(300000); 
                }
                
                await sendBoxCommand();

            } catch (e) {
                console.error(`[${botName}] ❌ خطأ في دورة الفحص:`, e.message);
                await sleep(5000);
            }
        }
    }

    // ================== EVENTS (تسلسل أوامر التشغيل بالتتابع) ==================
    client.on('ready', async () => {
        console.log(`✅ الحساب [${botName}] شبك بنجاح! اللعب في [${PLAY_CHANNEL_ID}] | الفحص في [${CHECK_ROOM.channelId}]`);
        
        try {
            // [تعديل جوهري] 1. دخول الغرف تلقائياً لضمان عدم تعليق الأوامر
            try {
                await client.group.join(PLAY_CHANNEL_ID);
                await client.group.join(CHECK_ROOM.channelId);
                console.log(`[${botName}] 🚪 دخل الغرف بنجاح.`);
            } catch (joinErr) {
                console.warn(`[${botName}] ⚠️ تنبيه أثناء دخول الغرف تلقائياً:`, joinErr.message);
            }

            console.log(`[${botName}] 🚀 بدء تشغيل الدورات بشكل متوازٍ ومستقل...`);
            
            // [تعديل جوهري] 2. تشغيل الدورات بدون إعاقة (Non-blocking) لكي لا يتعطل اللعب إذا علق الفحص
            mainActionLoop();
            openBoxLoop();
            checkLoop();

            // إطلاق الفحص الأول بشكل مستقل
            sendBoxCommand().catch(err => console.error(`[${botName}] خطأ في فحص الصناديق الأولي:`, err.message));

            // 🛑 مؤقت الأمان للإيقاف التلقائي بعد 5 ساعات و 58 دقيقة
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
