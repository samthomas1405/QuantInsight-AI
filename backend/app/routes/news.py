from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.models.news_article import NewsArticle
from app.schemas.news_article import NewsArticleOut
import requests
from transformers import pipeline
from datetime import datetime
from typing import List
import os

router = APIRouter()

NEWSAPI_KEY = os.getenv("NEWSAPI_KEY")
summarizer = pipeline("summarization")

@router.get("/", response_model=List[NewsArticleOut])
def fetch_and_store_news(q: str = Query("stock market"), db: Session = Depends(get_db)):
    url = f"https://newsapi.org/v2/everything?q={q}&language=en&pageSize=10&sortBy=publishedAt&apiKey={NEWSAPI_KEY}"
    response = requests.get(url)
    articles = response.json().get("articles", [])
    articles_sorted = sorted(articles, key=lambda x: x.get('publishedAt', ''), reverse=True)
    stored_articles = []

    for article in articles_sorted:
        url = article.get("url")
        existing = db.query(NewsArticle).filter_by(url=url).first()
        if existing:
            stored_articles.append(existing)
            continue

        summary = None  # Default
        if article.get("content") and len(article["content"].split()) > 50:
            summary = summarizer(article["content"], max_length=100, min_length=30, do_sample=False)[0]['summary_text']
        elif article.get("description"):
            summary = summarizer(article["description"], max_length=60, min_length=20, do_sample=False)[0]['summary_text']
        elif article.get("title"):
            summary = summarizer(article["title"], max_length=30, min_length=10, do_sample=False)[0]['summary_text']

        news = NewsArticle(
            title=article.get("title"),
            description=article.get("description"),
            url=url,
            published_at=datetime.strptime(article.get("publishedAt"), "%Y-%m-%dT%H:%M:%SZ"),
            source=article.get("source", {}).get("name"),
            content=article.get("content"),
            summary=summary
        )
        db.add(news)
        db.commit()
        db.refresh(news)
        stored_articles.append(news)

    return stored_articles
