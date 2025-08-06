"""
AI Assistant API Routes
Handles AI-powered financial queries using direct tool calls
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import asyncio
import logging
import re
from typing import Optional
import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session

# Import the financial tools directly
from app.utils.financial_tools import financial_tools
from app.db import SessionLocal
from app.models.stock import Stock

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai-assistant", tags=["AI Assistant"])

class AIQueryRequest(BaseModel):
    query: str

class AIQueryResponse(BaseModel):
    response: str
    success: bool

@router.post("/", response_model=AIQueryResponse)
async def process_ai_query(request: AIQueryRequest):
    """
    Process a query using AI-powered financial tools with LLM understanding
    """
    try:
        query = request.query.strip()
        if not query:
            return AIQueryResponse(
                response="Please provide a question about stocks or financial data.",
                success=False
            )
        
        # Configure Gemini
        import google.generativeai as genai
        genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Define available tools with detailed descriptions
        available_tools = [
            {
                "name": "get_stock_price",
                "description": "Get current stock price, change, volume, and basic info for any stock symbol. Use this for questions about current prices, how much a stock is worth, or basic stock information.",
                "examples": ["What's the price of AAPL?", "How much is Tesla worth?", "Current price of Microsoft", "What's Apple trading at?"],
                "parameters": {"symbol": "Stock symbol (e.g., AAPL, TSLA, MSFT)"}
            },
            {
                "name": "analyze_stock", 
                "description": "Get detailed analysis including performance, trends, key metrics, and insights for any stock. Use this for investment analysis, performance questions, or detailed stock research.",
                "examples": ["Should I buy AAPL?", "Analyze Tesla stock", "Is Microsoft a good investment?", "How is Apple performing?"],
                "parameters": {"symbol": "Stock symbol (e.g., AAPL, TSLA, MSFT)"}
            },
            {
                "name": "search_stocks",
                "description": "Search for stocks by company name, sector, or keywords. Use this to find companies, discover stocks in specific sectors, or search for stocks matching certain criteria.",
                "examples": ["Find AI stocks", "Search for electric vehicle companies", "Show me tech stocks", "Find companies in healthcare"],
                "parameters": {"query": "Search term or keywords"}
            },
            {
                "name": "get_market_overview",
                "description": "Compare multiple stocks and get market overview. Use this for comparing stocks, getting market summaries, or analyzing multiple companies at once.",
                "examples": ["Compare Apple and Google", "How are tech stocks doing?", "Market overview of top stocks", "Compare TSLA and NIO"],
                "parameters": {"symbols": "Comma-separated stock symbols (e.g., AAPL,GOOGL,MSFT)"}
            }
        ]
        
        # Create tool descriptions for Gemini
        tool_descriptions = []
        for tool in available_tools:
            desc = f"Tool: {tool['name']}\nDescription: {tool['description']}\nExamples: {', '.join(tool['examples'])}\nParameters: {tool['parameters']}\n"
            tool_descriptions.append(desc)
        
        tools_text = "\n".join(tool_descriptions)
        
        # Create the prompt for Gemini
        prompt = f"""You are a helpful financial AI assistant. The user asked: "{query}"

Available tools:
{tools_text}

Based on the user's question, determine which tool(s) to use and provide a helpful response. You can use multiple tools if needed.

IMPORTANT GUIDELINES:
1. If the user asks about a specific stock price, use get_stock_price
2. If the user asks for analysis, investment advice, or performance, use analyze_stock
3. If the user asks to find or search for stocks, use search_stocks
4. If the user asks to compare multiple stocks, use get_market_overview
5. If the user asks for investment advice, be helpful but include appropriate disclaimers
6. If the question is not financial-related, politely redirect to financial topics
7. Extract stock symbols from company names when possible (e.g., "Apple" = "AAPL", "Tesla" = "TSLA")

Respond with:
TOOL_CALL: <tool_name>
PARAMS: <parameters as JSON>

If you can answer directly without tools, provide a helpful response.

