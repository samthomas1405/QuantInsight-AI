from fastapi import FastAPI
import os
import debugpy
from app.db import Base, engine
# Import all models to ensure they're registered with SQLAlchemy
from app.models import User, Stock, VerificationCode, AnalysisHistory
from app.routes import news, sentiment, audio, auth, user_stocks, ai_assistant, auth_v2, analysis_history, news_comparison, market_impact
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Initialize DB
Base.metadata.create_all(bind=engine)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(news.router, prefix="/news")
app.include_router(sentiment.router, prefix="/sentiment", tags=["Sentiment"])
app.include_router(market_impact.router, prefix="/market-impact", tags=["Market Impact"])
app.include_router(audio.router, prefix="/audio", tags=["Audio"])
app.include_router(auth.router)
app.include_router(auth_v2.router)  # New auth routes with email verification
app.include_router(user_stocks.router)
app.include_router(ai_assistant.router)
app.include_router(analysis_history.router, prefix="/api", tags=["Analysis History"])
app.include_router(news_comparison.router, prefix="/news", tags=["Stock Comparison"])

# Import and include additional market routers
from app.routes import live_market_alpha, live_market_finnhub, live_market_alpaca
app.include_router(live_market_alpha.router)
app.include_router(live_market_finnhub.router)
app.include_router(live_market_alpaca.router)


# Root Endpoint
@app.get("/")
def read_root():
    return {"message": "QuantInsight AI Backend is running!"}
