import 'dotenv/config';
import wolfjs from 'wolf.js';
const { WOLF } = wolfjs;
const client = new WOLF();

// --- الإعدادات ---
const TARGET_USER_ID = 76023604;
const CHANNEL_TASKS = 224;

// --- متغيرات النظام (مهمة جداً) ---
let lastKnownState = null; // يبدأ بـ null ليتم التفعيل أول مرة فقط
let b = null; 

// --- دالة المهام ---
async function performTasks() {
    try {
        console.log(`[LOG] 🚀 تنفيذ المهام...`);
        await client.messaging.sendGroupMessage(CHANNEL_TASKS, '!مد مهام');
        await new Promise(r => setTimeout(r, 2000));
        await client.messaging.sendGroupMessage(CHANNEL_TASKS, '!مد تحالف ايداع كل');
    } catch (e) { console.error(`[ERROR] ${e.message}`); }
}

// --- دالة ضبط المؤقت (القلب النابض) ---
function setTimer(isActive) {
    // [القفل]: إذا كانت الحالة الجديدة هي نفس الحالة السابقة، لا تفعل شيئاً
    if (lastKnownState === isActive) return;

    // تحديث الحالة
    lastKnownState = isActive;
    
    // مسح المؤقت القديم
    if (b) clearInterval(b);
    
    // تحديد الوقت الجديد
    let intervalMs = isActive ? 64000 : 306000;
    
    console.log(`[LOG] ✅ تم تغيير الحالة لـ: ${isActive ? "نشط" : "غير نشط"}. ضبط المؤقت على ${intervalMs/1000} ثانية.`);
    
    performTasks(); // تنفيذ فوري
    b = setInterval(performTasks, intervalMs);
}

// --- معالجة الرسائل ---
client.on('groupMessage', async (message) => {
    if (message.sourceSubscriberId !== TARGET_USER_ID) return;

    // تقسيم الرسالة لأسطر
    const lines = message.body.split('\n');
    const timeLine = lines.find(line => line.includes('الجهاز الزمني'));

    if (timeLine) {
        // [المنطق]: إذا كان السطر لا يحتوي "غير نشط"، فهو نشط حتماً
        const isNowActive = !timeLine.includes('غير نشط');
        
        // إرسال الحالة للقفل (سيعمل فقط إذا تغيرت الحالة)
        setTimer(isNowActive);
    }
});

client.on('ready', () => {
    console.log("🚀 البوت متصل ومستعد.");
});

client.login(process.env.U_MAIL, process.env.U_PASS);
