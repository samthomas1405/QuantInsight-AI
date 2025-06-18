import React, { useEffect, useState } from 'react';
import { fetchLiveFollowedMarketData } from '../api/liveMarket';
import StockChart from './StockChart'; // Import the chart component

const MarketDataTable = () => {
  const [data, setData] = useState({});
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;
    fetchLiveFollowedMarketData(token)
      .then(setData)
      .catch(err => console.error("Failed to load market data", err));
  }, [token]);

  const stocks = Array.isArray(data) ? data : Object.entries(data).map(([symbol, value]) => ({
    symbol,
    price: parseFloat(value.price),
    timestamp: new Date().toISOString(),
  }));

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-white">📈 Your Followed Stocks</h2>

      {/* Table Summary */}
      <table className="min-w-full bg-white text-black border border-gray-300 rounded shadow mb-6">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 border-b">Symbol</th>
            <th className="py-2 px-4 border-b">Price</th>
            <th className="py-2 px-4 border-b">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((item) => (
            <tr key={item.symbol}>
              <td className="py-2 px-4 border-b">{item.symbol}</td>
              <td className="py-2 px-4 border-b">${item.price.toFixed(2)}</td>
              <td className="py-2 px-4 border-b">{new Date(item.timestamp).toLocaleTimeString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Per-Stock Line Charts */}
      {stocks.map((item) => (
        <StockChart key={item.symbol} symbol={item.symbol} />
      ))}
    </div>
  );
};

export default MarketDataTable;

