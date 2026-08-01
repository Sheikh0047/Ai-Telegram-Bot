const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.on('text', async (ctx) => {
  const userMessage = ctx.message.text;
  // اینجا می‌توانید متن دریافتی را پردازش کنید یا پاسخ دلخواه بدهید
  await ctx.reply(`سلام! پیام شما دریافت شد: "${userMessage}"`);
});

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
      res.status(200).send('OK');
    } catch (e) {
      console.error(e);
      res.status(500).send('Error');
    }
  } else {
    res.status(200).send('Telegram Bot is running on Vercel with Android!');
  }
};
