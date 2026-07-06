import wolfjs from 'wolf.js';
const { WOLF } = wolfjs;
import 'dotenv/config';

const CHANNEL_ID = 18654218; // معرف القناة الخاص بك

const client = new WOLF();

client.on('ready', async () => {
    console.log(`✅ تم تسجيل الدخول بنجاح باسم: ${client.currentSubscriber.nickname}`);
    
    // 1. محاولة جلب معلومات القناة
    try {
        const channel = await client.channel.getById(CHANNEL_ID);
        console.log("-----------------------------------------");
        console.log("🔍 معلومات القناة:");
        console.log(JSON.stringify(channel, null, 2));
        console.log("-----------------------------------------");

        // 2. محاولة إرسال رسالة تجريبية
        console.log("🔄 جاري محاولة الإرسال...");
        await client.channel.send(CHANNEL_ID, "⚠️ بوت التشخيص: أنا متصل وأحاول الإرسال!");
        console.log("✅ تم إرسال رسالة التشخيص بنجاح!");

    } catch (err) {
        console.error("❌ حدث خطأ أثناء جلب المعلومات أو الإرسال:");
        console.error(err);
        
        // 3. تحليل الخطأ
        if (err.message.includes("403")) {
            console.log("💡 ملاحظة: الخطأ 403 يعني أن البوت لا يملك صلاحية الإرسال في هذه القناة.");
        } else if (err.message.includes("404")) {
            console.log("💡 ملاحظة: الخطأ 404 يعني أن القناة غير موجودة أو البوت خارجها.");
        }
    }
});

client.login(process.env.U_MAIL_1, process.env.U_PASS_1);
