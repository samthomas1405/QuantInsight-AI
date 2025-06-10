from sqlalchemy import Column, Integer, String
from app.db import Base
from sqlalchemy.orm import relationship

class Stock(Base):
    __tablename__ = "stocks"
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    followers = relationship("User", secondary="user_stocks", back_populates="followed_stocks")

