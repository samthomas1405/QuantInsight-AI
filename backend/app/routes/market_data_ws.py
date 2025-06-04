# from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
# from sqlalchemy.orm import Session
# from app.dependencies import get_db
# from app.models.market_data import MarketData
# import asyncio
# import json

# router = APIRouter()

# @router.websocket("/ws/market-data")
# async def market_data_ws(websocket: WebSocket, db: Session = Depends(get_db)):
#     await websocket.accept()
#     print("WebSocket accepted")
#     try:
#         while True:
#             print("Sending market data...")
#             await asyncio.sleep(5)
#             market_data = db.query(MarketData).order_by(MarketData.timestamp.desc()).limit(10).all()
#             data = [{"symbol": md.symbol, "price": md.price, "timestamp": md.timestamp.isoformat()} for md in market_data]
#             await websocket.send_text(json.dumps(data))
#     except WebSocketDisconnect:
#         print("Client disconnected")
