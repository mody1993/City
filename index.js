import 'dotenv/config';
import wolfjs from 'wolf.js';
const { WOLF } = wolfjs;

const MAIN_ROOM_ID = 569;
const CHECK_ROOM_ID = 18654218;
const BOT_SOURCE_ID = 76023604;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function sendMsg(client, targetId, text) {
    try {
        // نستخدم الطريقة الأكثر شمولاً للإرسال
        await client.messaging.send({ groupId: targetId, content: text, isGroup: true });
    } catch (e) {
        console.log(`[خطأ إرسال] تعذر الإرسال إلى ${targetId}: ${e.message}`);
    }
}

async function runBot(acc) {
    const client = new WOLF();
    let counter = 0;
    let dynamicCheckTimer = 300000;

    client.on('ready', async () => {
        // تأخير 10 ثوانٍ لضمان اكتمال المزامنة (Synchronisation) وتجنب الأخطاء
        await sleep(10000);
        console.log(`✅ ${acc.name} متصل وجاهز (معرف البوت: ${client.currentSubscriber.id})`);

        await sendMsg(client, CHECK_ROOM_ID, '!مد صندوق');

        const mainLoop = setInterval(async () => {
            counter++;
            await sendMsg(client, acc.room, '!مد مهام');
            await sleep(2000);
            if (counter === 3) {
                await sendMsg(client, acc.room, '!مد اسرق');
                await sleep(2000);
                counter = 0;
            }
            await sendMsg(client, acc.room, acc.cmd);
        }, 61000);

        const openLoop = setInterval(async () => {
            await sendMsg(client, CHECK_ROOM_ID, '!مد صندوق فتح');
        }, 500000);

        // حلقة الفحص الذكي
        async function smartCheckLoop() {
            while (true) {
                await sleep(dynamicCheckTimer);
                await sendMsg(client, CHECK_ROOM_ID, '!مد صندوق');
            }
        }
        smartCheckLoop();

        client.on('groupMessage', async (msg) => {
            if (msg.targetGroupId === CHECK_ROOM_ID && msg.sourceSubscriberId === BOT_SOURCE_ID && msg.body.includes('📦')) {
                const body = msg.body;
                if (body.includes('موقوف')) await sendMsg(client, CHECK_ROOM_ID, '!مد تشغيل');
                if (body.includes('غير نشط')) await sendMsg(client, CHECK_ROOM_ID, '!مد صندوق ضمان وقت');
                
                const points = (body.match(/نقاط الضمان: (\d+)\//) || [])[1] || 0;
                if (parseInt(points) < 42) {
                    if (body.includes('ذهبي:')) await sendMsg(client, CHECK_ROOM_ID, '!مد صندوق فتح ذهبي');
                    else if (body.includes('فضي:')) await sendMsg(client, CHECK_ROOM_ID, '!مد صندوق فتح فضي');
                    else if (body.includes('برونزي:')) await sendMsg(client, CHECK_ROOM_ID, '!مد صندوق فتح برونزي');
                }

                const timeMatch = body.match(/(\d+)س (\d+)د/);
                if (timeMatch) dynamicCheckTimer = (parseInt(timeMatch[1]) * 3600000) + (parseInt(timeMatch[2]) * 60000) + 5000;
            }
        });
    });

    await client.login(acc.email, acc.password);
}

// قائمة الحسابات
const ACCOUNTS = [
    { email: process.env.U_MAIL_1, password: process.env.U_PASS_1, name: 'King', room: MAIN_ROOM_ID, cmd: '!مد تحالف ايداع كل' },
    // يمكنك إضافة باقي الحسابات هنا بنفس الطريقة
];

ACCOUNTS.forEach((acc, i) => setTimeout(() => runBot(acc), i * 15000));
