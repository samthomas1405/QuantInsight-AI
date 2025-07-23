from sqlalchemy import Column, Integer, String, Text, DateTime
from app.db import Base
from datetime import datetime

class NewsArticle(Base):
    __tablename__ = "news_articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(Text)
    url = Column(String)
    published_at = Column(DateTime)
    source = Column(String)
    content = Column(Text)
    summary = Column(Text)
    ticker = Column(String)
