import { useEffect, useState } from 'react';
import { fetchLiveFollowedMarketData } from '../api/liveMarket';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle, Zap, Clock, X } from 'lucide-react';
import StockChart from './StockChart';
import CompanyLogo from './CompanyLogo';
import { useTheme } from '../contexts/ThemeContext';

const MarketDataTable = () => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchEnabled, setFetchEnabled] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const { isDark } = useTheme();

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

        if (fetchEnabled) {
          const result = await fetchLiveFollowedMarketData(token);
          setData(result);
        }
      } catch (err) {
        console.error("Failed to load market data", err);
        setError(err.response?.data?.detail || err.message || 'Failed to load market data');
      } finally {
        setLoading(false);
      }
    };

    loadMarketData();
  }, [fetchEnabled]);

  const stocks = Array.isArray(data) ? data : Object.entries(data).map(([symbol, stockData]) => ({
    symbol,
    price: stockData.price,
    timestamp: stockData.last_updated || new Date().toISOString(),
    change: stockData.change >= 0 ? '+' : '-',
    changePercent: Math.abs(stockData.percent_change),
    changeValue: stockData.change,
    volume: stockData.volume,
    high: stockData.high,
    low: stockData.low,
    open: stockData.open,
    name: stockData.name || symbol,
    marketCap: stockData.market_cap
  }));

  const handleRetry = () => {
    setError(null);
    setFetchEnabled(true);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatVolume = (volume) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(0)}K`;
    }
    return volume.toString();
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className={`section-header ${isDark ? 'dark' : ''}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-xl font-bold font-['Space_Grotesk'] ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Market Data
            </h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Real-time stock prices and market trends
            </p>
          </div>
          {!fetchEnabled && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-modern interactive-scale"
              onClick={() => setFetchEnabled(true)}
            >
              <Zap className="w-4 h-4 mr-2" />
              Activate Live Feed
            </motion.button>
          )}
        </div>
      </div>

      {/* Loading State with Skeleton */}
      {loading && fetchEnabled && (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`data-row ${isDark ? 'dark' : ''} flex items-center justify-between`}>
              <div className="flex items-center space-x-4 flex-1">
                <div className={`skeleton ${isDark ? 'dark' : ''} w-12 h-6`}></div>
                <div className={`skeleton ${isDark ? 'dark' : ''} w-16 h-4`}></div>
                <div className={`skeleton ${isDark ? 'dark' : ''} w-20 h-5`}></div>
                <div className={`skeleton ${isDark ? 'dark' : ''} w-16 h-4`}></div>
              </div>
              <div className={`skeleton ${isDark ? 'dark' : ''} w-24 h-6`}></div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'} border rounded-lg p-6`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-2 ${isDark ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-600'} rounded-lg`}>
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className={`${isDark ? 'text-red-200' : 'text-red-900'} font-bold text-lg mb-1`}>Connection Error</h3>
              <p className={`${isDark ? 'text-red-300' : 'text-red-700'} text-sm mb-3`}>{error}</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-modern interactive-scale"
                onClick={handleRetry}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Connection
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Market Data Content */}
      {fetchEnabled && !loading && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-6"
        >
          {stocks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-12 text-center shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}
            >
              <div className={`inline-flex items-center justify-center w-20 h-20 ${isDark ? 'bg-gradient-to-br from-blue-900 to-cyan-900' : 'bg-gradient-to-br from-blue-100 to-cyan-100'} rounded-2xl mb-6`}>
                <TrendingUp className={`w-10 h-10 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <h3 className={`text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-2`}>No Stocks in Portfolio</h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-md mx-auto`}>
                Add stocks to your watchlist to see real-time market data and AI predictions.
              </p>
            </motion.div>
          ) : (
            <>
              {/* Market Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stocks.slice(0, 4).map((stock, index) => {
                  const isPositive = stock.change === '+';
                  return (
                    <motion.div
                      key={stock.symbol}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -4 }}
                      className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl p-5 shadow-sm border hover:shadow-md transition-all duration-300 cursor-pointer`}
                      onClick={() => setSelectedStock(stock)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <CompanyLogo symbol={stock.symbol} size="md" />
                          <h3 className={`font-bold text-lg ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{stock.symbol}</h3>
                        </div>
                        <div className={`p-1.5 rounded-lg ${isPositive ? (isDark ? 'bg-emerald-900/50' : 'bg-emerald-50') : (isDark ? 'bg-red-900/50' : 'bg-red-50')}`}>
                          {isPositive ? (
                            <TrendingUp className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                          ) : (
                            <TrendingDown className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className={`text-2xl font-bold font-['JetBrains_Mono'] ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                          ${stock.price.toFixed(2)}
                        </div>
                        <div className={`flex items-center gap-1 mt-1 text-sm font-semibold ${
                          isPositive ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-red-400' : 'text-red-600')
                        }`}>
                          {isPositive ? '↑' : '↓'} ${Math.abs(stock.changeValue).toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                        </div>
                      </div>
                      
                      <div className={`flex items-center justify-between text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span className="font-medium">Vol: {formatVolume(stock.volume)}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(stock.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Data Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-sm border overflow-hidden`}
              >
                <div className={`px-6 py-4 ${isDark ? 'bg-gray-900/50' : 'bg-gradient-to-r from-gray-50 to-gray-50/50'} border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xl font-bold font-['Space_Grotesk'] ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                      Market Overview
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Last Update</span>
                      <div className={`flex items-center gap-2 px-3 py-1 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-full border`}>
                        <Clock className={`w-3 h-3 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                        <span className={`text-xs font-mono ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                          Symbol
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                          Price
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                          Change
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                          Volume
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-100'}`}>
                      {stocks.map((stock, index) => {
                        const isPositive = stock.change === '+';
                        return (
                          <motion.tr
                            key={stock.symbol}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + index * 0.05 }}
                            className={`${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition-colors`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <CompanyLogo symbol={stock.symbol} size="lg" />
                                <div>
                                  <span className={`font-bold text-base ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                                    {stock.symbol}
                                  </span>
                                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} font-medium`}>
                                    {stock.name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                                ${stock.price.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className={`flex items-center gap-1 ${
                                isPositive ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-red-400' : 'text-red-600')
                              }`}>
                                {isPositive ? '↑' : '↓'}
                                <span className="font-semibold">${Math.abs(stock.changeValue).toFixed(2)} ({stock.changePercent.toFixed(2)}%)</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                {formatVolume(stock.volume)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelectedStock(stock)}
                                className="btn-modern text-sm py-2 px-4"
                              >
                                View Chart
                              </motion.button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Stock Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {stocks.slice(0, 4).map((stock, index) => (
                  <motion.div
                    key={stock.symbol}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow`}
                  >
                    <div className={`px-6 py-4 ${isDark ? 'bg-gray-900/50' : 'bg-gradient-to-r from-gray-50 to-gray-50/30'} border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                      <div className="flex items-center justify-between">
                        <h3 className={`text-lg font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{stock.symbol} Chart</h3>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>1D</span>
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <StockChart symbol={stock.symbol} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Selected Stock Modal */}
      <AnimatePresence>
        {selectedStock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setSelectedStock(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold font-['Space_Grotesk'] ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  {selectedStock.symbol} Details
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedStock(null)}
                  className={`p-2 ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} rounded-xl transition-colors`}
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>
              
              <div className="h-96">
                <StockChart symbol={selectedStock.symbol} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MarketDataTable;