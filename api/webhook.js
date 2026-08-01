const { Telegraf } = require('telegraf');
const { GoogleGenAI } = require('@google/genai');

const bot = new Telegraf(process.env.BOT_TOKEN);

// راه‌اندازی جمینای با کلید API ورسل
const ai = new GoogleGenAI({ apiKey: process.env.AI_API_KEY || process.env.GEMINI_API_KEY });

bot.on(['message', 'photo'], async (ctx) => {
  try {
    let userMessage = '';
    let imageBuffer = null;
    let mimeType = 'image/jpeg';

    // بررسی نوع پیام (متن یا عکس)
    if (ctx.message.photo && ctx.message.photo.length > 0) {
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      const fileLink = await bot.telegram.getFileLink(photo.file_id);
      
      // دانلود مستقیم عکس برای ارسال به جمینای
      const response = await fetch(fileLink.href);
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
      
      userMessage = ctx.message.caption || 'این تصویر را خلاصه و مفید تحلیل کن.';
    } else if (ctx.message.text) {
      userMessage = ctx.message.text;
    } else {
      return;
    }

    // تنظیم دستورالعمل قاطع برای پاسخ‌های کوتاه و مستقیم
    const systemInstruction = `
    تو یک دستیار هوشمند، لوکس و بسیار منظم هستی. 
    قانون حیاتی و مطلق: پاسخ‌های تو باید بسیار کوتاه، کاملاً خلاصه، مستقیم و حداکثر در ۱ الی ۲ جمله باشند. به هیچ وجه توضیحات اضافه، حاشیه یا متن‌های بلند ننویس.
    `;

    let contents = [];

    // اگر عکس وجود داشت، عکس و متن را با هم به جمینای بفرست
    if (imageBuffer) {
      contents.push({
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType: mimeType
        }
      });
      contents.push(userMessage);
    } else {
      contents.push(userMessage);
    }

    // استفاده از مدل فوق‌العاده‌ی Gemini 2.5 Flash (سریع، دقیق و هوشمند)
    const completion = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3,
        maxOutputTokens: 200,
      }
    });

    const aiReply = completion.text || 'پاسخی دریافت نشد.';
    await ctx.reply(aiReply);

  } catch (error) {
    console.error('Gemini AI Error:', error);
    await ctx.reply(`خطا در ارتباط با جمینای: ${error.message}`);
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
    return res.status(200).send('Gemini Bot is active!');
  }
};
