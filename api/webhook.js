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
      userMessage = ctx.message.caption || 'این تصویر را خلاصه تحلیل کن.';
    } else if (ctx.message.text) {
      userMessage = ctx.message.text;
    } else {
      return;
    }

    // دستورالعمل قاطع برای جلوگیری کامل از پرحرفی
    const systemInstruction = `
    تو یک دستیار هوشمند هستی. 
    قانون حیاتی و مطلق: حداکثر طول پاسخ تو باید ۱ الی ۲ جمله کوتاه باشد. به هیچ وجه توضیحات اضافه، مقدمه‌چینی، حاشیه یا متن‌های بلند ننویس. مستقیم، مفید و کوتاه پاسخ بده.
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
      temperature: 0.3, // کاهش خلاقیت برای پایبندی دقیق به کوتاه بودن
      max_tokens: 150,  // محدودیت شدید حجم پاسخ
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
