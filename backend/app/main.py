from fastapi import FastAPI
import os
import debugpy
from app.db import Base, engine
from app.routes import market_data, news, sentiment, audio, live_market, auth, user_stocks, ai_assistant
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
app.include_router(market_data.router, prefix="/market-data", tags=["Market Data"])
app.include_router(news.router, prefix="/news")
app.include_router(sentiment.router, prefix="/sentiment", tags=["Sentiment"])
app.include_router(audio.router, prefix="/audio", tags=["Audio"])
app.include_router(live_market.router)
app.include_router(auth.router)
app.include_router(user_stocks.router)
app.include_router(ai_assistant.router)

# Import and include additional market routers
from app.routes import live_market_simple, live_market_alpha, live_market_polygon, live_market_finnhub
app.include_router(live_market_simple.router)
app.include_router(live_market_alpha.router)
app.include_router(live_market_polygon.router)
app.include_router(live_market_finnhub.router)

# Commenting out the new routers that are causing issues
# from app.routes import market_optimized, market_free
# app.include_router(market_optimized.router)
# app.include_router(market_free.router)

# Root Endpoint
@app.get("/")
def read_root():
    return {"message": "QuantInsight AI Backend is running!"}
