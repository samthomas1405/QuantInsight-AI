import os
from dotenv import load_dotenv

load_dotenv()

# Email Configuration
EMAIL_ENABLED = os.getenv("EMAIL_ENABLED", "false").lower() == "true"
EMAIL_FROM = os.getenv("EMAIL_FROM", "noreply@quantinsight-ai.com")
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "QuantInsight AI")

# SMTP Configuration (for production)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_TLS = os.getenv("SMTP_TLS", "true").lower() == "true"

# Verification settings
VERIFICATION_CODE_LENGTH = 6
VERIFICATION_CODE_EXPIRY_MINUTES = 10

# For development - print codes to console if email is disabled
DEV_MODE = os.getenv("DEV_MODE", "true").lower() == "true"