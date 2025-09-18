import random
import string
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.verification import VerificationCode
from app.models.user import User
from app.config import VERIFICATION_CODE_LENGTH, VERIFICATION_CODE_EXPIRY_MINUTES


class VerificationService:
    @staticmethod
    def generate_code(length: int = VERIFICATION_CODE_LENGTH) -> str:
        """Generate a random numeric verification code"""
        return ''.join(random.choices(string.digits, k=length))
    
    @staticmethod
    def create_verification_code(
        db: Session,
        email: str,
        purpose: str = "login",
        user_id: int = None
    ) -> VerificationCode:
        """Create and store a new verification code"""
        
        # Invalidate any existing unused codes for this email and purpose
        existing_codes = db.query(VerificationCode).filter(
            VerificationCode.email == email,
            VerificationCode.purpose == purpose,
            VerificationCode.used == False
        ).all()
        
        for code in existing_codes:
            code.used = True
        
        # Create new code
        code = VerificationService.generate_code()
        expires_at = datetime.utcnow() + timedelta(minutes=VERIFICATION_CODE_EXPIRY_MINUTES)
        
        verification_code = VerificationCode(
            user_id=user_id,
            email=email,
            code=code,
            purpose=purpose,
            expires_at=expires_at
        )
        
        db.add(verification_code)
        db.commit()
        db.refresh(verification_code)
        
        return verification_code
    
    @staticmethod
    def verify_code(
        db: Session,
        email: str,
        code: str,
        purpose: str = "login"
    ) -> tuple[bool, str]:
        """Verify a code and return (success, message)"""
        
        verification = db.query(VerificationCode).filter(
            VerificationCode.email == email,
            VerificationCode.code == code,
            VerificationCode.purpose == purpose
        ).first()
        
        if not verification:
            return False, "Invalid verification code"
        
        if verification.used:
            return False, "This code has already been used"
        
        if verification.is_expired:
            return False, "This code has expired"
        
        # Mark as used
        verification.used = True
        
        # If registration, mark user as verified
        if purpose == "registration" and verification.user_id:
            user = db.query(User).filter(User.id == verification.user_id).first()
            if user:
                user.is_verified = True
                user.verified_at = datetime.utcnow()
        
        db.commit()
        
        return True, "Code verified successfully"


# Singleton instance
verification_service = VerificationService()