from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Optional
import requests
from bs4 import BeautifulSoup
import re
import yfinance as yf
from datetime import datetime, timedelta
import logging
from transformers import pipeline
import nltk
from app.auth import get_current_user
from app.models import User
from sqlalchemy.orm import Session
from app.dependencies import get_db
import time
from functools import lru_cache

# Try to download required NLTK data
try:
    nltk.data.find('tokenizers/punkt_tab')
except LookupError:
    try:
        nltk.download('punkt_tab')
    except:
        try:
            nltk.download('punkt')
        except:
            pass

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize models
summarizer = pipeline("summarization", model="facebook/bart-large-cnn", max_length=150, min_length=30)
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

class MarketImpactInput(BaseModel):
    text: Optional[str] = None
    url: Optional[str] = None

class StockImpact(BaseModel):
    ticker: str
    company_name: str
    current_price: float
    predicted_impact: str  # "Strong Positive", "Positive", "Neutral", "Negative", "Strong Negative"
    impact_percentage: str  # "+5-10%", "+2-5%", etc.
    confidence: float
    reasons: List[str]
    recommendation: str  # "Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"
    timeframe: str  # "Immediate (1-2 days)", "Short-term (1 week)", etc.

class MarketImpactOutput(BaseModel):
    summary: str
    original_length: int
    key_points: List[str]
    affected_stocks: List[StockImpact]
    sector_impacts: Dict[str, str]
    market_sentiment: str
    event_type: str  # "Earnings", "M&A", "Product Launch", etc.
    impact_timeline: str
    source_type: str  # "text" or "url"

