from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.auth import get_current_user
from app.models.market_data import MarketData
from app.models.user import User
from app.schemas.market_data import MarketDataOut
from typing import List

router = APIRouter()

@router.get("/", response_model=List[MarketDataOut])
def read_market_data(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return db.query(MarketData).offset(skip).limit(limit).all()

@router.get("/followed", response_model=List[MarketDataOut])
def get_followed_market_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    symbols = [stock.symbol for stock in current_user.followed_stocks]
    print(symbols)
    if not symbols:
        return []
    print(db.query(MarketData).filter(MarketData.symbol.in_(symbols)))
    return db.query(MarketData).filter(MarketData.symbol.in_(symbols)).all()
