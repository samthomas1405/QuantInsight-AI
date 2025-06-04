from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class NewsArticleOut(BaseModel):
    title: str
    description: Optional[str]
    url: str
    published_at: datetime
    source: str
    content: str
    summary: str

    class Config:
        orm_mode = True
