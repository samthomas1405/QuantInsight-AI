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
