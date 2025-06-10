from sqlalchemy import Table, Column, Integer, String, DateTime, ForeignKey, Boolean
from datetime import datetime
from app.db import Base
from sqlalchemy.orm import relationship


user_stocks = Table(
    'user_stocks',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('stock_id', Integer, ForeignKey('stocks.id', ondelete='CASCADE'), primary_key=True)
)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    followed_stocks = relationship("Stock", secondary="user_stocks", back_populates="followers")
    has_completed_setup = Column(Boolean, default=False)

