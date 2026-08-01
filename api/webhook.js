const { Telegraf } = require('telegraf');
const OpenAI = require('openai');

const bot = new Telegraf(process.env.BOT_TOKEN);

const groq = new OpenAI({
  apiKey: process.env.AI_API_KEY, 
  baseURL: 'https://api.groq.com/openai/v1',
});

// مدیریت پیام‌های دریافتی (متن یا عکس)
bot.on(['message', 'photo'], async (ctx) => {
  try {
    let userMessage = '';
    let imageUrl = '';
    let contentArray = [];

    // بررسی اینکه آیا پیام عکس دارد یا متن
    if (ctx.message.photo && ctx.message.photo.length > 0) {
      // گرفتن لینک مستقیم بالاترین کیفیت عکس از تلگرام
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      const fileLink = await bot.telegram.getFileLink(photo.file_id);
      imageUrl = fileLink.href;
      
      // اگر کاربر همراه عکس متن هم فرستاده بود
      userMessage = ctx.message.caption || 'این تصویر را با دقت و جزئیات کامل بررسی و تحلیل کن و بگو چه چیزهایی در آن می‌بینی.';
    } else if (ctx.message.text) {
      // اگر پیام فقط متنی بود
      userMessage = ctx.message.text;
    } else {
      // اگر نوع پیام چیز دیگری بود (فایل، ویدیو و...)
      return;
    }

    // تنظیم پیام سیستم برای هویت لوکس، لانچری و باکلاس
    const systemInstruction = `
    شما یک دستیار هوش مصنوعی شخصی بسیار شیک، باکلاس، و لانچری هستید که برای افراد خاص کار می‌کند.
    لحن صحبت شما باید رسمی، مودبانه، جذاب، و در عین حال هوشمندانه و فلسفی باشد.
    از به کار بردن کلمات و جملات عامیانه، ساده، و رباتیک به شدت پرهیز کنید.
    مانند یک متخصص حرفه‌ای در زمینه هنر، تکنولوژی، و استایل صحبت کنید.
    اگر کاربر سوالی پرسید، با اعتماد به نفس و کامل پاسخ دهید.
    اگر تصویری برای شما ارسال شد، با استفاده از قابلیت Vision، تصویر را با جزئیات خیره‌کننده و ادبیاتی فاخر توصیف و تحلیل کنید و حس و حال کلی آن را به کاربر منتقل نمایید.
    `;

    // ساختار پیام برای ارسال به گروک (پشتیبانی از متن و عکس)
    contentArray.push({ role: "system", content: systemInstruction });

    if (imageUrl) {
      // اگر عکس وجود دارد، ساختار پیام متفاوت است
      contentArray.push({
        role: "user",
        content: [
          { type: "text", text: userMessage },
          {
            type: "image_url",
            image_url: {
              "url": imageUrl,
              "detail": "high" // جزئیات بالا برای تحلیل دقیق
            },
          },
        ],
      });
    } else {
      // اگر فقط متن است
      contentArray.push({ role: "user", content: userMessage });
    }

    // ارسال درخواست به مدل قدرتمند جدید
    const completion = await groq.chat.completions.create({
      model: "llama-3.2-90b-vision-preview",
      messages: contentArray,
      temperature: 0.7, // خلاقیت بیشتر در پاسخ‌دهی
      max_tokens: 2000, // اجازه دادن به ربات برای پاسخ‌های طولانی و مفصل
    });

    const aiReply = completion.choices[0].message.content;

    // پاسخ دادن به کاربر
    await ctx.reply(aiReply);

  } catch (error) {
    console.error('Groq AI Advanced Error:', error);
    // نمایش پیام خطای دقیق برای عیب‌یابی راحت‌تر
    await ctx.reply(`با عرض پوزش، در تحلیل هوش مصنوعی پیشرفته خطایی رخ داد: ${error.message}`);
  }
});

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
      return res.status(200).send('OK');
    } catch (e) {
      console.error('Webhook error:', e);
      return res.status(500).send('Error');
    }
  } else {
    return res.status(200).send('Luxury AI Assistant Bot is active!');
  }
};
