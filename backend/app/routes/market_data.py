from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.models.market_data import MarketData
from app.schemas.market_data import MarketDataCreate, MarketDataOut
from typing import List

router = APIRouter()

@router.post("/", response_model=MarketDataOut)
def create_market_data(data: MarketDataCreate, db: Session = Depends(get_db)):
    db_data = MarketData(symbol=data.symbol, price=data.price)
    db.add(db_data)
    db.commit()
    db.refresh(db_data)
    return db_data

@router.get("/", response_model=List[MarketDataOut])
def read_market_data(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return db.query(MarketData).offset(skip).limit(limit).all()
