import os
from fastapi import FastAPI, Request, Response
from telegram import Update, Bot
from telegram.ext import Application
from google import genai

app = FastAPI()

# دریافت توکن‌ها از Environment Variables
BOT_TOKEN = os.environ.get("BOT_TOKEN")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# مقداردهی اولیه جمینای
ai_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

@app.get("/")
async def root():
    return {"status": "ok", "message": "Python AI Telegram Bot is Running!"}

@app.post("/")
async def webhook_handler(request: Request):
    try:
        data = await request.json()
        update = Update.de_json(data, Bot(token=BOT_TOKEN))
        
        # پردازش پیام‌های متنی
        if update.message and update.message.text:
            chat_id = update.message.chat_id
            user_text = update.message.text
            
            bot = Bot(token=BOT_TOKEN)

            # ارسال حالت Typing در تلگرام
            await bot.send_chat_action(chat_id=chat_id, action="typing")

            if user_text.startswith("/start"):
                await bot.send_message(
                    chat_id=chat_id, 
                    text="سلام! 💎\nمن دستیار هوش مصنوعی هوشمند شما هستم. چه کمکی میتونم بهتون بکنم؟"
                )
            else:
                # ارسال به Gemini
                response = ai_client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=user_text,
                    config={
                        'system_instruction': "تو یک دستیار هوش مصنوعی بسیار محترمانه، دقیق، حرفه‌ای و فارسی‌زبان هستی."
                    }
                )
                
                reply_text = response.text if response and response.text else "پاسخی دریافت نشد."
                await bot.send_message(chat_id=chat_id, text=reply_text)

        return Response(content="OK", status_code=200)

    except Exception as e:
        print(f"Error handling update: {e}")
        return Response(content="Error", status_code=500)
