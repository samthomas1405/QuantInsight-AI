"""
Financial Tools Module
Direct access to financial data functions without MCP protocol
"""

import asyncio
import logging
from typing import Optional
import os
from dotenv import load_dotenv
import httpx
from datetime import datetime

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY")
YAHOO_FINANCE_BASE = "https://query1.finance.yahoo.com/v8/finance/chart"

class FinancialTools:
    def __init__(self):
        self.finnhub_client = None
        if FINNHUB_API_KEY:
            import finnhub
            self.finnhub_client = finnhub.Client(api_key=FINNHUB_API_KEY)
    
    async def get_stock_price(self, symbol: str) -> str:
        """Get current stock price from multiple sources"""
        try:
            # Common symbol corrections
            symbol_corrections = {
                'TESLA': 'TSLA',
                'APPLE': 'AAPL',
                'GOOGLE': 'GOOGL',
                'MICROSOFT': 'MSFT',
                'AMAZON': 'AMZN',
                'META': 'META',
                'NETFLIX': 'NFLX',
                'NVIDIA': 'NVDA',
                'ADOBE': 'ADBE',
                'SALESFORCE': 'CRM'
            }
            
            # Correct the symbol if needed
            corrected_symbol = symbol_corrections.get(symbol.upper(), symbol.upper())
            
            # Try Yahoo Finance first
            url = f"{YAHOO_FINANCE_BASE}/{corrected_symbol}"
            params = {
                'interval': '1m',
                'range': '1d',
                'includePrePost': 'true'
            }
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, headers=headers, timeout=10)
                response.raise_for_status()
                data = response.json()
                
                if 'chart' in data and 'result' in data['chart'] and data['chart']['result']:
                    result = data['chart']['result'][0]
                    if 'meta' in result:
                        meta = result['meta']
                        
                        # Get the most current price
                        current_price = None
                        price_source = "Regular Market"
                        
                        if meta.get('postMarketPrice') is not None and meta.get('postMarketPrice') > 0:
                            current_price = meta.get('postMarketPrice')
                            price_source = "After Hours"
                        elif meta.get('preMarketPrice') is not None and meta.get('preMarketPrice') > 0:
                            current_price = meta.get('preMarketPrice')
                            price_source = "Pre Market"
                        elif meta.get('regularMarketPrice') is not None:
                            current_price = meta.get('regularMarketPrice')
                            price_source = "Regular Market"
                        else:
                            current_price = meta.get('previousClose')
                            price_source = "Previous Close"
                        
                        if current_price:
                            return f"""
Stock: {symbol.upper()}
Current Price: ${current_price:.2f}
Change: ${meta.get('regularMarketPrice', 0) - meta.get('previousClose', 0):.2f} ({((meta.get('regularMarketPrice', 0) - meta.get('previousClose', 0)) / meta.get('previousClose', 1)) * 100:.2f}%)
Day High: ${meta.get('regularMarketDayHigh', 0):.2f}
Day Low: ${meta.get('regularMarketDayLow', 0):.2f}
Open: ${meta.get('regularMarketOpen', 0):.2f}
Previous Close: ${meta.get('previousClose', 0):.2f}
Source: Yahoo Finance {price_source}
Updated: {datetime.now().isoformat()}
"""
            
            # Fallback to Finnhub if available
            if self.finnhub_client:
                quote = self.finnhub_client.quote(symbol.upper())
                if quote and quote.get('c') is not None:
                    return f"""
Stock: {symbol.upper()}
Current Price: ${quote['c']:.2f}
Change: ${quote.get('d', 0):.2f} ({quote.get('dp', 0):.2f}%)
Day High: ${quote.get('h', 0):.2f}
Day Low: ${quote.get('l', 0):.2f}
Open: ${quote.get('o', 0):.2f}
Previous Close: ${quote.get('pc', 0):.2f}
Source: Finnhub
Updated: {datetime.now().isoformat()}
"""
            
            return f"Unable to get price data for {symbol}. Please check the symbol and try again. (Tried: {corrected_symbol})"
            
        except Exception as e:
            logger.error(f"Error getting stock price for {symbol}: {str(e)}")
            return f"Error getting stock price for {symbol}: {str(e)}"

    async def analyze_stock(self, symbol: str) -> str:
        """Get comprehensive stock analysis"""
        try:
            # Common symbol corrections
            symbol_corrections = {
                'TESLA': 'TSLA',
                'APPLE': 'AAPL',
                'GOOGLE': 'GOOGL',
                'MICROSOFT': 'MSFT',
                'AMAZON': 'AMZN',
                'META': 'META',
                'NETFLIX': 'NFLX',
                'NVIDIA': 'NVDA',
                'ADOBE': 'ADBE',
                'SALESFORCE': 'CRM'
            }
            
            # Correct the symbol if needed
            corrected_symbol = symbol_corrections.get(symbol.upper(), symbol.upper())
            
            # Get current price first
            price_info = await self.get_stock_price(symbol)
            if "Error" in price_info or "Unable" in price_info:
                return price_info
            
            # Get historical data for analysis
            url = f"{YAHOO_FINANCE_BASE}/{corrected_symbol}"
            params = {
                'interval': '1d',
                'range': '30d',
                'includePrePost': 'false'
            }
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, headers=headers, timeout=10)
                response.raise_for_status()
                data = response.json()
                
                if 'chart' in data and 'result' in data['chart'] and data['chart']['result']:
                    result = data['chart']['result'][0]
                    
                    if 'timestamp' in result and 'indicators' in result and 'quote' in result['indicators']:
                        timestamps = result['timestamp']
                        quotes = result['indicators']['quote'][0]
                        
                        if timestamps and 'close' in quotes and quotes['close']:
                            # Calculate 30-day statistics
                            prices = [p for p in quotes['close'] if p is not None]
                            if len(prices) >= 2:
                                prices_30d = prices[-30:] if len(prices) >= 30 else prices
                                
                                # Calculate statistics
                                min_price = min(prices_30d)
                                max_price = max(prices_30d)
                                avg_price = sum(prices_30d) / len(prices_30d)
                                
                                # Calculate volatility (standard deviation)
                                variance = sum((p - avg_price) ** 2 for p in prices_30d) / len(prices_30d)
                                volatility = variance ** 0.5
                                
                                # Calculate 30-day return
                                if len(prices_30d) >= 2:
                                    return_30d = ((prices_30d[-1] - prices_30d[0]) / prices_30d[0]) * 100
                                else:
                                    return_30d = 0
                                
                                # Get current price from meta
                                meta = result['meta']
                                current_price = meta.get('regularMarketPrice', prices_30d[-1])
                                
                                return f"""
Stock Analysis: {symbol.upper()}
{price_info}

30-Day Statistics:
• 30-Day High: ${max_price:.2f}
• 30-Day Low: ${min_price:.2f}
• 30-Day Average: ${avg_price:.2f}
• 30-Day Volatility: ${volatility:.2f}
• 30-Day Return: {return_30d:.2f}%

Current vs 30-Day:
• vs High: {((current_price - max_price) / max_price) * 100:.2f}%
• vs Low: {((current_price - min_price) / min_price) * 100:.2f}%
• vs Average: {((current_price - avg_price) / avg_price) * 100:.2f}%
"""
            
            return price_info
            
        except Exception as e:
            logger.error(f"Error analyzing stock {symbol}: {str(e)}")
            return f"Error analyzing stock {symbol}: {str(e)}"

    async def search_stocks(self, query: str) -> str:
        """Search for stocks by name or symbol"""
        try:
            # Use Yahoo Finance search
            url = f"https://query1.finance.yahoo.com/v1/finance/search"
            params = {
                'q': query,
                'quotesCount': 10,
                'newsCount': 0
            }
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, headers=headers, timeout=10)
                response.raise_for_status()
                data = response.json()
                
                if 'quotes' in data:
                    stock_list = []
                    for quote in data['quotes']:
                        stock_list.append(f"• {quote.get('symbol', '')} - {quote.get('longname', quote.get('shortname', ''))} ({quote.get('exchange', '')})")
                    
                    return f"Found {len(data['quotes'])} stocks matching '{query}':\n" + "\n".join(stock_list)
            
            return f"No stocks found matching '{query}'."
            
        except Exception as e:
            logger.error(f"Error searching stocks: {str(e)}")
            return f"Error searching stocks: {str(e)}"

    async def get_market_overview(self, symbols: str) -> str:
        """Get market overview for multiple stocks"""
        try:
            # Common symbol corrections
            symbol_corrections = {
                'TESLA': 'TSLA',
                'APPLE': 'AAPL',
                'GOOGLE': 'GOOGL',
                'MICROSOFT': 'MSFT',
                'AMAZON': 'AMZN',
                'META': 'META',
                'NETFLIX': 'NFLX',
                'NVIDIA': 'NVDA',
                'ADOBE': 'ADBE',
                'SALESFORCE': 'CRM'
            }
            
            symbol_list = [s.strip().upper() for s in symbols.split(',')]
            results = []
            
            for symbol in symbol_list[:10]:  # Limit to 10 symbols
                try:
                    # Correct the symbol if needed
                    corrected_symbol = symbol_corrections.get(symbol, symbol)
                    
                    # Get basic price info
                    url = f"{YAHOO_FINANCE_BASE}/{corrected_symbol}"
                    params = {
                        'interval': '1m',
                        'range': '1d',
                        'includePrePost': 'true'
                    }
                    headers = {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                    
                    async with httpx.AsyncClient() as client:
                        response = await client.get(url, params=params, headers=headers, timeout=5)
                        response.raise_for_status()
                        data = response.json()
                        
                        if 'chart' in data and 'result' in data['chart'] and data['chart']['result']:
                            meta = data['chart']['result'][0]['meta']
                            current_price = meta.get('regularMarketPrice', 0)
                            change = meta.get('regularMarketPrice', 0) - meta.get('previousClose', 0)
                            percent_change = (change / meta.get('previousClose', 1)) * 100
                            results.append(f"• {symbol}: ${current_price:.2f} ({percent_change:+.2f}%)")
                        else:
                            results.append(f"• {symbol}: Data unavailable")
                except:
                    results.append(f"• {symbol}: Data unavailable")
            
            return f"Market Overview for {len(symbol_list)} stocks:\n" + "\n".join(results)
        except Exception as e:
            logger.error(f"Error getting market overview: {str(e)}")
            return f"Error getting market overview: {str(e)}"

# Global instance
financial_tools = FinancialTools() 