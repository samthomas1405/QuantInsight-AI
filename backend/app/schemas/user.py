from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import List
from .stock import StockOut

class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(UserBase):
    id: int
    created_at: datetime
    has_completed_setup: bool  # ✅ Add this
    followed_stocks: List[StockOut] = []

    class Config:
        orm_mode = True
