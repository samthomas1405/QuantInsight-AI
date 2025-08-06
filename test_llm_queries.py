#!/usr/bin/env python3
"""
Test script to demonstrate LLM-powered query understanding for AI Financial Assistant
"""

import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.routes.ai_assistant import process_ai_query
from app.routes.ai_assistant import AIQueryRequest

async def test_queries():
    """Test various user queries to demonstrate LLM understanding"""
    
    test_queries = [
        "What's the price of Apple?",
        "Should I buy Tesla stock?",
        "How is the market doing today?",
        "Find me some AI stocks",
        "Compare Apple and Google",
        "What's happening with Microsoft?",
        "Tell me about NVIDIA",
        "Is it a good time to invest in tech?",
        "What's the weather like?",  # Non-financial question
        "Tell me a joke",  # Non-financial question
    ]
    
    print("🤖 Testing LLM-Powered Query Understanding\n")
    print("=" * 60)
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n{i}. User Query: \"{query}\"")
        print("-" * 40)
        
        try:
            # Create request object
            request = AIQueryRequest(query=query)
            
            # Process the query
            response = await process_ai_query(request)
            
            if response.success:
                print("✅ Response:")
                print(response.response)
            else:
                print("❌ Error:")
                print(response.response)
                
        except Exception as e:
            print(f"❌ Exception: {str(e)}")
        
        print("\n" + "=" * 60)

if __name__ == "__main__":
    print("🚀 Starting LLM Query Understanding Test...")
    asyncio.run(test_queries())
    print("\n✨ Test completed!") 