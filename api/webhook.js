const { Telegraf } = require('telegraf');
const OpenAI = require('openai');

const bot = new Telegraf(process.env.BOT_TOKEN);

// اتصال مستقیم با کلید Groq شما
const groq = new OpenAI({
  apiKey: "Gsk_d8UDnYPtyo3GCMmKDNKAWGdyb3FYm0nDTaGS7RjgHIHYHFWwns5Z", 
  baseURL: 'https://api.groq.com/openai/v1',
});

bot.on('message', async (ctx) => {
  try {
    const userMessage = ctx.message.text;
    if (!userMessage) return;

    // ارسال پیام به هوش مصنوعی Groq (مدل Llama 3)
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
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
