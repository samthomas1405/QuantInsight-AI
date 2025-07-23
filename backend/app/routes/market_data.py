from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.auth import get_current_user
from app.models.market_data import MarketData
from app.models.user import User
from app.schemas.market_data import MarketDataOut
from typing import List
import logging

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/", response_model=List[MarketDataOut])
def read_market_data(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    try:
        return db.query(MarketData).offset(skip).limit(limit).all()
    except Exception as e:
        logger.error(f"Error reading market data: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch market data")

@router.get("/followed", response_model=List[MarketDataOut])
def get_followed_market_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Check if user exists and has followed stocks
        if not current_user:
            raise HTTPException(status_code=401, detail="User not authenticated")
        
        # Get followed stock symbols
        symbols = [stock.symbol for stock in current_user.followed_stocks]
        logger.info(f"User {current_user.id} followed symbols: {symbols}")
        
        if not symbols:
            logger.info(f"User {current_user.id} has no followed stocks")
            return []
        
        # Query market data for followed stocks
        market_data_query = db.query(MarketData).filter(MarketData.symbol.in_(symbols))
        logger.info(f"Market data query: {market_data_query}")
        
        market_data = market_data_query.all()
        logger.info(f"Found {len(market_data)} market data records")
        
        return market_data
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Error getting followed market data for user {current_user.id if current_user else 'unknown'}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch followed market data: {str(e)}")

@router.get("/history/{symbol}")
def get_stock_history(symbol: str, db: Session = Depends(get_db)):
    try:
        # Get historical data for a specific symbol
        history = db.query(MarketData).filter(
            MarketData.symbol == symbol.upper()
        ).order_by(MarketData.timestamp.desc()).limit(100).all()
        
        if not history:
            logger.warning(f"No history found for symbol: {symbol}")
            return []
        
        # Convert to the format expected by the frontend
        return [
            {
                "symbol": item.symbol,
                "price": float(item.price),
                "timestamp": item.timestamp.isoformat() if hasattr(item.timestamp, 'isoformat') else str(item.timestamp)
            }
            for item in reversed(history)  # Reverse to get chronological order
        ]
        
    except Exception as e:
        logger.error(f"Error getting stock history for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch stock history: {str(e)}")