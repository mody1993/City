import 'dotenv/config';
import wolfjs from 'wolf.js';
const { WOLF } = wolfjs;

// إعدادات الغرف
const MAIN_ROOM_ID = 569;
const CHECK_ROOM_ID = 18654218;

// تصفية الكونسول (إخفاء السطور المزعجة)
process.env.SUPPRESS_NO_CONFIG_WARNING = 'true';
console.log = (...args) => process.stdout.write(args.join(' ') + '\n');
console.debug = () => {}; 
console.warn = () => {};

const ACCOUNTS = [
    { email: process.env.U_MAIL_1, password: process.env.U_PASS_1, name: 'King',    room: MAIN_ROOM_ID, cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_2, password: process.env.U_PASS_2, name: 'KSA',     room: MAIN_ROOM_ID, cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_3, password: process.env.U_PASS_3, name: 'MKH',     room: MAIN_ROOM_ID, cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_4, password: process.env.U_PASS_4, name: 'SAA',     room: MAIN_ROOM_ID, cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_5, password: process.env.U_PASS_5, name: 'JDH',     room: MAIN_ROOM_ID, cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_6, password: process.env.U_PASS_6, name: 'MLK',     room: MAIN_ROOM_ID, cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_7, password: process.env.U_PASS_7, name: 'CRN',     room: MAIN_ROOM_ID, cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_8, password: process.env.U_PASS_8, name: 'REX',     room: MAIN_ROOM_ID, cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_9, password: process.env.U_PASS_9, name: 'LRD',     room: MAIN_ROOM_ID, cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_10, password: process.env.U_PASS_10, name: 'ROY',   room: MAIN_ROOM_ID, cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_11, password: process.env.U_PASS_11, name: 'EMP',   room: MAIN_ROOM_ID, cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_12, password: process.env.U_PASS_12, name: 'NOR',   room: MAIN_ROOM_ID, cmd: '!مد تحالف ايداع كل' },
    { email: process.env.U_MAIL_13, password: process.env.U_PASS_13, name: 'Passion', room: 13219769, cmd: '!مد تحالف ايداع كل' }
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runBot(acc) {
    const client = new WOLF();
    let counter = 0; 
    let dynamicCheckTimer = 300000; 

    client.on('ready', async () => {
        console.log(`✅ ${acc.name} متصل بنجاح.`);
        
        // 1. التشغيل الأولي
        await client.messaging.sendGroupMessage(CHECK_ROOM_ID, '!مد صندوق');

        // 2. دورة اللعب (كل 61 ثانية)
        const mainLoop = setInterval(async () => {
            counter++;
            await client.messaging.sendGroupMessage(acc.room, '!مد مهام');
            await sleep(2000);
            if (counter === 3) {
                await client.messaging.sendGroupMessage(acc.room, '!مد اسرق');
                await sleep(2000);
                counter = 0;
            }
            await client.messaging.sendGroupMessage(acc.room, acc.cmd);
        }, 61000);

        // 3. دورة الفتح الدوري (كل 500 ثانية)
        const openLoop = setInterval(async () => {
            await client.messaging.sendGroupMessage(CHECK_ROOM_ID, '!مد صندوق فتح');
        }, 500000);

        // 4. الفحص الذكي
        async function smartCheck() {
            while (true) {
                await sleep(dynamicCheckTimer);
                await client.messaging.sendGroupMessage(CHECK_ROOM_ID, '!مد صندوق');
            }
        }
        smartCheck();

        client.on('groupMessage', async (msg) => {
            if (msg.targetGroupId === CHECK_ROOM_ID && msg.body.includes('📦')) {
                const body = msg.body;
                if (body.includes('موقوف')) await client.messaging.sendGroupMessage(CHECK_ROOM_ID, '!مد تشغيل');
                if (body.includes('غير نشط')) await client.messaging.sendGroupMessage(CHECK_ROOM_ID, '!مد صندوق ضمان وقت');
                
                const points = (body.match(/نقاط الضمان: (\d+)\//) || [])[1] || 0;
                if (parseInt(points) < 42) {
                    if (body.includes('ذهبي: [1-9]')) await client.messaging.sendGroupMessage(CHECK_ROOM_ID, '!مد صندوق فتح ذهبي');
                    else if (body.includes('فضي: [1-9]')) await client.messaging.sendGroupMessage(CHECK_ROOM_ID, '!مد صندوق فتح فضي');
                    else if (body.includes('برونزي: [1-9]')) await client.messaging.sendGroupMessage(CHECK_ROOM_ID, '!مد صندوق فتح برونزي');
                }

                const timeMatch = body.match(/(\d+)س (\d+)د/);
                if (timeMatch) dynamicCheckTimer = (parseInt(timeMatch[1]) * 3600000) + (parseInt(timeMatch[2]) * 60000) + 5000;
            }
        });

        // 5. الإغلاق النهائي
        setTimeout(async () => {
            clearInterval(mainLoop);
            clearInterval(openLoop);
            await client.messaging.sendGroupMessage(CHECK_ROOM_ID, '!مد ايقاف');
            console.log(`🛑 تم إغلاق ${acc.name} بنجاح.`);
            process.exit();
        }, 21480000);
    });

    await client.login(acc.email, acc.password);
}

// التشغيل التتابعي
ACCOUNTS.forEach((acc, i) => setTimeout(() => runBot(acc), i * 15000));
