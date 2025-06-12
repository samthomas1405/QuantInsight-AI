import json, os
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# === CONFIGURATION ===
DATABASE_URL = os.getenv("DATABASE_URL")
JSON_PATH = os.path.join(os.path.dirname(__file__), "company_tickers.json")

# === DATABASE SETUP ===
Base = declarative_base()

class Stock(Base):
    __tablename__ = 'stocks'
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, index=True)
    name = Column(String)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# === LOAD JSON AND INSERT ===
def load_stocks():
    # Load and parse the JSON
    with open(JSON_PATH, "r") as f:
        data = json.load(f)
        stocks = [{"symbol": entry["ticker"], "name": entry["title"]} for entry in data.values()]

    # Insert into DB
    session = SessionLocal()
    try:
        for stock in stocks:
            exists = session.query(Stock).filter_by(symbol=stock["symbol"]).first()
            if not exists:
                session.add(Stock(**stock))
        session.commit()
        print(f"Inserted {len(stocks)} stocks.")
    except Exception as e:
        session.rollback()
        print("Error:", e)
    finally:
        session.close()

# === RUN ===
if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    load_stocks()
