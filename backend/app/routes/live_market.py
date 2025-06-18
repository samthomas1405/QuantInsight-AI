from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.auth import get_current_user
from app.models.user import User
import os
import requests
from typing import List

router = APIRouter(prefix="/market-live", tags=["Market"])

API_KEY = os.getenv("TWELVE_DATA_API_KEY")

def fetch_live_prices(symbols: List[str]):
    # Batch symbols up to 30 at a time
    joined = ",".join(symbols)
    url = f"https://api.twelvedata.com/price?symbol={joined}&apikey={API_KEY}"

    try:
        res = requests.get(url, timeout=5)
        res.raise_for_status()
        return res.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch live prices: {str(e)}")

@router.get("/followed")
def get_followed_stock_prices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    symbols = [stock.symbol for stock in current_user.followed_stocks]
    if not symbols:
        return []

    # Limit to 30 symbols per API call
    limited = symbols[:30]
    return fetch_live_prices(limited)

@router.get("/history/{symbol}")
def get_stock_history(symbol: str):
    url = f"https://api.twelvedata.com/time_series?symbol={symbol}&interval=1min&outputsize=5000&apikey={API_KEY}"
    try:
        response = requests.get(url)
        data = response.json()
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch stock data.")

    if "values" not in data:
        raise HTTPException(status_code=500, detail=data.get("message", "No data returned."))

    return [
        {
            "timestamp": item["datetime"],
            "price": float(item["close"])
        } for item in reversed(data["values"])
    ]