from loguru import logger
import sys
import os

LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)

LOG_FORMAT = "{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}"

# Remove default handlers
logger.remove()

# Add console logging
logger.add(sys.stderr, format=LOG_FORMAT, level="DEBUG", colorize=True)

# Function to return a logger instance for a module
def get_logger(module_name: str, log_level: str = "DEBUG"):
    log_file = f"{LOG_DIR}/{module_name}.log"

    # Create a new logger with context
    log_instance = logger.bind(context=module_name)

    # Add file logging
    log_instance.add(
        log_file,
        format=LOG_FORMAT,
        level=log_level,
        rotation="5 MB",
        filter=lambda record: record["extra"].get("context") == module_name,
    )

    return log_instance  # ✅ Return a valid logger instance
