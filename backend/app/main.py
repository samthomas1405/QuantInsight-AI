from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import SessionLocal, Base, engine
from app.models.market_data import MarketData
from pydantic import BaseModel
from typing import List
from datetime import datetime
from transformers import pipeline

# Initialize FastAPI
app = FastAPI()

# Create tables (ensure DB is connected)
Base.metadata.create_all(bind=engine)

# HuggingFace Sentiment Analysis Pipeline
sentiment_pipeline = pipeline("sentiment-analysis")

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic schemas
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
class SentimentInput(BaseModel):
    text: str

class SentimentOutput(BaseModel):
    label: str
    score: float

# Root route
@app.get("/")
def read_root():
    return {"message": "QuantInsight AI Backend is running!"}

# POST: Insert market data
@app.post("/market-data/", response_model=MarketDataOut)
def create_market_data(data: MarketDataCreate, db: Session = Depends(get_db)):
    db_data = MarketData(symbol=data.symbol, price=data.price)
    db.add(db_data)
    db.commit()
    db.refresh(db_data)
    return db_data

# GET: Retrieve market data
@app.get("/market-data/", response_model=List[MarketDataOut])
def read_market_data(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return db.query(MarketData).offset(skip).limit(limit).all()

# POST: Sentiment analysis
@app.post("/sentiment/", response_model=SentimentOutput)
def analyze_sentiment(input: SentimentInput):
    result = sentiment_pipeline(input.text)[0]
    return {"label": result["label"], "score": result["score"]}
