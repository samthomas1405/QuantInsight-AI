from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.auth import get_current_user
from app.models.user import User
from app.models.stock import Stock

router = APIRouter(prefix="/user/stocks", tags=["UserStocks"])

def get_followed_stock_symbols(user_id: int, db: Session):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return []
    return [stock.symbol for stock in user.followed_stocks]

@router.get("/")
def get_user_stocks(current_user: User = Depends(get_current_user)):
    return current_user.stocks


@router.post("/")
def add_stock_to_user(symbol: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    stock = db.query(Stock).filter_by(symbol=symbol).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    if stock in current_user.followed_stocks:
        raise HTTPException(status_code=400, detail="Stock already followed")
    current_user.followed_stocks.append(stock)
    db.commit()
    return {"message": f"Stock {symbol} added."}

@router.delete("/{symbol}")
def remove_stock_from_user(symbol: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    stock = db.query(Stock).filter_by(symbol=symbol).first()
    if not stock or stock not in current_user.followed_stocks:
        raise HTTPException(status_code=404, detail="Stock not followed")
    current_user.followed_stocks.remove(stock)
    db.commit()
    return {"message": f"Stock {symbol} removed."}

@router.get("/search")
def search_stocks(q: str, db: Session = Depends(get_db)):
    q = q.strip()
    results = db.query(Stock).filter(
        (Stock.symbol.ilike(f"{q}%")) | (Stock.name.ilike(f"{q}%"))
    ).limit(20).all()
    return results

TOP_STOCKS = [
    {"symbol": "AAPL", "name": "Apple Inc."},
    {"symbol": "MSFT", "name": "Microsoft Corporation"},
    {"symbol": "AMZN", "name": "Amazon.com Inc."},
    {"symbol": "GOOGL", "name": "Alphabet Inc."},
    {"symbol": "TSLA", "name": "Tesla Inc."},
    {"symbol": "META", "name": "Meta Platforms Inc."},
    {"symbol": "NVDA", "name": "NVIDIA Corporation"},
    {"symbol": "JPM", "name": "JPMorgan Chase & Co."},
    {"symbol": "BRK.B", "name": "Berkshire Hathaway Inc."},
    {"symbol": "NFLX", "name": "Netflix Inc."},
]

@router.post("/initialize-popular")
def initialize_popular_stocks(db: Session = Depends(get_db)):
    for stock_data in TOP_STOCKS:
        stock = db.query(Stock).filter_by(symbol=stock_data["symbol"]).first()
        if stock:
            stock.name = stock_data["name"]  # Optional update
        else:
            db.add(Stock(**stock_data))
    db.commit()
    return {"message": "Popular stocks initialized/updated successfully."}

@router.get("/symbols")
def get_user_stock_symbols(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    symbols = get_followed_stock_symbols(current_user.id, db)
    return {"symbols": symbols}
