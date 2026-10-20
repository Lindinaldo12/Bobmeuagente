import os
import logging
import re
from dotenv import load_dotenv
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters

# Load environment variables first
load_dotenv()

# Import our custom handlers
from handlers import start_handler, text_message_handler, help_handler, status_handler, about_handler

# Set up logging to monitor warnings and errors easily
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

# Redact bot token from logs to prevent leakage
class RedactTokenFilter(logging.Filter):
    """Filter to redact sensitive tokens from log messages."""
    def filter(self, record):
        if hasattr(record, 'msg'):
            record.msg = redact_token(record.msg)
        return True

def redact_token(text):
    """Remove bot token pattern from log messages."""
    if not text:
        return text
    import re
    return re.sub(r'bot\d+:[A-Za-z0-9_-]+', 'bot[REDACTED]:[REDACTED]', str(text))

# Apply filter to the root logger handlers
for handler in logging.getLogger().handlers:
    handler.addFilter(RedactTokenFilter())

def main():
    BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

    if not BOT_TOKEN or BOT_TOKEN == "your_bot_token_here":
        logging.error("TELEGRAM_BOT_TOKEN is missing or invalid in the .env file.")
        return

    # Initialize the application with the bot token
    application = ApplicationBuilder().token(BOT_TOKEN).build()

    # Route the /start command to the start_handler
    application.add_handler(CommandHandler("start", start_handler))

    # Route /help command to the help_handler
    application.add_handler(CommandHandler("help", help_handler))

    # Route /status command to the status_handler
    application.add_handler(CommandHandler("status", status_handler))

    # Route /about command to the about_handler
    application.add_handler(CommandHandler("about", about_handler))

    # Route all text messages (that are not commands) to the text_message_handler
    application.add_handler(MessageHandler(filters.TEXT & (~filters.COMMAND), text_message_handler))

    # Start the bot using long-polling
    logging.info("Starting up the bot using long-polling...")
    application.run_polling()

if __name__ == '__main__':
    main()
