import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const popularStocks = ["AAPL", "GOOGL", "AMZN", "MSFT", "TSLA", "NVDA", "META", "BRK.B", "JPM", "V"];

const StockSelection = () => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [followed, setFollowed] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return navigate('/login');
  }, [token, navigate]);

  const headers = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const handleSearch = async () => {
    const res = await axios.get(`/user/stocks/search?q=${search}`, headers);
    setResults(res.data);
  };

  const handleFollow = async (symbol) => {
    await axios.post(`/user/stocks?symbol=${symbol}`, null, headers);
    setFollowed(prev => [...prev, symbol]);
  };

  const handleNext = async () => {
    try {
        await axios.post('/auth/complete-setup', {}, headers);
        navigate('/dashboard');
    } catch (err) {
        console.error("Failed to complete setup");
    }
  };


  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold text-cyan-400 mb-6">Select Stocks to Follow</h1>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search stocks..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="p-2 rounded bg-gray-800 text-white border border-gray-600 w-64"
        />
        <button onClick={handleSearch} className="ml-2 px-4 py-2 bg-cyan-600 rounded hover:bg-cyan-500">
          Search
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-xl mb-2">Popular Stocks</h2>
        <div className="flex flex-wrap gap-2">
          {popularStocks.map(symbol => (
            <button
              key={symbol}
              onClick={() => handleFollow(symbol)}
              disabled={followed.includes(symbol)}
              className={`px-4 py-2 rounded ${
                followed.includes(symbol) ? 'bg-green-600 cursor-not-allowed' : 'bg-cyan-700 hover:bg-cyan-600'
              }`}
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>

      {results.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl mb-2">Search Results</h2>
          <ul className="space-y-2">
            {results.map(stock => (
              <li key={stock.symbol} className="flex justify-between items-center border-b border-gray-700 py-2">
                <span>{stock.symbol} — {stock.name}</span>
                <button
                  onClick={() => handleFollow(stock.symbol)}
                  disabled={followed.includes(stock.symbol)}
                  className={`px-3 py-1 rounded ${
                    followed.includes(stock.symbol) ? 'bg-green-600 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500'
                  }`}
                >
                  {followed.includes(stock.symbol) ? 'Followed' : 'Follow'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={handleNext}
        className="mt-6 px-6 py-3 bg-green-600 hover:bg-green-500 rounded text-white"
      >
        Done, Go to Dashboard
      </button>
    </div>
  );
};

export default StockSelection;
