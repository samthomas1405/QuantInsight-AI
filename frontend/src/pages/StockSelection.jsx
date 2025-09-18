import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Check, ArrowRight, TrendingUp, Star, Globe, BarChart3, DollarSign, X, ArrowLeft, Building2 } from 'lucide-react';
import { searchStocks, followStock, unfollowStock, completeUserSetup } from '../api/stock';
import { fetchUserInfo } from '../api/auth';
import { fetchLiveFollowedMarketData } from '../api/liveMarket';
import CompanyLogo from '../components/CompanyLogo';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [userStocks, setUserStocks] = useState([]);
  const [followed, setFollowed] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [token] = useState(() => localStorage.getItem('token'));
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
           (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const dropdownRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Check if user already has followed stocks and fetch them
    Promise.all([
      fetchUserInfo(token),
      fetchLiveFollowedMarketData(token)
    ])
      .then(([userRes, stocksRes]) => {
        if (userRes.data.has_completed_setup) {
          setIsExistingUser(true);
        }
        // Set user's existing stocks
        if (stocksRes.data) {
          setUserStocks(stocksRes.data);
          setFollowed(stocksRes.data.map(stock => stock.symbol));
        }
      })
      .catch(() => {
        console.error('Failed to fetch user info or stocks');
      });
  }, [token, navigate]);

  // Search stocks with debounce
  useEffect(() => {
    const searchStocksDebounced = async () => {
      if (!searchQuery || searchQuery.length < 1) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      
      try {
        const response = await searchStocks(searchQuery, token);
        if (response.data) {
          setSearchResults(response.data);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchStocksDebounced, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, token]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFollow = (symbol) => {
    // Toggle selection - if already selected, remove it; otherwise add it
    setFollowed(prev => {
      if (prev.includes(symbol)) {
        return prev.filter(s => s !== symbol);
      } else {
        return [...prev, symbol];
      }
    });
  };

  const handleUnfollow = (symbol) => {
    // Just remove from local state
    setFollowed(prev => prev.filter(s => s !== symbol));
  };

  const handleNext = async () => {
    setIsSaving(true);
    try {
      // Follow all selected stocks
      const followPromises = followed.map(symbol => 
        followStock(symbol, token).catch(err => {
          console.error(`Failed to follow ${symbol}:`, err);
          // Continue even if one fails
          return null;
        })
      );
      
      await Promise.all(followPromises);
      
      // Complete setup and navigate
      await completeUserSetup(token);
      navigate('/dashboard');
    } catch (err) {
      console.error("Failed to complete setup:", err);
      alert("Failed to save your selections. Please try again.");
      setIsSaving(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
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
            
            <h1 className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {isExistingUser ? 'Follow More Stocks' : 'Build Your Portfolio'}
            </h1>
            <p className={`text-xl max-w-3xl mx-auto leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
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

          {/* Search Section with Dropdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-10"
          >
            <div className={`rounded-xl shadow-sm border p-6 ${
              isDark 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold flex items-center gap-3 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
                    <Search className="w-5 h-5 text-white" />
                  </div>
                  Search & Add Stocks
                </h2>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-gray-500">Live Search</span>
                </div>
              </div>
              
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder="Search by symbol or company name..."
                    className={`w-full pl-12 pr-12 py-4 text-lg rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  {isSearching && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                {/* Search Dropdown */}
                <AnimatePresence>
                  {isDropdownOpen && (searchQuery || userStocks.length > 0) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`absolute z-50 mt-2 w-full rounded-xl border shadow-xl max-h-96 overflow-y-auto ${
                        isDark 
                          ? 'bg-gray-800 border-gray-700' 
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      {isSearching ? (
                        <div className="p-8 text-center">
                          <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-gray-600">Searching stocks...</p>
                        </div>
                      ) : searchQuery && searchResults.length > 0 ? (
                        <div className="py-2">
                          <div className="px-4 py-2 text-xs font-medium text-gray-600">SEARCH RESULTS</div>
                          {searchResults.map(stock => {
                            const isFollowed = followed.includes(stock.symbol);
                            return (
                              <button
                                key={stock.symbol}
                                onClick={() => handleFollow(stock.symbol)}
                                className={`w-full px-4 py-3 flex items-center justify-between ${
                                  isFollowed 
                                    ? isDark ? 'bg-gray-700' : 'bg-blue-50' 
                                    : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                } cursor-pointer transition-colors`}
                              >
                                <div className="flex items-center gap-3">
                                  <CompanyLogo symbol={stock.symbol} size="md" />
                                  <div className="text-left">
                                    <div className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{stock.symbol}</div>
                                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stock.name || stock.description}</div>
                                  </div>
                                </div>
                                {isFollowed ? (
                                  <Check className="w-5 h-5 text-blue-600" />
                                ) : (
                                  <Plus className="w-5 h-5 text-blue-600" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ) : !searchQuery && userStocks.length > 0 ? (
                        <div className="py-2">
                          <div className="px-4 py-2 text-xs font-medium text-gray-600">YOUR STOCKS</div>
                          {userStocks.map(stock => (
                            <div
                              key={stock.symbol}
                              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50"
                            >
                              <div className="flex items-center gap-3">
                                <CompanyLogo symbol={stock.symbol} size="md" />
                                <div className="text-left">
                                  <div className="font-semibold text-gray-900">{stock.symbol}</div>
                                  <div className="text-sm text-gray-600">{stock.name}</div>
                                  <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                                    <span className={stock.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                                      {stock.change >= 0 ? '+' : ''}{stock.change?.toFixed(2)}%
                                    </span>
                                    <span>${stock.price?.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                              <Check className="w-5 h-5 text-blue-600" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <p className="text-sm text-gray-600">
                            {searchQuery ? 'No results found' : 'Start typing to search stocks'}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
              <h2 className={`text-2xl font-bold flex items-center gap-3 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <div className="p-2 bg-orange-500 rounded-lg shadow-sm">
                  <Star className="w-5 h-5 text-white" />
                </div>
                Trending Stocks
              </h2>
              <div className="p-2">
                <BarChart3 className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
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
                        : isDark 
                          ? 'bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-blue-500 shadow-sm hover:shadow-md'
                          : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-left">
                        <div className={`font-bold text-xl mb-0.5 ${
                          isFollowed ? 'text-white' : isDark ? 'text-white' : 'text-gray-900'
                        }`}>{stock.symbol}</div>
                        <div className={`text-xs truncate ${
                          isFollowed ? 'text-blue-100' : isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
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
                      <div className={`text-lg font-bold ${
                        isFollowed ? 'text-white' : isDark ? 'text-white' : 'text-gray-900'
                      }`}>
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


          {/* Selected Stocks Summary */}
          {followed.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className={`rounded-xl shadow-sm border p-6 mb-10 ${
                isDark 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}
            >
              <h2 className={`text-2xl font-bold mb-6 flex items-center justify-between ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <span>Selected Stocks</span>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-blue-600">
                    {followed.length} stocks
                  </span>
                  {followed.length > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFollowed([])}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isDark
                          ? 'bg-red-900/20 hover:bg-red-900/30 text-red-400 border border-red-800'
                          : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                      }`}
                    >
                      Clear All
                    </motion.button>
                  )}
                </div>
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
                          handleUnfollow(symbol);
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
              {/* Single action button */}
              {isExistingUser && followed.length === 0 ? (
                // For existing users with no new selections, just go back
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/dashboard')}
                  className={`px-10 py-4 font-semibold text-lg flex items-center gap-3 rounded-lg transition-all duration-200 ${
                    isDark
                      ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
                      : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300'
                  } shadow-sm hover:shadow-md`}
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Dashboard</span>
                </motion.button>
              ) : (
                // For new users or users with selections
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNext}
                  disabled={(!isExistingUser && followed.length === 0) || isSaving}
                  className={`px-10 py-4 font-semibold text-lg flex items-center gap-3 rounded-lg transition-all duration-200 ${
                    (!isExistingUser && followed.length === 0) || isSaving
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                  }`}
                >
                  {followed.length > 0 ? (
                    <>
                      <span>{isSaving ? 'Saving...' : 'Save & Continue'}</span>
                      <ArrowRight className={`w-5 h-5 ${isSaving ? 'animate-pulse' : ''}`} />
                    </>
                  ) : (
                    <>
                      <span>Launch Dashboard</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              )}
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