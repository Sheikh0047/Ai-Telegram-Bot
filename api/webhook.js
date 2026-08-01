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
      
      userMessage = ctx.message.caption || 'این تصویر را با دقت و جزئیات کامل بررسی و تحلیل کن.';
    } else if (ctx.message.text) {
      userMessage = ctx.message.text;
    } else {
      return;
    }

    const systemInstruction = `
    شما یک دستیار هوش مصنوعی شخصی بسیار شیک، باکلاس، و لانچری هستید که برای افراد خاص کار می‌کند.
    لحن صحبت شما باید رسمی، مودبانه، جذاب، و در عین حال هوشمندانه باشد.
    از به کار بردن کلمات و جملات عامیانه، ساده، و رباتیک به شدت پرهیز کنید.
    اگر تصویری برای شما ارسال شد، با استفاده از قابلیت Vision، آن را با جزئیات خیره‌کننده و ادبیاتی فاخر تحلیل کنید.
    `;

    contentArray.push({ role: "system", content: systemInstruction });

    if (imageUrl) {
      contentArray.push({
        role: "user",
        content: [
          { type: "text", text: userMessage },
          {
            type: "image_url",
            image_url: { "url": imageUrl },
          },
        ],
      });
    } else {
      contentArray.push({ role: "user", content: userMessage });
    }

    // استفاده از مدل جدید و قدرتمند Qwen 3.6 با قابلیت بینایی و متن
    const completion = await groq.chat.completions.create({
      model: "qwen/qwen3.6-27b",
      messages: contentArray,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const aiReply = completion.choices[0].message.content;
    await ctx.reply(aiReply);

  } catch (error) {
    console.error('Groq AI Advanced Error:', error);
    await ctx.reply(`خطا در پردازش هوش مصنوعی: ${error.message}`);
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
