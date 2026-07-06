import 'dotenv/config';
import wolfjs from 'wolf.js';

const { WOLF } = wolfjs;

const MAIN_ROOM = { channelId: 569 };
const CHECK_ROOM = { channelId: 18654218 };

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

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function createBot(config) {
    const client = new WOLF();
    const botName = config.allowedPlayers[0];
    let globalTimer = 300; 

    // 2. الدورة الأساسية (كل دقيقة)
    async function mainActionLoop() {
        let minuteCounter = 0;
        while (true) {
            try {
                minuteCounter++;
                await client.messaging.sendChannelMessage(MAIN_ROOM.channelId, '!مد مهام');
                await sleep(2000);
                
                if (minuteCounter === 3) {
                    await client.messaging.sendChannelMessage(MAIN_ROOM.channelId, '!مد اسرق');
                    await sleep(2000);
                    minuteCounter = 0;
                }
                
                await client.messaging.sendChannelMessage(MAIN_ROOM.channelId, '!مد تحالف ايداع كل');
                await sleep(61000);
            } catch (e) { console.error(`[${botName}] خطأ دورة أساسية:`, e.message); await sleep(5000); }
        }
    }

    // 3. دورة الفتح الدوري (كل 500 ثانية)
    async function openBoxLoop() {
        while (true) {
            await client.messaging.sendChannelMessage(CHECK_ROOM.channelId, '!مد صندوق فتح');
            await sleep(500000);
        }
    }

    // 4. الفحص الذكي
    async function checkLoop() {
        while (true) {
            await sleep(globalTimer * 1000);
            await client.messaging.sendChannelMessage(CHECK_ROOM.channelId, '!مد صندوق');
        }
    }

    client.on('channelMessage', async (msg) => {
        if (msg.sourceSubscriberId !== 76023242) return; // معرف المرسل
        const body = msg.body;
        
        // منطق الفحص الشرطي
        if (body.includes('موقوف')) await client.messaging.sendChannelMessage(CHECK_ROOM.channelId, '!مد تشغيل');
        else if (body.includes('غير نشط')) await client.messaging.sendChannelMessage(CHECK_ROOM.channelId, '!مد صندوق ضمان وقت');
        
        // منطق الصناديق (بسيط)
        if (body.includes('نقاط الضمان') && body.includes('/50')) {
            const points = parseInt(body.match(/نقاط الضمان:\s*(\d+)/)?.[1] || 0);
            if (points < 42) {
                if (body.includes('ذهبي')) await client.messaging.sendChannelMessage(CHECK_ROOM.channelId, '!مد صندوق فتح ذهبي');
            }
        }
    });

    client.on('ready', async () => {
        console.log(`✅ ${botName} جاهز.`);
        await client.channel.join(MAIN_ROOM.channelId);
        await client.channel.join(CHECK_ROOM.channelId);
        
        // 1. التشغيل الأولي
        await client.messaging.sendChannelMessage(CHECK_ROOM.channelId, '!مد صندوق');
        
        mainActionLoop();
        openBoxLoop();
        checkLoop();

        // 5. الإغلاق النهائي
        setTimeout(async () => {
            await client.messaging.sendChannelMessage(CHECK_ROOM.channelId, '!مد ايقاف');
            process.exit();
        }, 21480000);
    });

    client.login(config.email, config.password);
}

ACCOUNTS.forEach((acc, i) => setTimeout(() => createBot(acc), i * 15000));
