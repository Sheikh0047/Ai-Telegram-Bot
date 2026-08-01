const { Telegraf } = require('telegraf');
const OpenAI = require('openai');

const bot = new Telegraf(process.env.BOT_TOKEN);

const groq = new OpenAI({
  apiKey: process.env.AI_API_KEY, 
  baseURL: 'https://api.groq.com/openai/v1',
});

bot.on('message', async (ctx) => {
  try {
    const userMessage = ctx.message && ctx.message.text;
    if (!userMessage) return;
    if (ctx.message.from && ctx.message.from.is_bot) return;

    // استفاده از مدل جدید و فعال گروک
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { 
          role: "system", 
          content: "تو دستیار هوشمند و منشی شخصی کاربر در تلگرام هستی. به جای او به پیام‌های دریافتی به صورت صمیمی، کوتاه و طبیعی پاسخ بده." 
        },
        { role: "user", content: userMessage }
      ],
    });

    const aiReply = completion.choices[0].message.content;
    await ctx.reply(aiReply);
  } catch (error) {
    console.error('Groq AI Error Details:', error);
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
    return res.status(200).send('Telegram AI Secretary Bot is active!');
  }
};
