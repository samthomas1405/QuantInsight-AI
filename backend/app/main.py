from fastapi import FastAPI
from app.db import Base, engine
from app.routes import market_data, news, sentiment, audio, market_data_ws, auth
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
app.include_router(news.router, prefix="/news", tags=["News"])
app.include_router(sentiment.router, prefix="/sentiment", tags=["Sentiment"])
app.include_router(audio.router, prefix="/audio", tags=["Audio"])
# app.include_router(market_data_ws.router)  # This handles /ws/market-data
app.include_router(auth.router)

# Root Endpoint
@app.get("/")
def read_root():
    return {"message": "QuantInsight AI Backend is running!"}
