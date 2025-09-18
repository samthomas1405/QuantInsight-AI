from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base

class AnalysisHistory(Base):
    __tablename__ = "analysis_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    analysis_id = Column(String, unique=True, index=True)
    tickers = Column(JSON, nullable=False)  # Store as JSON array
    analysis_type = Column(String, default="analyze")  # "analyze" or "compare"
    results = Column(JSON, nullable=True)  # Store analysis results as JSON
    status = Column(String, default="completed")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationship to User
    user = relationship("User", back_populates="analysis_history")