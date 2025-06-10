from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserOut
from app.auth import hash_password, verify_password, create_access_token, get_current_user
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    if user.password != user.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        hashed_password=hash_password(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": db_user.email}, expires_delta=timedelta(minutes=30))
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
def read_users_me(current_user = Depends(get_current_user)):
    return current_user

@router.post("/complete-setup")
def complete_setup(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.has_completed_setup = True
    db.commit()
    return {"message": "Setup completed."}