Available tools: {[tool['name'] for tool in available_tools]}"""
        
        # Get Gemini's response
        response = model.generate_content(prompt)
        response_text = response.text
        
        # Check if Gemini wants to call a tool
        if "TOOL_CALL:" in response_text:
            try:
                # Extract tool call information
                lines = response_text.split('\n')
                tool_call_line = None
                params_line = None
                
                for line in lines:
                    if line.startswith('TOOL_CALL:'):
                        tool_call_line = line
                    elif line.startswith('PARAMS:'):
                        params_line = line
                
                if tool_call_line and params_line:
                    tool_name = tool_call_line.replace('TOOL_CALL:', '').strip()
                    params_text = params_line.replace('PARAMS:', '').strip()
                    
                    # Parse parameters
                    import json
                    try:
                        tool_args = json.loads(params_text)
                    except:
                        # Fallback for simple string parameters
                        if tool_name in ["get_stock_price", "analyze_stock"]:
                            # Try to extract symbol from the query
                            symbol_match = re.search(r'\b[A-Z]{1,5}\b', query.upper())
                            if symbol_match:
                                tool_args = {"symbol": symbol_match.group()}
                            else:
                                # Try to find company name in database
                                def find_stock_symbol_by_name(company_name: str) -> Optional[str]:
                                    try:
                                        db = SessionLocal()
                                        stock = db.query(Stock).filter(
                                            Stock.name.ilike(f"%{company_name}%")
                                        ).first()
                                        if stock:
                                            return stock.symbol
                                        stock = db.query(Stock).filter(
                                            Stock.symbol.ilike(f"%{company_name}%")
                                        ).first()
                                        return stock.symbol if stock else None
                                    except Exception as e:
                                        logger.error(f"Database lookup error: {str(e)}")
                                        return None
                                    finally:
                                        db.close()
                                
                                # Extract potential company names
                                words = query.lower().split()
                                for word in words:
                                    if len(word) > 2:
                                        symbol = find_stock_symbol_by_name(word)
                                        if symbol:
                                            tool_args = {"symbol": symbol}
                                            break
                                else:
                                    tool_args = {"symbol": "AAPL"}  # Default fallback
                        elif tool_name == "search_stocks":
                            tool_args = {"query": query}
                        elif tool_name == "get_market_overview":
                            symbols = re.findall(r'\b[A-Z]{1,5}\b', query.upper())
                            if len(symbols) > 1:
                                tool_args = {"symbols": ','.join(symbols[:5])}
                            else:
                                tool_args = {"symbols": "AAPL,GOOGL,MSFT"}  # Default
                        else:
                            tool_args = {"query": query}
                    
                    # Call the selected tool
                    logger.info(f"Calling tool: {tool_name} with args: {tool_args}")
                    
                    if tool_name == 'get_stock_price':
                        result = await financial_tools.get_stock_price(tool_args['symbol'])
                    elif tool_name == 'analyze_stock':
                        result = await financial_tools.analyze_stock(tool_args['symbol'])
                    elif tool_name == 'search_stocks':
                        result = await financial_tools.search_stocks(tool_args['query'])
                    elif tool_name == 'get_market_overview':
                        result = await financial_tools.get_market_overview(tool_args['symbols'])
                    else:
                        result = f"I'm not sure how to handle that request. I can help with stock prices, analysis, searches, and market overviews."
                    
                    # Get Gemini's response to tool result
                    follow_up_prompt = f"""The tool {tool_name} returned the following result:

{result}

Please provide a helpful, natural language response to the user's original query: "{query}"

Make the response informative, conversational, and easy to understand. If this was an investment-related question, include appropriate disclaimers about not providing financial advice."""
                    
                    follow_up_response = model.generate_content(follow_up_prompt)
                    return AIQueryResponse(
                        response=follow_up_response.text,
                        success=True
                    )
                    
            except Exception as e:
                logger.error(f"Error parsing tool call: {str(e)}")
                return AIQueryResponse(
                    response=f"I encountered an error while processing your request: {str(e)}. Please try rephrasing your question.",
                    success=False
                )
        
        # If no tool call, return Gemini's direct response
        return AIQueryResponse(
            response=response_text,
            success=True
        )
            
    except Exception as e:
        logger.error(f"Error processing AI query: {str(e)}")
        return AIQueryResponse(
            response="I'm sorry, I encountered an error while processing your request. Please try again.",
            success=False
        ) 