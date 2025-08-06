"""
Yahoo Finance News Integration
Fetches real-time news directly from Yahoo Finance for stocks
"""

import yfinance as yf
from datetime import datetime
import logging
from typing import List, Dict, Optional
import requests
from bs4 import BeautifulSoup
import json

logger = logging.getLogger(__name__)

def fetch_yahoo_finance_news(symbol: str) -> List[Dict]:
    """
    Fetch latest news for a stock symbol directly from Yahoo Finance
    
    Args:
        symbol: Stock symbol (e.g., 'AAPL', 'DIS')
        
    Returns:
        List of news articles with title, link, publisher, timestamp, and snippet
    """
    try:
        # Create ticker object
        ticker = yf.Ticker(symbol)
        
        # Get news from yfinance
        news_data = ticker.news
        
        if not news_data:
            logger.warning(f"No news found for {symbol}")
            return []
        
        formatted_news = []
        
        for article in news_data:
            try:
                # Extract relevant fields
                news_item = {
                    "title": article.get("title", ""),
                    "url": article.get("link", ""),
                    "source": article.get("publisher", "Yahoo Finance"),
                    "symbol": symbol,
                    "snippet": "",  # Will be populated below
                    "timestamp": None,  # Will be set from providerPublishTime
                    "thumbnail": article.get("thumbnail", {}).get("resolutions", [{}])[0].get("url", "") if article.get("thumbnail") else ""
                }
                
                # Handle timestamp
                if "providerPublishTime" in article:
                    # Convert Unix timestamp to ISO format
                    timestamp = datetime.fromtimestamp(article["providerPublishTime"])
                    news_item["timestamp"] = timestamp.isoformat()
                    news_item["published"] = timestamp.strftime("%b %d, %Y %I:%M %p")
                else:
                    news_item["timestamp"] = datetime.now().isoformat()
                    news_item["published"] = "Recently"
                
                # Try to get snippet/summary
                if "summary" in article:
                    news_item["snippet"] = article["summary"][:200] + "..." if len(article["summary"]) > 200 else article["summary"]
                else:
                    # If no summary, try to fetch from the article URL
                    snippet = fetch_article_snippet(article.get("link", ""))
                    news_item["snippet"] = snippet if snippet else f"Latest news about {symbol}"
                
                # Get related tickers if available
                if "relatedTickers" in article:
                    news_item["related_tickers"] = article["relatedTickers"]
                
                formatted_news.append(news_item)
                
            except Exception as e:
                logger.error(f"Error processing news article: {e}")
                continue
        
        # Sort by timestamp (most recent first)
        formatted_news.sort(key=lambda x: x["timestamp"], reverse=True)
        
        logger.info(f"Fetched {len(formatted_news)} news articles for {symbol}")
        return formatted_news
        
    except Exception as e:
        logger.error(f"Error fetching Yahoo Finance news for {symbol}: {e}")
        return []

def fetch_article_snippet(url: str, max_length: int = 200) -> Optional[str]:
    """
    Try to fetch a snippet from the article URL
    
    Args:
        url: Article URL
        max_length: Maximum length of snippet
        
    Returns:
        Article snippet or None
    """
    try:
        # Quick fetch with timeout
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=3)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Try to find article description or first paragraph
            # Meta description
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            if meta_desc and meta_desc.get('content'):
                content = meta_desc['content']
                return content[:max_length] + "..." if len(content) > max_length else content
            
            # First paragraph
            article_body = soup.find('article') or soup.find('div', class_='article-body')
            if article_body:
                paragraphs = article_body.find_all('p')
                if paragraphs:
                    text = paragraphs[0].get_text().strip()
                    return text[:max_length] + "..." if len(text) > max_length else text
            
    except Exception as e:
        logger.debug(f"Could not fetch snippet from {url}: {e}")
    
    return None

def fetch_multiple_stocks_news(symbols: List[str]) -> Dict[str, List[Dict]]:
    """
    Fetch news for multiple stock symbols
    
    Args:
        symbols: List of stock symbols
        
    Returns:
        Dictionary mapping symbols to their news articles
    """
    all_news = {}
    
    for symbol in symbols:
        news = fetch_yahoo_finance_news(symbol)
        all_news[symbol] = news
    
    return all_news

def fetch_market_news() -> List[Dict]:
    """
    Fetch general market news from major indices
    """
    market_symbols = ["^GSPC", "^DJI", "^IXIC"]  # S&P 500, Dow Jones, NASDAQ
    all_news = []
    
    for symbol in market_symbols:
        news = fetch_yahoo_finance_news(symbol)
        # Add market indicator to each news item
        for item in news:
            if symbol == "^GSPC":
                item["market"] = "S&P 500"
            elif symbol == "^DJI":
                item["market"] = "Dow Jones"
            elif symbol == "^IXIC":
                item["market"] = "NASDAQ"
        all_news.extend(news)
    
    # Remove duplicates based on title
    seen_titles = set()
    unique_news = []
    for item in all_news:
        if item["title"] not in seen_titles:
            seen_titles.add(item["title"])
            unique_news.append(item)
    
    # Sort by timestamp
    unique_news.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return unique_news[:20]  # Return top 20 most recent