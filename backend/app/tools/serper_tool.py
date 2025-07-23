import os
import requests
import logging
from typing import Optional
from dotenv import load_dotenv

# Try different CrewAI tool import patterns
try:
    from crewai.tools import BaseTool
except ImportError:
    try:
        from crewai_tools import BaseTool
    except ImportError:
        # Fallback for older CrewAI versions
        from crewai.tools.base_tool import BaseTool

load_dotenv()
logger = logging.getLogger(__name__)

class SerperSearchTool(BaseTool):
    name: str = "Serper Search Tool"
    description: str = "Searches recent news and web results using Serper.dev API for stock market information."
    
    def _run(self, query: str) -> str:
        """Execute the search with proper error handling"""
        try:
            # Check multiple possible environment variable names
            api_key = os.getenv("SERPER_API_KEY") or os.getenv("SERPER_KEY")
            
            if not api_key:
                logger.warning("No SERPER_API_KEY or SERPER_KEY found in environment")
                return f"Search unavailable: API key not configured. Query was: {query}"
            
            # Use news endpoint for financial/stock information
            url = "https://google.serper.dev/news"
            headers = {
                "X-API-KEY": api_key,
                "Content-Type": "application/json"
            }
            
            # Enhance query for better financial results
            enhanced_query = f"{query} stock market news finance"
            payload = {
                "q": enhanced_query,
                "num": 5,  # Limit results to avoid overwhelming response
                "gl": "us",  # US market focus
                "hl": "en"
            }
            
            logger.info(f"Searching for: {enhanced_query}")
            
            # Make request with timeout
            response = requests.post(url, headers=headers, json=payload, timeout=10)
            response.raise_for_status()
            
            results = response.json()
            
            # Process results more carefully
            news_items = results.get("news", [])
            
            if not news_items:
                logger.warning(f"No news results found for query: {query}")
                return f"No recent news found for: {query}"
            
            # Format results for better consumption by AI agents
            summaries = []
            for i, item in enumerate(news_items[:5], 1):  # Limit to top 5
                title = item.get('title', 'No title')
                snippet = item.get('snippet', 'No description')
                link = item.get('link', '')
                date = item.get('date', 'Recent')
                
                summary = f"{i}. {title}\n   {snippet}\n   Published: {date}\n   Source: {link}\n"
                summaries.append(summary)
            
            result = "\n".join(summaries)
            logger.info(f"Found {len(news_items)} news items for query: {query}")
            
            return result
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error in Serper search: {e}")
            return f"Search request failed for '{query}': {str(e)}"
            
        except Exception as e:
            logger.error(f"Unexpected error in Serper search: {e}")
            return f"Search error for '{query}': {str(e)}"
    
    def run(self, query: str) -> str:
        """Alternative method name for different CrewAI versions"""
        return self._run(query)


class SerperWebSearchTool(BaseTool):
    """Alternative web search tool for general queries"""
    name: str = "Serper Web Search Tool"
    description: str = "Searches web results using Serper.dev API for general information."
    
    def _run(self, query: str) -> str:
        """Execute web search"""
        try:
            api_key = os.getenv("SERPER_API_KEY") or os.getenv("SERPER_KEY")
            
            if not api_key:
                return f"Web search unavailable: API key not configured. Query was: {query}"
            
            url = "https://google.serper.dev/search"
            headers = {
                "X-API-KEY": api_key,
                "Content-Type": "application/json"
            }
            
            payload = {
                "q": query,
                "num": 5,
                "gl": "us",
                "hl": "en"
            }
            
            response = requests.post(url, headers=headers, json=payload, timeout=10)
            response.raise_for_status()
            
            results = response.json()
            organic_results = results.get("organic", [])
            
            if not organic_results:
                return f"No web results found for: {query}"
            
            summaries = []
            for i, item in enumerate(organic_results[:3], 1):  # Top 3 results
                title = item.get('title', 'No title')
                snippet = item.get('snippet', 'No description')
                link = item.get('link', '')
                
                summary = f"{i}. {title}\n   {snippet}\n   Link: {link}\n"
                summaries.append(summary)
            
            return "\n".join(summaries)
            
        except Exception as e:
            logger.error(f"Web search error: {e}")
            return f"Web search failed for '{query}': {str(e)}"


def test_serper_tools():
    """Test function for the Serper tools"""
    try:
        # Test news search
        news_tool = SerperSearchTool()
        news_result = news_tool._run("Apple stock AAPL")
        
        # Test web search  
        web_tool = SerperWebSearchTool()
        web_result = web_tool._run("Tesla financial performance")
        
        return {
            "news_search": {
                "status": "success" if "error" not in news_result.lower() else "error",
                "result": news_result[:300] + "..." if len(news_result) > 300 else news_result
            },
            "web_search": {
                "status": "success" if "error" not in web_result.lower() else "error", 
                "result": web_result[:300] + "..." if len(web_result) > 300 else web_result
            }
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "status": "failed"
        }