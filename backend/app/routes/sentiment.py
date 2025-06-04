from fastapi import APIRouter
from pydantic import BaseModel
from app.schemas.sentiment import SentimentInput, SentimentOutput
from transformers import pipeline

router = APIRouter()

sentiment_pipeline = pipeline("sentiment-analysis")

class SentimentInput(BaseModel):
    text: str

class SentimentOutput(BaseModel):
    label: str
    score: float

@router.post("/", response_model=SentimentOutput)
def analyze_sentiment(input: SentimentInput):
    result = sentiment_pipeline(input.text)[0]
    return {"label": result["label"], "score": result["score"]}