def extract_text_from_url(url: str) -> str:
    """Extract text content from a URL"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
        }
        
        session = requests.Session()
        response = session.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        
        # Get text
        text = soup.get_text(separator=' ', strip=True)
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Limit length
        if len(text) > 5000:
            text = text[:5000] + "..."
        
        return text
        
    except requests.HTTPError as e:
        if e.response.status_code in [403, 401]:
            raise HTTPException(
                status_code=400,
                detail="This website has blocked automated access. Please copy and paste the article text directly."
            )
        raise HTTPException(status_code=400, detail=f"Error fetching URL: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing content: {str(e)}")

@lru_cache(maxsize=100)
def get_stock_info(ticker: str) -> Optional[Dict[str, any]]:
    """Get stock info with caching and rate limiting"""
    try:
        time.sleep(0.5)  # Rate limit: 2 requests per second
        stock = yf.Ticker(ticker)
        info = stock.info
        if info and (info.get('regularMarketPrice') or info.get('currentPrice')):
            return info
    except requests.HTTPError as e:
        if e.response.status_code == 429:
            logger.warning(f"Rate limited for {ticker}, using fallback")
        else:
            logger.warning(f"HTTP error for {ticker}: {e}")
    except Exception as e:
        logger.warning(f"Failed to get info for {ticker}: {e}")
    return None

def extract_stock_tickers(text: str) -> List[Dict[str, str]]:
    """Extract stock tickers and company names from text"""
    # Common stock ticker patterns
    ticker_pattern = r'\b([A-Z]{1,5})\b(?:\s*[\(\:]?\s*(?:NYSE|NASDAQ|NASD|[Tt]icker|Stock Symbol))?'
    
    # Known company to ticker mappings with full names
    company_ticker_map = {
        'apple': ('AAPL', 'Apple Inc.'), 
        'google': ('GOOGL', 'Alphabet Inc.'), 
        'alphabet': ('GOOGL', 'Alphabet Inc.'), 
        'microsoft': ('MSFT', 'Microsoft Corporation'),
        'amazon': ('AMZN', 'Amazon.com Inc.'), 
        'tesla': ('TSLA', 'Tesla Inc.'), 
        'meta': ('META', 'Meta Platforms Inc.'), 
        'facebook': ('META', 'Meta Platforms Inc.'),
        'netflix': ('NFLX', 'Netflix Inc.'), 
        'nvidia': ('NVDA', 'NVIDIA Corporation'), 
        'intel': ('INTC', 'Intel Corporation'), 
        'amd': ('AMD', 'Advanced Micro Devices Inc.'),
        'jp morgan': ('JPM', 'JPMorgan Chase & Co.'), 
        'jpmorgan': ('JPM', 'JPMorgan Chase & Co.'), 
        'goldman sachs': ('GS', 'Goldman Sachs Group Inc.'), 
        'goldman': ('GS', 'Goldman Sachs Group Inc.'),
        'berkshire': ('BRK.B', 'Berkshire Hathaway Inc.'), 
        'walmart': ('WMT', 'Walmart Inc.'), 
        'disney': ('DIS', 'Walt Disney Company'), 
        'coca-cola': ('KO', 'Coca-Cola Company'),
        'pepsi': ('PEP', 'PepsiCo Inc.'), 
        'johnson & johnson': ('JNJ', 'Johnson & Johnson'), 
        'pfizer': ('PFE', 'Pfizer Inc.'), 
        'moderna': ('MRNA', 'Moderna Inc.'),
        'visa': ('V', 'Visa Inc.'), 
        'mastercard': ('MA', 'Mastercard Inc.'), 
        'paypal': ('PYPL', 'PayPal Holdings Inc.'), 
        'square': ('SQ', 'Block Inc.'),
        'spotify': ('SPOT', 'Spotify Technology'), 
        'uber': ('UBER', 'Uber Technologies Inc.'), 
        'lyft': ('LYFT', 'Lyft Inc.'), 
        'airbnb': ('ABNB', 'Airbnb Inc.'),
        'boeing': ('BA', 'Boeing Company'), 
        'lockheed': ('LMT', 'Lockheed Martin'), 
        'general motors': ('GM', 'General Motors'), 
        'ford': ('F', 'Ford Motor Company'),
        'exxon': ('XOM', 'Exxon Mobil Corporation'), 
        'chevron': ('CVX', 'Chevron Corporation'), 
        'shell': ('SHEL', 'Shell plc'), 
        'bp': ('BP', 'BP plc')
    }
    
    found_tickers = {}  # ticker -> name
    text_lower = text.lower()
    
    # Find tickers by company name (fast, no API calls)
    for company, (ticker, full_name) in company_ticker_map.items():
        if company in text_lower:
            found_tickers[ticker] = full_name
    
    # Find explicit ticker symbols in text
    potential_tickers = re.findall(ticker_pattern, text)
    
    # Process found tickers
    validated_tickers = []
    
    # First add the ones we found by company name (no API needed)
    for ticker, name in found_tickers.items():
        validated_tickers.append({
            'ticker': ticker,
            'name': name
        })
        if len(validated_tickers) >= 5:
            return validated_tickers
    
    # Then check potential tickers from regex (requires API)
    for ticker in potential_tickers[:5]:  # Limit to avoid rate limiting
        ticker = ticker.upper()
        if (len(ticker) <= 5 and ticker.isalpha() and 
            ticker not in ['I', 'A', 'AN', 'THE', 'FOR', 'AND', 'OR', 'BUT'] and
            ticker not in found_tickers):
            
            # Try to get info from API
            info = get_stock_info(ticker)
            if info:
                validated_tickers.append({
                    'ticker': ticker,
                    'name': info.get('longName', info.get('shortName', ticker))
                })
            else:
                # If API fails, just use ticker symbol
                validated_tickers.append({
                    'ticker': ticker,
                    'name': ticker
                })
            
            if len(validated_tickers) >= 5:
                break
    
    return validated_tickers

def classify_event_type(text: str) -> str:
    """Classify the type of market event"""
    event_types = [
        "Earnings Report",
        "Merger & Acquisition",
        "Product Launch",
        "Regulatory News",
        "Management Change",
        "Market Analysis",
        "Economic Data",
        "Legal/Lawsuit",
        "Partnership/Deal",
        "Stock Upgrade/Downgrade"
    ]
    
    try:
        result = classifier(text[:1000], candidate_labels=event_types)
        return result['labels'][0] if result['scores'][0] > 0.3 else "General News"
    except:
        return "General News"

def predict_stock_impact(ticker: str, company_name: str, text: str, event_type: str) -> StockImpact:
    """Predict the impact on a specific stock based on the news"""
    try:
        # Get current stock data
        info = get_stock_info(ticker)
        current_price = info.get('regularMarketPrice', info.get('currentPrice', 0)) if info else 0
        
        # If we couldn't get price, use dummy price for demo purposes
        if current_price == 0:
            # Dummy prices for common stocks
            dummy_prices = {
                'AAPL': 195.89, 'MSFT': 423.85, 'GOOGL': 175.94, 'AMZN': 186.44,
                'TSLA': 251.05, 'META': 521.70, 'NVDA': 878.37, 'JPM': 201.87,
                'NFLX': 639.68, 'DIS': 111.04, 'AMD': 165.11, 'INTC': 44.92
            }
            current_price = dummy_prices.get(ticker, 100.00)
        
        # Analyze sentiment specific to this stock
        stock_context = f"{company_name} {ticker}"
        text_lower = text.lower()
        
        # Keywords for different impact levels
        strong_positive = ['breakthrough', 'record', 'surge', 'soar', 'exceptional', 'beat expectations', 'upgraded']
        positive = ['growth', 'profit', 'increase', 'gain', 'improve', 'positive', 'expand']
        negative = ['loss', 'decline', 'fall', 'concern', 'challenge', 'miss expectations', 'downgraded']
        strong_negative = ['crash', 'plunge', 'bankruptcy', 'investigation', 'fraud', 'lawsuit', 'recall']
        
        # Calculate impact
        impact_score = 0
        reasons = []
        
        # Check keywords
        for keyword in strong_positive:
            if keyword in text_lower and stock_context.lower() in text_lower:
                impact_score += 2
                reasons.append(f"Strong positive indicator: '{keyword}'")
        
        for keyword in positive:
            if keyword in text_lower and stock_context.lower() in text_lower:
                impact_score += 1
                reasons.append(f"Positive indicator: '{keyword}'")
        
        for keyword in negative:
            if keyword in text_lower and stock_context.lower() in text_lower:
                impact_score -= 1
                reasons.append(f"Negative indicator: '{keyword}'")
        
        for keyword in strong_negative:
            if keyword in text_lower and stock_context.lower() in text_lower:
                impact_score -= 2
                reasons.append(f"Strong negative indicator: '{keyword}'")
        
        # Event type impact
        event_impacts = {
            "Earnings Report": 1.5,
            "Merger & Acquisition": 1.2,
            "Product Launch": 0.8,
            "Regulatory News": -0.5,
            "Legal/Lawsuit": -1.0,
            "Stock Upgrade/Downgrade": 1.0
        }
        
        if event_type in event_impacts:
            impact_score *= event_impacts[event_type]
            reasons.append(f"Event type: {event_type}")
        
        # Determine impact level
        if impact_score >= 3:
            predicted_impact = "Strong Positive"
            impact_percentage = "+5-10%"
            recommendation = "Strong Buy"
            confidence = min(0.85, 0.5 + abs(impact_score) * 0.1)
        elif impact_score >= 1:
            predicted_impact = "Positive"
            impact_percentage = "+2-5%"
            recommendation = "Buy"
            confidence = min(0.75, 0.5 + abs(impact_score) * 0.1)
        elif impact_score <= -3:
            predicted_impact = "Strong Negative"
            impact_percentage = "-5-10%"
            recommendation = "Strong Sell"
            confidence = min(0.85, 0.5 + abs(impact_score) * 0.1)
        elif impact_score <= -1:
            predicted_impact = "Negative"
            impact_percentage = "-2-5%"
            recommendation = "Sell"
            confidence = min(0.75, 0.5 + abs(impact_score) * 0.1)
        else:
            predicted_impact = "Neutral"
            impact_percentage = "-1% to +1%"
            recommendation = "Hold"
            confidence = 0.6
        
        # Determine timeframe
        if event_type in ["Earnings Report", "Stock Upgrade/Downgrade"]:
            timeframe = "Immediate (1-2 days)"
        elif event_type in ["Product Launch", "Partnership/Deal"]:
            timeframe = "Short-term (1-2 weeks)"
        else:
            timeframe = "Medium-term (2-4 weeks)"
        
        if not reasons:
            reasons = ["General market sentiment"]
        
        return StockImpact(
            ticker=ticker,
            company_name=company_name,
            current_price=float(current_price) if current_price else 0.0,
            predicted_impact=predicted_impact,
            impact_percentage=impact_percentage,
            confidence=confidence,
            reasons=reasons[:3],  # Limit to top 3 reasons
            recommendation=recommendation,
            timeframe=timeframe
        )
    except Exception as e:
        logger.error(f"Error predicting impact for {ticker}: {e}")
        return StockImpact(
            ticker=ticker,
            company_name=company_name,
            current_price=0.0,
            predicted_impact="Unknown",
            impact_percentage="N/A",
            confidence=0.0,
            reasons=["Unable to analyze"],
            recommendation="Hold",
            timeframe="Unknown"
        )

def identify_sector_impacts(affected_stocks: List[StockImpact], text: str) -> Dict[str, str]:
    """Identify broader sector impacts"""
    # Predefined sector mappings to avoid API calls
    ticker_sectors = {
        'AAPL': 'Technology', 'MSFT': 'Technology', 'GOOGL': 'Technology', 'META': 'Technology',
        'AMZN': 'Consumer Cyclical', 'TSLA': 'Consumer Cyclical', 'DIS': 'Communication Services',
        'NFLX': 'Communication Services', 'NVDA': 'Technology', 'INTC': 'Technology', 'AMD': 'Technology',
        'JPM': 'Financial Services', 'GS': 'Financial Services', 'V': 'Financial Services', 'MA': 'Financial Services',
        'WMT': 'Consumer Defensive', 'KO': 'Consumer Defensive', 'PEP': 'Consumer Defensive',
        'JNJ': 'Healthcare', 'PFE': 'Healthcare', 'MRNA': 'Healthcare',
        'BA': 'Industrials', 'LMT': 'Industrials', 'GM': 'Consumer Cyclical', 'F': 'Consumer Cyclical',
        'XOM': 'Energy', 'CVX': 'Energy', 'SHEL': 'Energy', 'BP': 'Energy'
    }
    
    sectors = {}
    
    # Get sectors for affected stocks
    for stock_impact in affected_stocks:
        try:
            # First try predefined mapping
            sector = ticker_sectors.get(stock_impact.ticker, None)
            
            # If not found, try API
            if not sector:
                info = get_stock_info(stock_impact.ticker)
                if info:
                    sector = info.get('sector', 'Unknown')
            
            if sector and sector != 'Unknown':
                if sector not in sectors:
                    sectors[sector] = []
                sectors[sector].append(stock_impact.predicted_impact)
        except:
            continue
    
    # Analyze sector impacts
    sector_impacts = {}
    for sector, impacts in sectors.items():
        positive_count = sum(1 for i in impacts if 'Positive' in i)
        negative_count = sum(1 for i in impacts if 'Negative' in i)
        
        if positive_count > negative_count:
            sector_impacts[sector] = "Positive momentum expected"
        elif negative_count > positive_count:
            sector_impacts[sector] = "Negative pressure expected"
        else:
            sector_impacts[sector] = "Mixed signals"
    
    return sector_impacts

def extract_key_points(text: str) -> List[str]:
    """Extract key bullet points from the article"""
    try:
        sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    except:
        sentences = text.split('. ')
    
    # Look for sentences with important information
    key_patterns = [
        r'\d+%',  # Percentages
        r'\$[\d,]+',  # Dollar amounts
        r'announce[ds]?',
        r'report[eds]?',
        r'expect[eds]?',
        r'forecast',
        r'earnings',
        r'revenue',
        r'profit',
        r'loss'
    ]
    
    key_points = []
    for sentence in sentences[:20]:  # Check first 20 sentences
        if any(re.search(pattern, sentence, re.IGNORECASE) for pattern in key_patterns):
            if len(sentence) < 200:  # Reasonable length
                key_points.append(sentence.strip())
                if len(key_points) >= 5:
                    break
    
    return key_points if key_points else ["Key information extraction in progress"]

@router.post("/analyze", response_model=MarketImpactOutput)
async def analyze_market_impact(
    input: MarketImpactInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Analyze market impact of news article"""
    if not input.text and not input.url:
        raise HTTPException(status_code=400, detail="Either text or URL must be provided")
    
    # Get text content
    if input.url:
        text_to_analyze = extract_text_from_url(input.url)
        source_type = "url"
    else:
        text_to_analyze = input.text
        source_type = "text"
    
    if not text_to_analyze or len(text_to_analyze.strip()) == 0:
        raise HTTPException(status_code=400, detail="No text content found to analyze")
    
    # Generate summary
    try:
        summary_result = summarizer(text_to_analyze[:1024], max_length=150, min_length=30, do_sample=False)
        summary = summary_result[0]['summary_text']
    except:
        summary = "Summary generation in progress..."
    
    # Extract key points
    key_points = extract_key_points(text_to_analyze)
    
    # Extract stock tickers
    affected_stocks_data = extract_stock_tickers(text_to_analyze)
    
    # Classify event type
    event_type = classify_event_type(text_to_analyze)
    
    # Analyze impact for each stock
    affected_stocks = []
    for stock_data in affected_stocks_data:
        impact = predict_stock_impact(
            stock_data['ticker'],
            stock_data['name'],
            text_to_analyze,
            event_type
        )
        affected_stocks.append(impact)
    
    # Identify sector impacts
    sector_impacts = identify_sector_impacts(affected_stocks, text_to_analyze)
    
    # Determine overall market sentiment
    if affected_stocks:
        positive_impacts = sum(1 for s in affected_stocks if 'Positive' in s.predicted_impact)
        negative_impacts = sum(1 for s in affected_stocks if 'Negative' in s.predicted_impact)
        
        if positive_impacts > negative_impacts * 1.5:
            market_sentiment = "Bullish"
        elif negative_impacts > positive_impacts * 1.5:
            market_sentiment = "Bearish"
        else:
            market_sentiment = "Mixed"
    else:
        market_sentiment = "Neutral"
    
    # Determine impact timeline
    if event_type in ["Earnings Report", "Stock Upgrade/Downgrade"]:
        impact_timeline = "Immediate market reaction expected (1-2 days)"
    elif event_type in ["Product Launch", "Partnership/Deal"]:
        impact_timeline = "Gradual impact over 1-2 weeks"
    else:
        impact_timeline = "Impact may unfold over 2-4 weeks"
    
    return MarketImpactOutput(
        summary=summary,
        original_length=len(text_to_analyze),
        key_points=key_points[:5],
        affected_stocks=affected_stocks,
        sector_impacts=sector_impacts,
        market_sentiment=market_sentiment,
        event_type=event_type,
        impact_timeline=impact_timeline,
        source_type=source_type
    )