import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging
from app.config import (
    EMAIL_ENABLED, EMAIL_FROM, EMAIL_FROM_NAME,
    SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_TLS,
    DEV_MODE
)

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self):
        self.enabled = EMAIL_ENABLED
        self.from_email = EMAIL_FROM
        self.from_name = EMAIL_FROM_NAME
        
    def send_verification_code(self, to_email: str, code: str, purpose: str = "login") -> bool:
        """Send verification code email"""
        subject = f"Your QuantInsight AI Verification Code: {code}"
        
        if purpose == "registration":
            body = f"""
Welcome to QuantInsight AI!

Your verification code is: {code}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
The QuantInsight AI Team
"""
        else:
            body = f"""
Your QuantInsight AI login verification code is: {code}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
The QuantInsight AI Team
"""
        
        return self._send_email(to_email, subject, body)
    
    def send_welcome_email(self, to_email: str, first_name: str) -> bool:
        """Send welcome email after successful verification"""
        subject = "Welcome to QuantInsight AI!"
        
        body = f"""
Hi {first_name},

Welcome to QuantInsight AI! Your account has been successfully verified.

You now have access to:
• Real-time market analysis
• AI-powered stock predictions
• Multi-agent financial insights
• Personalized portfolio recommendations

Get started by selecting your stocks and running your first analysis.

If you have any questions, feel free to reach out to our support team.

Best regards,
The QuantInsight AI Team
"""
        
        return self._send_email(to_email, subject, body)
    
    def _send_email(self, to_email: str, subject: str, body: str) -> bool:
        """Internal method to send email"""
        
        # In development mode, just print to console
        if not self.enabled or DEV_MODE:
            logger.info(f"DEV MODE - Email would be sent to: {to_email}")
            logger.info(f"Subject: {subject}")
            logger.info(f"Body:\n{body}")
            print(f"\n{'='*60}")
            print(f"EMAIL TO: {to_email}")
            print(f"SUBJECT: {subject}")
            print(f"BODY:\n{body}")
            print(f"{'='*60}\n")
            return True
        
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Add body
            msg.attach(MIMEText(body, 'plain'))
            
            # Connect to server and send
            if SMTP_TLS:
                server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
                server.starttls()
            else:
                server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT)
            
            if SMTP_USERNAME and SMTP_PASSWORD:
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
            
            text = msg.as_string()
            server.sendmail(self.from_email, to_email, text)
            server.quit()
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False


# Singleton instance
email_service = EmailService()