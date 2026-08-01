const { Telegraf } = require('telegraf');
const OpenAI = require('openai');

const bot = new Telegraf(process.env.BOT_TOKEN);

const groq = new OpenAI({
  apiKey: process.env.AI_API_KEY, 
  baseURL: 'https://api.groq.com/openai/v1',
});

bot.on(['message', 'photo'], async (ctx) => {
  try {
    let userMessage = '';
    let imageUrl = '';
    let contentArray = [];

    if (ctx.message.photo && ctx.message.photo.length > 0) {
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      const fileLink = await bot.telegram.getFileLink(photo.file_id);
      imageUrl = fileLink.href;
      userMessage = ctx.message.caption || 'این تصویر را تحلیل کن.';
    } else if (ctx.message.text) {
      userMessage = ctx.message.text;
    } else {
      return;
    }

    // دستورالعمل جدید برای پاسخ‌های کوتاه، خلاصه و مستقیم
    const systemInstruction = `
    شما یک دستیار هوشمند، لوکس و باکلاس هستید. 
    قاعده بسیار مهم: پاسخ‌های شما باید بسیار کوتاه، کاملاً خلاصه، مستقیم و بدون حاشیه یا پرحرفی باشد. اصل مطلب را با لحنی محترمانه و شیک در چند کلمه یا یک خط کوتاه بیان کنید.
    `;

    contentArray.push({ role: "system", content: systemInstruction });

    if (imageUrl) {
      contentArray.push({
        role: "user",
        content: [
          { type: "text", text: userMessage },
          { type: "image_url", image_url: { "url": imageUrl } },
        ],
      });
    } else {
      contentArray.push({ role: "user", content: userMessage });
    }

    const completion = await groq.chat.completions.create({
      model: "qwen/qwen3.6-27b",
      messages: contentArray,
      temperature: 0.5, // دقت بالاتر و خلاقیت کنترل‌شده برای جلوگیری از پرحرفی
      max_tokens: 300,  // محدود کردن حجم پاسخ برای جلوگیری از طولانی شدن
    });

    const aiReply = completion.choices[0].message.content;
    await ctx.reply(aiReply);

  } catch (error) {
    console.error('Groq AI Error:', error);
    await ctx.reply(`خطا: ${error.message}`);
  }
});

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
      return res.status(200).send('OK');
    } catch (e) {
      return res.status(500).send('Error');
    }
  } else {
    return res.status(200).send('Bot is active!');
  }
};
