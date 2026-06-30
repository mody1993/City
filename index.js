import 'dotenv/config';
import wolfjs from 'wolf.js';

const { WOLF } = wolfjs;

// ================== 🎛️ CONTROL PANEL (المتحكم الرئيسي) ==================

// 1. الإعدادات الرئيسية الافتراضية للعب (الغرفة الرئيسية)
const MAIN_ROOM = {
    channelId: 569,         // الغرفة الرئيسية للعب
    targetUserId: 84520028   // مرسل الكابتشا الرئيسي للعب
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

// ================== ACCOUNTS LIST (مصفوفة الحسابات) ==================
const ACCOUNTS = [
    { email: process.env.U_MAIL_1,  password: process.env.U_PASS_1,  allowedPlayers: ['King'] },
    { email: process.env.U_MAIL_2,  password: process.env.U_PASS_2,  allowedPlayers: ['KSA'] },
    { email: process.env.U_MAIL_3,  password: process.env.U_PASS_3,  allowedPlayers: ['MKH'] },
    { email: process.env.U_MAIL_4,  password: process.env.U_PASS_4,  allowedPlayers: ['SAA'] },
    { email: process.env.U_MAIL_5,  password: process.env.U_PASS_5,  allowedPlayers: ['JDH'] },
    { email: process.env.U_MAIL_6,  password: process.env.U_PASS_6,  allowedPlayers: ['MLK'] }, 
    { email: process.env.U_MAIL_7,  password: process.env.U_PASS_7,  allowedPlayers: ['CRN'] },
    { email: process.env.U_MAIL_8,  password: process.env.U_PASS_8,  allowedPlayers: ['REX'] },
    { email: process.env.U_MAIL_9,  password: process.env.U_PASS_9,  allowedPlayers: ['LRD'] },
    { email: process.env.U_MAIL_10, password: process.env.U_PASS_10, allowedPlayers: ['ROY'] },
    { email: process.env.U_MAIL_11, password: process.env.U_PASS_11, allowedPlayers: ['EMP'] },
    { email: process.env.U_MAIL_12, password: process.env.U_PASS_12, allowedPlayers: ['NOR'] },
    { email: process.env.U_MAIL_13, password: process.env.U_PASS_13, allowedPlayers: ['Passion'] }
];

// دالة الانتظار الموحدة
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ================== BOT FACTORY ==================
function createBot(config) {
    const client = new WOLF();
    const PLAY_CHANNEL_ID = config.channelId; 
    const botName = config.allowedPlayers[0];  
    
    // تخصيص الأمر الخاص بالحساب رقم 6 (MLK) تلقائياً بناءً على طلبك السابق
    const depositCommand = botName === 'MLK' ? '!مد هدية 38770375 كل' : '!مد تحالف ايداع كل';
    
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

    // ================== BOX CHECK WITH RETRY ON HANG (فحص التزامن مع نظام إعادة المحاولة) ==================
    async function sendBoxCommand(attempt = 1) {
        return new Promise((resolve) => {
            console.log(`[${botName}] 🔍 [محاولة ${attempt}] جاري إرسال أمر (!مد صندوق) وفحص التزامن...`);
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

                    const body = message.body;
                    const lines = body.split('\n');
                    
                    const isGuaranteeReady = lines.some(l => l.includes('حالة الضمان') && l.includes('جاهز'));
                    const notReady = !isGuaranteeReady; 

                    const boxes = body.match(/برونزي:\s*(\d+)\s*\|\s*فضي:\s*(\d+)\s*\|\s*ذهبي:\s*(\d+)/);
                    const pointsMatch = body.match(/نقاط الضمان:\s*(\d+)\/50/);

                    const g = boxes ? parseInt(boxes[3], 10) : 0;
                    const s = boxes ? parseInt(boxes[2], 10) : 0;
                    const b = boxes ? parseInt(boxes[1], 10) : 0;
                    const p = pointsMatch ? parseInt(pointsMatch[1], 10) : 0;

                    await processBox(g, s, b, p, notReady);

                    const timerLine = lines.find(l => l.includes('الجهاز الزمني'));
                    let tempSeconds = 0;

                    if (timerLine) {
                        if (timerLine.includes('موقوف')) {
                            await client.messaging.sendGroupMessage(CHECK_ROOM.channelId, '!مد تشغيل');
                            tempSeconds = 63;
                            isTimeDeviceActive = true; 
                        } else if (timerLine.includes('غير نشط')) {
                            if (isGuaranteeReady) {
                                console.log(`[${botName}] 🎯 الجهاز الزمني غير نشط ولكن الضمان جاهز قطعيّاً! إرسال أمر تفعيل ضمان الوقت فوراً...`);
                                await client.messaging.sendGroupMessage(CHECK_ROOM.channelId, '!مد صندوق ضمان وقت');
                                tempSeconds = 63; 
                                isTimeDeviceActive = true;
                            } else {
                                console.log(`[${botName}] ⏳ الجهاز الزمني غير نشط والضمان غير جاهز فعلياً. خمول مبرمج لمدة ساعة.`);
                                tempSeconds = 0;
                                isTimeDeviceActive = false; 
                            }
                        } else {
                            const h = timerLine.match(/(\d+)س/);
                            const m = timerLine.match(/(\d+)د/);
                            const sMatch = timerLine.match(/(\d+)ث/);

                            if (h) tempSeconds += parseInt(h[1], 10) * 3600;
                            if (m) tempSeconds += parseInt(m[1], 10) * 60;
                            if (sMatch) tempSeconds += parseInt(sMatch[1], 10);
                            
                            isTimeDeviceActive = true; 
                        }
                    }

                    globalTimer = tempSeconds;
                    console.log(`[${botName}] ⏱️ تم قراءة البيانات بنجاح -> نشط: ${isTimeDeviceActive} | الوقت المتبقي للجهاز الزمني: ${globalTimer} ثانية.`);
                    resolve();
                }
            };

            client.on('groupMessage', handler);

            const fallbackTimeout = setTimeout(async () => {
                if (isResolved) return;
                client.removeListener('groupMessage', handler);

                // 🌟 إذا علّق البوت ولم يرسل الحالة، يعيد المحاولة حتى 3 مرات قبل الاستسلام
                if (attempt < 3) {
                    console.log(`[${botName}] ⚠️ تعليق في السيرفر! لم يتم استلام رد الفحص (المحاولة ${attempt}). إعادة المحاولة مجدداً بعد 4 ثوانٍ...`);
                    await sleep(4000);
                    resolve(await sendBoxCommand(attempt + 1)); 
                } else {
                    console.log(`[${botName}] 🚨 فشلت 3 محاولات فحص بسبب تعليق اللعبة! فرض وضع الأمان التلقائي المؤقت (63 ثانية)...`);
                    globalTimer = 63; 
                    isTimeDeviceActive = true; 
                    resolve();
                }
            }, 12000);
        });
    }

    // ================== 🎮 LOOP 1: PLAYING ROOM (دورة غرف اللعب التلقائية) ==================
    async function playLoop() {
        while (true) {
            try {
                await client.messaging.sendGroupMessage(PLAY_CHANNEL_ID, '!مد مهام');
                await sleep(2000);

                await client.messaging.sendGroupMessage(PLAY_CHANNEL_ID, depositCommand);
                
                if (isTimeDeviceActive) {
                    await sleep(61000); 
                } else {
                    console.log(`[${botName}] ⚠️ الجهاز الزمني غير نشط! تشغيل وضع الأمان لدورة اللعب (كل 5 دقائق و 1 ثانية)...`);
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
                await sleep(300000); 
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
                    console.log(`[${botName}] ⏱️ ارتباط ذكي: البوت ينام لـ ${globalTimer} ثانية تزامناً مع انتهاء وقت الجهاز الزمني...`);
                    await sleep(globalTimer * 1000); 
                } else {
                    console.log(`[${botName}] ⏳ الجهاز الزمني غير نشط تماماً. الانتظار لـ (60 دقيقة) للفحص الدوري القادم...`);
                    await sleep(3600000); 
                }
                
                await sendBoxCommand();

            } catch (e) {
                console.error(`[${botName}] ❌ خطأ في دورة الفحص:`, e.message);
                await sleep(5000);
            }
        }
    }

    // ================== EVENTS (نظام التتابع والتشغيل المطور) ==================
    client.on('ready', async () => {
        console.log(`✅ الحساب [${botName}] شبك بنجاح! اللعب في [${PLAY_CHANNEL_ID}] | الفحص في [${CHECK_ROOM.channelId}]`);
        
        try {
            console.log(`[${botName}] 🚀 بدء تنفيذ تسلسل أوامر التشغيل بالتتابع...`);
            
            // 1. قناة الفحص: تشغيل الأجهزة الأساسية وضمان الوقت أولاً
            await client.messaging.sendGroupMessage(CHECK_ROOM.channelId, '!مد تشغيل');
            await sleep(3000);
            
            await client.messaging.sendGroupMessage(CHECK_ROOM.channelId, '!مد صندوق ضمان وقت');
            await sleep(3000);
            
            // 2. قناة اللعب: تفعيل المهام والإيداع/الهدية فور التشغيل مباشرة
            await client.messaging.sendGroupMessage(PLAY_CHANNEL_ID, '!مد مهام');
            await sleep(3000);
            
            await client.messaging.sendGroupMessage(PLAY_CHANNEL_ID, depositCommand);
            await sleep(3000);
            
            // 3. قناة الفحص: إطلاق أمر قراءة حالة الصناديق الرئيسي (مع الفحص والـ Retry الذكي للتعليق)
            await sendBoxCommand();
            
            // 4. انطلاق الدورات الثلاث التزامنية بكفاءة واستمرارية تامة
            playLoop();
            openBoxLoop();
            checkLoop();

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
