const { Telegraf } = require('telegraf');
const OpenAI = require('openai');

const bot = new Telegraf(process.env.BOT_TOKEN);

// تنظیم Groq با استفاده از کتابخانه OpenAI
const groq = new OpenAI({
  apiKey: process.env.AI_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

bot.on('message', async (ctx) => {
  try {
    const userMessage = ctx.message.text;
    if (!userMessage) return;

    // ارسال پیام به هوش مصنوعی Groq
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // مدل فوق‌العاده سریع و هوشمند Groq
      messages: [
        { 
          role: "system", 
          content: "تو یک دستیار هوشمند و صمیمی هستی که به جای کاربر در تلگرام به پیام‌ها به صورت محاوره‌ای، کوتاه و طبیعی پاسخ می‌دهی." 
        },
        { role: "user", content: userMessage }
      ],
    });

    const aiReply = completion.choices[0].message.content;

    // ارسال پاسخ هوش مصنوعی به کاربر تلگرام
    await ctx.reply(aiReply);
  } catch (error) {
    console.error('Groq AI Error:', error);
    await ctx.reply('متوجه شدم، اما در پردازش هوش مصنوعی خطایی رخ داد.');
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
    return res.status(200).send('Groq Telegram Bot is active!');
  }
};
