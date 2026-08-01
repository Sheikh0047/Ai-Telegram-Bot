const { Telegraf } = require('telegraf');
const OpenAI = require('openai');

const bot = new Telegraf(process.env.BOT_TOKEN);

const groq = new OpenAI({
  apiKey: process.env.AI_API_KEY, 
  baseURL: 'https://api.groq.com/openai/v1',
});

// مدیریت پیام‌های دریافتی (چه در چت ربات و چه از طریق اتوماسیون اکانت)
bot.on('message', async (ctx) => {
  try {
    // گرفتن متن پیام کاربر
    const userMessage = ctx.message && ctx.message.text;
    if (!userMessage) return;

    // اگر پیام از طرف خود ربات بود، پردازش نکن
    if (ctx.message.from && ctx.message.from.is_bot) return;

    // ارسال درخواست به هوش مصنوعی گروک
    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        { 
          role: "system", 
          content: "تو دستیار هوشمند و منشی شخصی کاربر در تلگرام هستی. به جای او به پیام‌های دریافتی در چت‌های خصوصی به صورت صمیمی، کوتاه و طبیعی پاسخ بده." 
        },
        { role: "user", content: userMessage }
      ],
    });

    const aiReply = completion.choices[0].message.content;

    // ارسال پاسخ هوش مصنوعی به فرستنده پیام
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
