"""
AI Assistant API Routes
Handles financial queries using Gemini AI
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import logging
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai-assistant", tags=["AI Assistant"])

class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class AIQueryRequest(BaseModel):
    query: str
    conversation_history: Optional[List[Message]] = []

class AIQueryResponse(BaseModel):
    response: str
    success: bool

@router.post("/", response_model=AIQueryResponse)
async def process_ai_query(request: AIQueryRequest):
    """
    Process a financial query by directly calling Gemini AI with conversation context
    """
    try:
        query = request.query.strip()
        if not query:
            return AIQueryResponse(
                response="Please ask me a question about stocks, investments, or financial markets.",
                success=False
            )
        
        # Configure Gemini
        import google.generativeai as genai
        genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        # Build conversation history context
        conversation_context = ""
        if request.conversation_history:
            conversation_context = "Previous conversation:\n"
            for msg in request.conversation_history[-10:]:  # Last 10 messages for context
                role = "User" if msg.role == "user" else "Assistant"
                conversation_context += f"{role}: {msg.content}\n"
            conversation_context += "\n"
        
        # Financial-focused prompt with conversation history
        prompt = f"""You are a financial AI assistant. 

{conversation_context}Current question: "{query}"

CRITICAL INSTRUCTIONS:
- NEVER say "I will analyze" or "I will provide" - just provide the actual analysis
- Give ACTUAL information, data, and insights immediately
- When asked about price trends, provide specific information about the stock's performance
- When asked to compare stocks, provide actual comparison with real details
- Always assume questions are about stocks/financial markets
- Company names refer to their stocks (Pepsi = PEP, Google = GOOGL, Tesla = TSLA)
- NEVER include disclaimers or mention that you're not providing financial advice
- Do not add any disclaimers at the end of your responses

Respond with the actual financial information requested. Do not describe what you will do - just do it."""
        
        # Get Gemini's response
        response = model.generate_content(prompt)
        
        return AIQueryResponse(
            response=response.text,
            success=True
        )
            
    except Exception as e:
        logger.error(f"Error processing AI query: {str(e)}")
        return AIQueryResponse(
            response="I'm sorry, I encountered an error while processing your request. Please try again.",
            success=False
        ) 