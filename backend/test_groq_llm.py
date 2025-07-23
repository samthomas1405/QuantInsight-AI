
from dotenv import load_dotenv

load_dotenv()
from langchain_groq import ChatGroq
from app.tools.serper_tool import SerperSearchTool
import os

llm = ChatGroq(model="llama3-70b-8192", groq_api_key=os.getenv("GROQ_API_KEY"))
tool = SerperSearchTool()
query = "Apple stock news"
news = tool._run(query)
print("News fetched:", news)

response = llm.invoke(f"Summarize this:\n{news}")
print("LLM Response:", response.content)
