from pydantic import BaseModel

class StockBase(BaseModel):
    symbol: str
    name: str

class StockOut(StockBase):
    class Config:
        orm_mode = True
