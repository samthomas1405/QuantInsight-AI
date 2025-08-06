import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Check, ArrowRight, TrendingUp, Star, Globe, BarChart3, DollarSign, X, ArrowLeft } from 'lucide-react';
import { searchStocks, followStock, completeUserSetup } from '../api/stock';
import { fetchUserInfo } from '../api/auth';

const popularStocks = [
  { symbol: "AAPL", name: "Apple Inc.", change: "+2.45%", price: "$182.91" },
  { symbol: "GOOGL", name: "Alphabet Inc.", change: "+1.23%", price: "$142.58" },
  { symbol: "AMZN", name: "Amazon.com Inc.", change: "+3.67%", price: "$178.35" },
  { symbol: "MSFT", name: "Microsoft Corp.", change: "+0.89%", price: "$429.63" },
  { symbol: "TSLA", name: "Tesla Inc.", change: "-1.24%", price: "$242.84" },
  { symbol: "NVDA", name: "NVIDIA Corp.", change: "+5.42%", price: "$876.23" },
  { symbol: "META", name: "Meta Platforms", change: "+2.15%", price: "$503.76" },
  { symbol: "BRK.B", name: "Berkshire Hath.", change: "+0.45%", price: "$437.89" },
];

const StockSelection = () => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [followed, setFollowed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [token] = useState(() => localStorage.getItem('token'));
  const [isExistingUser, setIsExistingUser] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Check if user already has followed stocks
    fetchUserInfo(token)
      .then(res => {
        if (res.data.has_completed_setup) {
          setIsExistingUser(true);
        }
      })
      .catch(() => {
        console.error('Failed to fetch user info');
      });
  }, [token, navigate]);

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (search.trim() === '') {
        setResults([]);
        return;
      }
      try {
        setLoading(true);
        const res = await searchStocks(search, token);
        setResults(res.data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [search, token]);

  const handleFollow = async (symbol) => {
    try {
      await followStock(symbol, token);
      setFollowed(prev => [...prev, symbol]);
    } catch (err) {
      console.error("Failed to follow stock:", symbol);
    }
  };

  const handleNext = async () => {
    try {
      await completeUserSetup(token);
      navigate('/dashboard');
    } catch (err) {
      console.error("Failed to complete setup");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-6 shadow-lg"
            >
              <Star className="w-8 h-8 text-white" />
            </motion.div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {isExistingUser ? 'Follow More Stocks' : 'Build Your Portfolio'}
            </h1>
            <p className="text-gray-600 text-xl max-w-3xl mx-auto leading-relaxed">
              {isExistingUser 
                ? 'Add more stocks to your watchlist or return to your dashboard.'
                : 'Select the stocks you want to track. Get real-time analysis, predictions, and insights.'}
            </p>
            
            {/* Stats Bar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap justify-center gap-6 mt-8"
            >
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
                <Globe className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-gray-700">10,000+ Stocks</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-gray-700">Real-time Data</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
                <BarChart3 className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-semibold text-gray-700">AI Predictions</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Search Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-10"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
                  <Search className="w-5 h-5 text-white" />
                </div>
                Search Stocks
              </h2>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-gray-500">Live Search</span>
              </div>
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Search by company name or ticker symbol..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-12 py-4 text-lg bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              {loading && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Popular Stocks Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-10"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-orange-500 rounded-lg shadow-sm">
                  <Star className="w-5 h-5 text-white" />
                </div>
                Trending Stocks
              </h2>
              <div className="p-2">
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {popularStocks.map((stock, index) => {
                const isPositive = stock.change.startsWith('+');
                const isFollowed = followed.includes(stock.symbol);
                
                return (
                  <motion.button
                    key={stock.symbol}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.02 }}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleFollow(stock.symbol)}
                    className={`relative rounded-xl p-5 transition-all duration-200 border ${
                      isFollowed
                        ? 'bg-blue-600 text-white shadow-md border-blue-600'
                        : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-left">
                        <div className="font-bold text-lg mb-1">{stock.symbol}</div>
                        <div className={`text-xs ${isFollowed ? 'text-blue-100' : 'text-gray-500'}`}>
                          {stock.name}
                        </div>
                      </div>
                      <div className={`p-2 rounded-lg ${
                        isFollowed 
                          ? 'bg-white/20' 
                          : 'bg-blue-600'
                      }`}>
                        {isFollowed ? (
                          <Check className="w-4 h-4 text-white" />
                        ) : (
                          <Plus className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className={`text-lg font-bold ${isFollowed ? 'text-white' : 'text-gray-900'}`}>
                        {stock.price}
                      </div>
                      <div className={`text-sm font-semibold px-2 py-1 rounded-lg ${
                        isPositive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {stock.change}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Search Results */}
          <AnimatePresence>
            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-10"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-green-600 rounded-lg shadow-sm">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  Search Results
                  <span className="text-sm text-gray-500 font-normal">
                    ({results.length} found)
                  </span>
                </h2>
                
                <div className="space-y-3">
                  {results.map((stock, index) => (
                    <motion.div
                      key={stock.symbol}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.02 }}
                    >
                      <div className="flex items-center justify-between p-5 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
                            <DollarSign className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="font-bold text-lg text-gray-900">{stock.symbol}</div>
                            <div className="text-sm text-gray-600">{stock.name}</div>
                          </div>
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleFollow(stock.symbol)}
                          disabled={followed.includes(stock.symbol)}
                          className={`px-6 py-3 font-semibold flex items-center gap-2 rounded-lg transition-all duration-200 ${
                            followed.includes(stock.symbol)
                              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
                          }`}
                        >
                          {followed.includes(stock.symbol) ? (
                            <>
                              <Check className="w-4 h-4" />
                              Following
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              Follow
                            </>
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selected Stocks Summary */}
          {followed.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-10"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center justify-between">
                <span>Selected Stocks</span>
                <span className="text-2xl font-bold text-blue-600">
                  {followed.length} stocks
                </span>
              </h2>
              
              <div className="flex flex-wrap gap-3">
                {followed.map((symbol, index) => (
                  <motion.div
                    key={symbol}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    className="group"
                  >
                    <div className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold flex items-center gap-3 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                      <Check className="w-4 h-4" />
                      {symbol}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFollowed(prev => prev.filter(s => s !== symbol));
                        }}
                        className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/30"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-4">
              {/* Back to Dashboard Button for existing users */}
              {isExistingUser && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/dashboard')}
                  className="px-8 py-4 font-semibold text-lg flex items-center gap-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Dashboard</span>
                </motion.button>
              )}
              
              {/* Continue/Update Button */}
              <motion.button
                whileHover={{ scale: followed.length > 0 || isExistingUser ? 1.02 : 1 }}
                whileTap={{ scale: followed.length > 0 || isExistingUser ? 0.98 : 1 }}
                onClick={handleNext}
                disabled={!isExistingUser && followed.length === 0}
                className={`px-12 py-4 font-semibold text-lg flex items-center gap-4 rounded-lg transition-all duration-200 ${
                  !isExistingUser && followed.length === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                }`}
              >
                <span>
                  {followed.length > 0 
                    ? 'Update & Continue' 
                    : isExistingUser 
                      ? 'Continue to Dashboard' 
                      : 'Launch Dashboard'}
                </span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>
            
            {!isExistingUser && followed.length === 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-500 text-sm mt-4"
              >
                Select at least one stock to continue
              </motion.p>
            )}
            
            {isExistingUser && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 text-sm mt-4"
              >
                {followed.length > 0 
                  ? `${followed.length} new stocks selected` 
                  : 'You can add more stocks or return to your dashboard'}
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default StockSelection;