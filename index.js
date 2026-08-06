import 'dotenv/config';
import wolfjs from 'wolf.js';

const { WOLF } = wolfjs;

// إعدادات البوت المشتركة
const settings = {
    targetBotId: 39369782, // بوت قراند
    actionWord: "!اسرق 5",
    delayBetweenHeists: 11000,      // 11 ثانية فاصل بين الصيد
    workDuration: 54 * 60 * 1000,   // 54 دقيقة عمل
    restDuration: 6 * 60 * 1000     // 6 دقائق راحة
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// إنشاء Class لكل حساب لضمان عدم تداخل البيانات والطوابير
class GrandBot {
    constructor(email, password, index) {
        this.email = email;
        this.password = password;
        this.index = index; // رقم الحساب للتمييز في الكونسول
        this.service = new WOLF();
        
        // متغيرات خاصة بكل حساب
        this.heistQueue = [];
        this.isProcessing = false;
        this.isResting = false;

        this.setupEvents();
    }

    async processQueue() {
        if (this.isProcessing || this.heistQueue.length === 0 || this.isResting) return;

        this.isProcessing = true;

        while (this.heistQueue.length > 0 && !this.isResting) {
            const roomId = this.heistQueue.shift();
            
            console.log(`[حساب ${this.index}] ⏳ انتظار الاستراحة بين الصيد... الروم: ${roomId}`);
            await sleep(settings.delayBetweenHeists);

            if (this.isResting) {
                this.heistQueue.unshift(roomId); 
                break;
            }

            try {
                // نظام فحص إصدار المكتبة للانضمام للروم
                if (this.service.groups && typeof this.service.groups.join === 'function') {
                    await this.service.groups.join(roomId).catch(() => {});
                } else if (this.service.group && typeof this.service.group.join === 'function') {
                    await this.service.group.join(roomId).catch(() => {});
                } else if (typeof this.service.joinGroup === 'function') {
                    await this.service.joinGroup(roomId).catch(() => {});
                }

                // إرسال رسالة الصيد
                await this.service.messaging.sendGroupMessage(roomId, settings.actionWord);
                console.log(`[حساب ${this.index}] 🚀 [${new Date().toLocaleTimeString('ar-SA')}] تم الصيد في [${roomId}]. المتبقي في الطابور: ${this.heistQueue.length}`);
            } catch (err) {
                console.error(`[حساب ${this.index}] ❌ فشل الصيد في الروم ${roomId}: ${err.message}`);
            }
        }

        this.isProcessing = false;
    }

    async manageWorkCycle() {
        while (true) {
            console.log(`[حساب ${this.index}] 🟢 [نظام الوقت] بدأت دورة الـ 54 دقيقة عمل.`);
            this.isResting = false;
            this.processQueue(); 

            await sleep(settings.workDuration);

            console.log(`[حساب ${this.index}] 🛑 [نظام الوقت] بدأت دورة الـ 6 دقائق راحة. يتوقف الصيد مؤقتاً.`);
            this.isResting = true;
            
            await sleep(settings.restDuration);
        }
    }

    setupEvents() {
        this.service.on('ready', () => {
            console.log(`[حساب ${this.index}] ✅ متصل بنجاح: ${this.service.currentSubscriber.nickname}`);
            this.manageWorkCycle(); 
        });

        this.service.on('message', async (message) => {
            // التقاط رسائل الصيد من بوت قراند
            if (!message.isGroup && (message.sourceSubscriberId === settings.targetBotId || message.authorId === settings.targetBotId)) {
                
                const content = message.body || message.content || "";
                const match = content.match(/\(ID\s*(\d+)\)/);
                
                if (match && match[1]) {
                    const roomId = parseInt(match[1]);
                    console.log(`[حساب ${this.index}] 📥 إضافة الروم ${roomId} إلى الطابور...`);
                    
                    this.heistQueue.push(roomId);
                    
                    if (!this.isResting) {
                        this.processQueue();
                    } else {
                        console.log(`[حساب ${this.index}] ⏳ استراحة حالياً. سيتم معالجة الروم ${roomId} فور العودة للعمل.`);
                    }
                }
            }
        });
    }

    async start() {
        try {
            await this.service.login(this.email, this.password);
        } catch (err) {
            console.error(`[حساب ${this.index}] ❌ فشل تسجيل الدخول: ${err.message}`);
        }
    }
}

// دالة لتشغيل جميع الحسابات
const startAllAccounts = async () => {
    console.log("جارٍ تشغيل الحسابات...");
    
    for (let i = 1; i <= 12; i++) {
        const email = process.env[`U_MAIL_${i}`];
        const password = process.env[`U_PASS_${i}`];

        if (email && password) {
            const bot = new GrandBot(email, password, i);
            bot.start();
            
            // تأخير 3 ثواني بين دخول كل حساب لتجنب حظر الشبكة (Rate Limit) من سيرفرات ولف
            await sleep(3000); 
        } else {
            console.log(`⚠️ بيانات الحساب رقم ${i} غير مكتملة في ملف .env، تم تخطيه.`);
        }
    }
};

startAllAccounts();
