import 'dotenv/config';
import wolfjs from 'wolf.js';

const { WOLF } = wolfjs;

// ================== 🎛️ CONTROL PANEL (المتحكم الرئيسي) ==================

// 1. الإعدادات الرئيسية الافتراضية للعب (الغرفة الرئيسية)
const MAIN_ROOM = {
    channelId: 569,
    targetUserId: 84520028
};

// 2. إعدادات الغرفة الفرعية/الثانية للعب
const SECOND_ROOM = {
     channelId: 13219769,
     targetUserId: 76023171
};

// 3. 🎯 قنوات وغرفة فحص الصناديق (للتشغيل والإيقاف)
const CHECK_ROOM = {
     channelId: 18654218,
     targetUserId: 76023242
};

// 4. أسماء الحسابات التي تريد نقلها للغرفة الثانية في اللعب
const SPECIAL_ROOM_USERS = [];
const specialUsersSet = new Set(SPECIAL_ROOM_USERS);

// =========================================================================

// ================== ACCOUNTS LIST (مصفوفة الحسابات) ==================
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

    // مستمع لأخطاء الحساب والاتصال
    client.on('error', (err) => {
        console.error(`🚨 [${botName}] خطأ في الاتصال أو الحساب:`, err.message || err);
    });

    // ================== 🎮 ACTION LOOP (الدورة الرئيسية) ==================
    async function mainActionLoop() {
        let minuteCounter = 0;
        while (true) {
            try {
                minuteCounter++;

                if (minuteCounter === 3) {
                    console.log(`[${botName}] 🥷 الدقيقة [3]: تشغيل (5ث) -> مهام (2ث) -> اسرق (2ث) -> إيداع (5ث) -> ايقاف...`);
                    
                    // التشغيل في قناة الفحص
                    await client.messaging.sendChannelMessage(CHECK_ROOM.channelId, '!مد تشغيل');
                    await sleep(5000);

                    // المهام والسرقة والإيداع في قناة اللعب
                    await client.messaging.sendChannelMessage(PLAY_CHANNEL_ID, '!مد مهام');
                    await sleep(2000);

                    await client.messaging.sendChannelMessage(PLAY_CHANNEL_ID, '!مد اسرق');
                    await sleep(2000);

                    await client.messaging.sendChannelMessage(PLAY_CHANNEL_ID, playCommand);
                    await sleep(5000); 

                    // الإيقاف في قناة الفحص
                    await client.messaging.sendChannelMessage(CHECK_ROOM.channelId, '!مد ايقاف');
                    
                    minuteCounter = 0; 
                } else {
                    console.log(`[${botName}] 🔄 الدقيقة [${minuteCounter}]: تشغيل (5ث) -> مهام (2ث) -> إيداع (5ث) -> ايقاف...`);
                    
                    // التشغيل في قناة الفحص
                    await client.messaging.sendChannelMessage(CHECK_ROOM.channelId, '!مد تشغيل');
                    await sleep(5000);

                    // المهام والإيداع في قناة اللعب
                    await client.messaging.sendChannelMessage(PLAY_CHANNEL_ID, '!مد مهام');
                    await sleep(2000);

                    await client.messaging.sendChannelMessage(PLAY_CHANNEL_ID, playCommand);
                    await sleep(5000); 

                    // الإيقاف في قناة الفحص
                    await client.messaging.sendChannelMessage(CHECK_ROOM.channelId, '!مد ايقاف');
                }

                await sleep(61000); // انتظار دقيقة للدورة التالية

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
                await client.messaging.sendChannelMessage(CHECK_ROOM.channelId, '!مد صندوق فتح');
                await sleep(500000); // يتكرر كل 8.3 دقائق تقريباً
            } catch (e) {
                console.error(`[${botName}] ❌ خطأ في دورة الفتح الدوري:`, e.message);
                await sleep(5000);
            }
        }
    }

    // ================== EVENTS ==================
    client.on('ready', async () => {
        console.log(`✅ الحساب [${botName}] شبك بنجاح! اللعب في [${PLAY_CHANNEL_ID}] | الفحص في [${CHECK_ROOM.channelId}]`);
        
        try {
            try {
                // دخول الغرف
                await client.channel.join(PLAY_CHANNEL_ID);
                await client.channel.join(CHECK_ROOM.channelId);
                console.log(`[${botName}] 🚪 دخل الغرف بنجاح.`);
            } catch (joinErr) {
                console.warn(`[${botName}] ⚠️ تنبيه أثناء دخول الغرف تلقائياً:`, joinErr.message);
            }

            console.log(`[${botName}] 🚀 بدء تشغيل الدورات بشكل متوازٍ ومستقل...`);
            
            // تشغيل الدورات
            mainActionLoop();
            openBoxLoop();

            // مؤقت الأمان للإغلاق بعد 5 ساعات و 58 دقيقة
            setTimeout(async () => {
                console.log(`[${botName}] 🛑 مضت 5 ساعات و 58 دقيقة! إرسال أمر (!مد ايقاف) في قناة الفحص...`);
                try {
                    await client.messaging.sendChannelMessage(CHECK_ROOM.channelId, '!مد ايقاف');
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

    // تأخير تشغيل كل حساب لتجنب حظر الشبكة
    setTimeout(() => {
        createBot(finalConfig);
    }, i * 15000); 
});
