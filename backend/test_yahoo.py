import yfinance as yf
import time

print("Testing Yahoo Finance connection...")

# Test 1: Simple ticker
ticker = yf.Ticker("AAPL")
try:
    info = ticker.info
    print(f"✓ Ticker info works: {info.get('symbol', 'N/A')}")
except Exception as e:
    print(f"✗ Ticker info failed: {e}")

# Test 2: Download data
try:
    data = yf.download("AAPL", period="1d", progress=False)
    if not data.empty:
        print(f"✓ Download works: Got {len(data)} rows")
    else:
        print("✗ Download returned empty data")
except Exception as e:
    print(f"✗ Download failed: {e}")

# Test 3: Direct API call
import requests
try:
    response = requests.get("https://query1.finance.yahoo.com/v8/finance/chart/AAPL")
    print(f"✓ Direct API status: {response.status_code}")
    if response.status_code == 429:
        print("  ⚠️  You are being rate limited by Yahoo Finance!")
except Exception as e:
    print(f"✗ Direct API failed: {e}")

print("\nSolution: Wait 10-15 minutes for the rate limit to reset")