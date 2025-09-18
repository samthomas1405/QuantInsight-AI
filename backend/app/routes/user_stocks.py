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
    
    if not q:
        return []
    
    # First try to search in database - ONLY stocks that START with query
    # Order by: symbol matches first, then name matches
    symbol_results = db.query(Stock).filter(
        Stock.symbol.ilike(f"{q}%")
    ).all()
    
    name_results = db.query(Stock).filter(
        Stock.name.ilike(f"{q}%")
    ).all()
    
    # Combine results, avoiding duplicates
    results = symbol_results + [stock for stock in name_results if stock not in symbol_results]
    results = results[:20]  # Limit to 20 results
    
    # If no results from database, search in TOP_STOCKS
    if not results:
        q_upper = q.upper()
        
        # Filter TOP_STOCKS - First symbol matches, then company name matches
        symbol_matches = []
        name_matches = []
        
        for stock in TOP_STOCKS:
            # Check if symbol starts with query
            if stock["symbol"].upper().startswith(q_upper):
                symbol_matches.append(stock)
            # Check if company name starts with query
            elif stock["name"].upper().startswith(q_upper):
                name_matches.append(stock)
        
        # Combine results: symbol matches first, then name matches
        filtered_stocks = symbol_matches + name_matches
        
        # Convert to proper format for response
        results = filtered_stocks[:20]  # Limit to 20 results
    
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
    {"symbol": "DIS", "name": "Walt Disney Company"},
    {"symbol": "V", "name": "Visa Inc."},
    {"symbol": "MA", "name": "Mastercard Inc."},
    {"symbol": "JNJ", "name": "Johnson & Johnson"},
    {"symbol": "WMT", "name": "Walmart Inc."},
    {"symbol": "PG", "name": "Procter & Gamble Co."},
    {"symbol": "HD", "name": "Home Depot Inc."},
    {"symbol": "BAC", "name": "Bank of America Corp."},
    {"symbol": "ADBE", "name": "Adobe Inc."},
    {"symbol": "CRM", "name": "Salesforce Inc."},
    {"symbol": "PFE", "name": "Pfizer Inc."},
    {"symbol": "CSCO", "name": "Cisco Systems Inc."},
    {"symbol": "INTC", "name": "Intel Corporation"},
    {"symbol": "AMD", "name": "Advanced Micro Devices Inc."},
    {"symbol": "ORCL", "name": "Oracle Corporation"},
    {"symbol": "IBM", "name": "International Business Machines"},
    {"symbol": "GS", "name": "Goldman Sachs Group Inc."},
    {"symbol": "MS", "name": "Morgan Stanley"},
    {"symbol": "PYPL", "name": "PayPal Holdings Inc."},
    {"symbol": "SNAP", "name": "Snap Inc."},
    {"symbol": "SQ", "name": "Block Inc."},
    {"symbol": "SPOT", "name": "Spotify Technology"},
    {"symbol": "UBER", "name": "Uber Technologies Inc."},
    {"symbol": "LYFT", "name": "Lyft Inc."},
    {"symbol": "ZM", "name": "Zoom Video Communications"},
    {"symbol": "DOCU", "name": "DocuSign Inc."},
    {"symbol": "SHOP", "name": "Shopify Inc."},
    {"symbol": "RBLX", "name": "Roblox Corporation"},
    {"symbol": "COIN", "name": "Coinbase Global Inc."},
    {"symbol": "PLTR", "name": "Palantir Technologies Inc."},
    {"symbol": "SNOW", "name": "Snowflake Inc."},
    {"symbol": "DDOG", "name": "Datadog Inc."},
    {"symbol": "ABNB", "name": "Airbnb Inc."},
    {"symbol": "DASH", "name": "DoorDash Inc."},
    {"symbol": "ROKU", "name": "Roku Inc."},
    {"symbol": "PINS", "name": "Pinterest Inc."},
    {"symbol": "TWTR", "name": "Twitter Inc."},
    {"symbol": "HOOD", "name": "Robinhood Markets Inc."},
    {"symbol": "GME", "name": "GameStop Corp."},
    {"symbol": "AMC", "name": "AMC Entertainment Holdings"},
    {"symbol": "MU", "name": "Micron Technology Inc."},
    {"symbol": "MCD", "name": "McDonald's Corporation"},
    {"symbol": "MMM", "name": "3M Company"},
    {"symbol": "MRK", "name": "Merck & Co. Inc."},
    {"symbol": "MDT", "name": "Medtronic plc"},
    {"symbol": "MET", "name": "MetLife Inc."},
    {"symbol": "MELI", "name": "MercadoLibre Inc."},
    {"symbol": "MRNA", "name": "Moderna Inc."},
    {"symbol": "MDB", "name": "MongoDB Inc."},
    {"symbol": "MDLZ", "name": "Mondelez International Inc."}
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
