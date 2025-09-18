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
                            # Calculate additional insights
                            change = meta.get('regularMarketPrice', 0) - meta.get('previousClose', 0)
                            change_pct = (change / meta.get('previousClose', 1)) * 100
                            day_high = meta.get('regularMarketDayHigh', 0)
                            day_low = meta.get('regularMarketDayLow', 0)
                            day_range = day_high - day_low
                            
                            # Intraday position
                            if day_range > 0:
                                intraday_position = ((current_price - day_low) / day_range) * 100
                                position_desc = "near daily low" if intraday_position < 25 else "lower half of range" if intraday_position < 45 else "mid-range" if intraday_position < 65 else "upper half of range" if intraday_position < 85 else "near daily high"
                            else:
                                position_desc = "minimal price movement"
                            
                            # Market status context
                            market_status = "After Hours" if price_source == "After Hours" else "Pre Market" if price_source == "Pre Market" else "Regular Trading"
                            
                            return f"""
REAL-TIME STOCK DATA: {symbol.upper()}

CURRENT PRICING:
• Price: ${current_price:.2f} ({market_status})
• Daily Change: ${change:+.2f} ({change_pct:+.2f}%)
• Day Range: ${day_low:.2f} - ${day_high:.2f}
• Current Position: Trading {position_desc} ({intraday_position:.1f}% of daily range)
• Opening Price: ${meta.get('regularMarketOpen', 0):.2f}
• Previous Close: ${meta.get('previousClose', 0):.2f}

TRADING INSIGHTS:
• Daily Range: ${day_range:.2f} ({(day_range/meta.get('previousClose', 1)*100):.1f}% volatility)
• Price Source: Yahoo Finance ({price_source})
• Last Updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ET

MARKET CONTEXT:
• {"Strong positive movement" if change_pct > 3 else "Moderate gains" if change_pct > 1 else "Slight gains" if change_pct > 0 else "Flat" if abs(change_pct) < 0.1 else "Slight decline" if change_pct > -1 else "Moderate decline" if change_pct > -3 else "Significant decline"}
• {"High intraday activity" if (day_range/meta.get('previousClose', 1)*100) > 2 else "Normal trading activity" if (day_range/meta.get('previousClose', 1)*100) > 0.5 else "Low volatility session"}
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
                                
                                # Calculate additional metrics for comprehensive analysis
                                current_vs_high = ((current_price - max_price) / max_price) * 100
                                current_vs_low = ((current_price - min_price) / min_price) * 100
                                current_vs_avg = ((current_price - avg_price) / avg_price) * 100
                                
                                # Volatility assessment
                                volatility_pct = (volatility / avg_price) * 100
                                volatility_level = "Low" if volatility_pct < 2 else "Moderate" if volatility_pct < 4 else "High"
                                
                                # Trend analysis (simple moving average slope)
                                if len(prices_30d) >= 5:
                                    recent_prices = prices_30d[-5:]  # Last 5 days
                                    early_avg = sum(recent_prices[:3]) / 3
                                    late_avg = sum(recent_prices[-3:]) / 3
                                    short_term_trend = "Upward" if late_avg > early_avg * 1.01 else "Downward" if late_avg < early_avg * 0.99 else "Sideways"
                                else:
                                    short_term_trend = "Insufficient data"
                                
                                # Position relative to range
                                range_position = ((current_price - min_price) / (max_price - min_price)) * 100
                                position_desc = "Near Lows" if range_position < 25 else "Lower Half" if range_position < 45 else "Middle Range" if range_position < 65 else "Upper Half" if range_position < 85 else "Near Highs"
                                
                                return f"""
COMPREHENSIVE STOCK ANALYSIS: {symbol.upper()}

CURRENT MARKET DATA:
{price_info}

PERFORMANCE METRICS (30-Day Analysis):
• Price Range: ${min_price:.2f} - ${max_price:.2f}
• Current Position: {position_desc} ({range_position:.1f}% of range)
• 30-Day Return: {return_30d:+.2f}%
• Average Price: ${avg_price:.2f}
• Volatility: ${volatility:.2f} ({volatility_level} - {volatility_pct:.1f}%)

TECHNICAL INDICATORS:
• Short-term Trend: {short_term_trend}
• Distance from High: {current_vs_high:+.2f}%
• Distance from Low: {current_vs_low:+.2f}%
• Distance from Average: {current_vs_avg:+.2f}%

RISK ASSESSMENT:
• Volatility Level: {volatility_level} ({volatility_pct:.1f}% daily volatility)
• Range Position: Currently trading in {position_desc.lower()} of recent range
• Recent Performance: {return_30d:+.2f}% over last 30 days

MARKET CONTEXT:
• Data includes regular trading hours, pre/post market activity
• Analysis based on {len(prices_30d)} trading days of data
• Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M')} ET
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