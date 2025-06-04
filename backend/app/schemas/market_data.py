from pydantic import BaseModel
from datetime import datetime

class MarketDataCreate(BaseModel):
    symbol: str
    price: float

class MarketDataOut(BaseModel):
    id: int
    symbol: str
    price: float
    timestamp: datetime

    class Config:
        orm_mode = True
