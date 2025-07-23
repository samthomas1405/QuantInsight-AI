import React, { useEffect, useState } from 'react';
import { fetchLiveFollowedMarketData } from '../api/liveMarket';
import StockChart from './StockChart';

const MarketDataTable = () => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMarketData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        console.log('Fetching market data with token:', token ? 'Token exists' : 'No token');
        const result = await fetchLiveFollowedMarketData(token);
        console.log('Market data result:', result);
        
        setData(result);
      } catch (err) {
        console.error("Failed to load market data", err);
        setError(err.response?.data?.detail || err.message || 'Failed to load market data');
      } finally {
        setLoading(false);
      }
    };

    loadMarketData();
  }, []); // Keep empty dependency array

  const stocks = Array.isArray(data) ? data : Object.entries(data).map(([symbol, value]) => ({
    symbol,
    price: parseFloat(value.price),
    timestamp: new Date().toISOString(),
  }));

  console.log('Processed stocks:', stocks);

  if (loading) {
    return (
      <div className="text-white">
        <h2 className="text-2xl font-semibold mb-4">📈 Your Followed Stocks</h2>
        <p>Loading market data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-white">
        <h2 className="text-2xl font-semibold mb-4">📈 Your Followed Stocks</h2>
        <div className="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded">
          <p><strong>Error:</strong> {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-white">📈 Your Followed Stocks</h2>
      
      {stocks.length === 0 ? (
        <div className="text-white">
          <p>No followed stocks found. Add some stocks to your watchlist first.</p>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};

export default MarketDataTable;