from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserOut
from app.auth import hash_password, verify_password, create_access_token, get_current_user
from app.services.email import email_service
from app.services.verification import verification_service
from datetime import timedelta
from pydantic import BaseModel, EmailStr


class EmailVerificationRequest(BaseModel):
    email: EmailStr


class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str


class LoginWithCodeRequest(BaseModel):
    email: EmailStr


router = APIRouter(prefix="/auth/v2", tags=["Auth V2"])


@router.post("/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user and send verification email"""
    if user.password != user.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user (unverified)
    new_user = User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        hashed_password=hash_password(user.password),
        is_verified=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create and send verification code
    verification = verification_service.create_verification_code(
        db=db,
        email=user.email,
        purpose="registration",
        user_id=new_user.id
    )
    
    email_service.send_verification_code(
        to_email=user.email,
        code=verification.code,
        purpose="registration"
    )
    
    return new_user


@router.post("/verify-registration")
def verify_registration(request: VerifyCodeRequest, db: Session = Depends(get_db)):
    """Verify registration with code"""
    success, message = verification_service.verify_code(
        db=db,
        email=request.email,
        code=request.code,
        purpose="registration"
    )
    
    if not success:
        raise HTTPException(status_code=400, detail=message)
    
    # Get user and create token
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Send welcome email
    email_service.send_welcome_email(user.email, user.first_name)
    
    # Create access token
    token = create_access_token({"sub": user.email}, expires_delta=timedelta(days=7))
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "message": "Email verified successfully"
    }


@router.post("/send-login-code")
def send_login_code(request: LoginWithCodeRequest, db: Session = Depends(get_db)):
    """Send login verification code to email"""
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.is_verified:
        raise HTTPException(status_code=400, detail="Please verify your email first")
    
    # Create and send verification code
    verification = verification_service.create_verification_code(
        db=db,
        email=user.email,
        purpose="login",
        user_id=user.id
    )
    
    email_service.send_verification_code(
        to_email=user.email,
        code=verification.code,
        purpose="login"
    )
    
    return {"message": "Verification code sent to your email"}


@router.post("/login-with-code")
def login_with_code(request: VerifyCodeRequest, db: Session = Depends(get_db)):
    """Login with verification code"""
    success, message = verification_service.verify_code(
        db=db,
        email=request.email,
        code=request.code,
        purpose="login"
    )
    
    if not success:
        raise HTTPException(status_code=400, detail=message)
    
    # Get user and create token
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    token = create_access_token({"sub": user.email}, expires_delta=timedelta(days=7))
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "message": "Login successful"
    }


@router.post("/login-with-password")
def login_with_password(user: UserLogin, db: Session = Depends(get_db)):
    """Traditional login with password"""
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    if not db_user.is_verified:
        raise HTTPException(status_code=400, detail="Please verify your email first")
    
    token = create_access_token({"sub": db_user.email}, expires_delta=timedelta(days=7))
    return {"access_token": token, "token_type": "bearer"}


@router.post("/resend-verification")
def resend_verification(request: EmailVerificationRequest, db: Session = Depends(get_db)):
    """Resend verification code"""
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email already verified")
    
    # Create and send new code
    verification = verification_service.create_verification_code(
        db=db,
        email=user.email,
        purpose="registration",
        user_id=user.id
    )
    
    email_service.send_verification_code(
        to_email=user.email,
        code=verification.code,
        purpose="registration"
    )
    
    return {"message": "Verification code resent"}