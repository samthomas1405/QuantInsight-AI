import React, { useEffect, useState } from 'react';
import { fetchLiveFollowedMarketData } from '../api/liveMarket';

const MarketDataTable = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) return;

  const loadMarketData = async () => {
    try {
      const res = await fetchLiveFollowedMarketData(token);
      console.log("Fetched live market data:", res);

      // If Twelve Data returns a single object for one symbol, wrap it in an array
      const formatted = Array.isArray(res)
        ? res
        : Object.keys(res).map((symbol) => ({
            id: symbol,
            symbol,
            price: parseFloat(res[symbol].price),
            timestamp: new Date().toISOString(), // or use res[symbol].datetime if available
          }));

      setData(formatted);
    } catch (err) {
      console.error("Failed to load followed market data", err);
    }
  };

  loadMarketData();
}, []);


  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Your Followed Stocks</h2>
      <table className="min-w-full bg-white text-black border border-gray-300 rounded shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 border-b">Symbol</th>
            <th className="py-2 px-4 border-b">Price</th>
            <th className="py-2 px-4 border-b">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td className="py-2 px-4 border-b">{item.symbol}</td>
              <td className="py-2 px-4 border-b">${item.price.toFixed(2)}</td>
              <td className="py-2 px-4 border-b">{new Date(item.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MarketDataTable;
