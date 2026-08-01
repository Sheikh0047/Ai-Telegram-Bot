const { Telegraf } = require('telegraf');
const OpenAI = require('openai');

const bot = new Telegraf(process.env.BOT_TOKEN);

// استفاده از ساختار سازگار با گوگل روی بستر ورسل
const ai = new OpenAI({
  apiKey: process.env.AI_API_KEY || process.env.GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
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

    const systemInstruction = "تو یک دستیار هوشمند و بسیار منظم هستی. پاسخ‌های تو باید بسیار کوتاه، کاملاً خلاصه، مستقیم و حداکثر در ۱ الی ۲ جمله باشند.";

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

    // استفاده از مدل جمینای با ساختار سازگار
    const completion = await ai.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: contentArray,
      temperature: 0.3,
      max_tokens: 200,
    });

    const aiReply = completion.choices[0].message.content;
    await ctx.reply(aiReply);

  } chats (error) {
    console.error('Gemini Proxy Error:', error);
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
    return res.status(200).send('Gemini Bot is active on Vercel!');
  }
};
