import React, { useEffect, useState } from 'react';
import { fetchLiveFollowedMarketData } from '../api/liveMarket';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle, BarChart3, Activity, Zap, ArrowUpRight, ArrowDownRight, Clock, X } from 'lucide-react';
import StockChart from './StockChart';

const MarketDataTable = () => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchEnabled, setFetchEnabled] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);

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

  const stocks = Array.isArray(data) ? data : Object.entries(data).map(([symbol, value]) => ({
    symbol,
    price: parseFloat(value.price),
    timestamp: new Date().toISOString(),
    change: Math.random() > 0.5 ? '+' : '-',
    changePercent: (Math.random() * 5).toFixed(2),
    volume: Math.floor(Math.random() * 10000000),
  }));

  const handleRetry = () => {
    setError(null);
    setFetchEnabled(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="space-y-8"
    >
      {/* Futuristic Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="card-neon hover-glow relative overflow-hidden"
      >
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--accent-neon-cyan)] to-[var(--accent-neon-purple)] rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[var(--accent-neon-pink)] to-[var(--accent-neon-blue)] rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="p-4 bg-gradient-to-br from-[var(--accent-neon-cyan)] to-[var(--accent-neon-purple)] rounded-2xl shadow-2xl"
            >
              <Activity className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h2 className="heading-2 text-gradient-neon">
                Live Market Data
              </h2>
              <p className="text-[var(--text-secondary)] text-sm mt-1">Real-time stock prices with AI predictions</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {fetchEnabled && (
              <div className="flex items-center gap-2 px-4 py-2 glass rounded-full">
                <div className="w-2 h-2 rounded-full bg-[var(--accent-neon-green)] animate-pulse"></div>
                <span className="text-xs font-semibold text-[var(--text-secondary)]">LIVE</span>
              </div>
            )}
            
            {!fetchEnabled && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-neon px-6 py-3 font-bold flex items-center gap-2"
                onClick={() => setFetchEnabled(true)}
              >
                <Zap className="w-5 h-5" />
                Activate Live Feed
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Loading State with Futuristic Design */}
      <AnimatePresence>
        {loading && fetchEnabled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-dark rounded-2xl p-8 text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
              <div className="absolute w-20 h-20 border-4 border-[var(--accent-neon-purple)]/20 rounded-full"></div>
              <div className="absolute w-20 h-20 border-4 border-t-[var(--accent-neon-cyan)] rounded-full animate-spin"></div>
              <BarChart3 className="w-8 h-8 text-[var(--accent-neon-purple)]" />
            </div>
            <p className="text-lg font-semibold text-[var(--text-primary)]">Fetching Market Data</p>
            <p className="text-sm text-[var(--text-tertiary)] mt-2">Connecting to real-time data feeds...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State with Futuristic Design */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-dark border border-[var(--error)]/30 rounded-2xl p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--error)]/20 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 flex items-start gap-4">
              <div className="p-3 bg-[var(--error)]/20 rounded-xl">
                <AlertCircle className="w-6 h-6 text-[var(--error)]" />
              </div>
              <div className="flex-1">
                <h3 className="text-[var(--error)] font-bold text-lg mb-2">Connection Error</h3>
                <p className="text-[var(--text-secondary)] text-sm mb-4">{error}</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn px-5 py-2.5 bg-[var(--error)] text-white font-semibold"
                  onClick={handleRetry}
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry Connection
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Market Data Content with Futuristic Design */}
      <AnimatePresence>
        {fetchEnabled && !loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {stocks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-dark rounded-2xl p-12 text-center"
              >
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[var(--accent-neon-purple)]/20 to-[var(--accent-neon-cyan)]/20 rounded-3xl mb-6">
                  <BarChart3 className="w-12 h-12 text-[var(--accent-neon-cyan)]" />
                </div>
                <h3 className="heading-3 mb-3">No Stocks in Portfolio</h3>
                <p className="text-[var(--text-secondary)] max-w-md mx-auto">
                  Add stocks to your watchlist to see real-time market data and AI predictions.
                </p>
              </motion.div>
            ) : (
              <>
                {/* Market Summary Cards with Glassmorphism */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stocks.slice(0, 4).map((stock, index) => {
                    const isPositive = stock.change === '+';
                    return (
                      <motion.div
                        key={stock.symbol}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, type: "spring" }}
                        whileHover={{ y: -8, transition: { duration: 0.2 } }}
                        className="glass hover:bg-white/5 rounded-2xl p-6 cursor-pointer group relative overflow-hidden border border-[var(--dark-border)] hover:border-[var(--accent-neon-purple)]/50"
                        onClick={() => setSelectedStock(stock)}
                      >
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-neon-purple)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-xl text-[var(--text-primary)]">{stock.symbol}</h3>
                            <div className={`p-2 rounded-lg ${isPositive ? 'bg-[var(--success)]/20' : 'bg-[var(--error)]/20'}`}>
                              {isPositive ? (
                                <TrendingUp className="w-4 h-4 text-[var(--success)]" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-[var(--error)]" />
                              )}
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <div className="text-3xl font-bold text-gradient-neon">
                              ${stock.price.toFixed(2)}
                            </div>
                            <div className={`flex items-center gap-1 mt-1 text-sm font-semibold ${
                              isPositive ? 'text-[var(--success)]' : 'text-[var(--error)]'
                            }`}>
                              {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                              {stock.changePercent}%
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                            <span>Vol: {(stock.volume / 1000000).toFixed(2)}M</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(stock.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        
                        {/* Hover Glow Effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent-neon-purple)] to-[var(--accent-neon-cyan)] rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300"></div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Futuristic Data Table with Glassmorphism */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="glass-dark rounded-2xl overflow-hidden border border-[var(--dark-border-light)] shadow-2xl"
                >
                  <div className="px-8 py-6 border-b border-[var(--dark-border)] bg-gradient-to-r from-[var(--accent-neon-purple)]/10 to-[var(--accent-neon-cyan)]/10">
                    <div className="flex items-center justify-between">
                      <h3 className="heading-3 text-gradient-neon">Market Overview</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-[var(--text-tertiary)]">Last Update</span>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--dark-surface)] rounded-full">
                          <Clock className="w-3 h-3 text-[var(--accent-neon-cyan)]" />
                          <span className="text-xs font-mono text-[var(--text-secondary)]">
                            {new Date().toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[var(--dark-border)]">
                          <th className="px-8 py-4 text-left text-xs font-bold text-[var(--accent-neon-cyan)] uppercase tracking-wider">
                            Symbol
                          </th>
                          <th className="px-8 py-4 text-left text-xs font-bold text-[var(--accent-neon-cyan)] uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-8 py-4 text-left text-xs font-bold text-[var(--accent-neon-cyan)] uppercase tracking-wider">
                            Change
                          </th>
                          <th className="px-8 py-4 text-left text-xs font-bold text-[var(--accent-neon-cyan)] uppercase tracking-wider">
                            Volume
                          </th>
                          <th className="px-8 py-4 text-left text-xs font-bold text-[var(--accent-neon-cyan)] uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {stocks.map((stock, index) => {
                          const isPositive = stock.change === '+';
                          return (
                            <motion.tr
                              key={stock.symbol}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5 + index * 0.05 }}
                              className="border-b border-[var(--dark-border)] hover:bg-white/5 transition-all duration-200 group"
                            >
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-neon-purple)] to-[var(--accent-neon-pink)] flex items-center justify-center shadow-lg">
                                    <span className="text-white font-bold text-sm">
                                      {stock.symbol.charAt(0)}
                                    </span>
                                  </div>
                                  <span className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-neon-purple)] transition-colors">
                                    {stock.symbol}
                                  </span>
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <span className="text-xl font-bold text-[var(--text-primary)]">
                                  ${stock.price.toFixed(2)}
                                </span>
                              </td>
                              <td className="px-8 py-5">
                                <div className={`flex items-center gap-2 ${
                                  isPositive ? 'text-[var(--success)]' : 'text-[var(--error)]'
                                }`}>
                                  {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                  <span className="font-semibold">{stock.changePercent}%</span>
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <span className="text-[var(--text-secondary)]">
                                  {(stock.volume / 1000000).toFixed(2)}M
                                </span>
                              </td>
                              <td className="px-8 py-5">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setSelectedStock(stock)}
                                  className="btn-neon px-4 py-2 text-sm font-semibold"
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

                {/* Stock Charts Grid with Futuristic Design */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {stocks.slice(0, 4).map((stock, index) => (
                    <motion.div
                      key={stock.symbol}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="glass-dark rounded-2xl overflow-hidden border border-[var(--dark-border-light)] hover:border-[var(--accent-neon-purple)]/50 transition-all duration-300 group"
                    >
                      <div className="px-6 py-4 border-b border-[var(--dark-border)] bg-gradient-to-r from-[var(--accent-neon-purple)]/5 to-[var(--accent-neon-cyan)]/5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-[var(--text-primary)]">{stock.symbol} Chart</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-[var(--text-tertiary)]">1D</span>
                            <div className="w-2 h-2 rounded-full bg-[var(--accent-neon-green)] animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--accent-neon-purple)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <StockChart symbol={stock.symbol} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Stock Modal */}
      <AnimatePresence>
        {selectedStock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-6"
            onClick={() => setSelectedStock(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-dark rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="heading-2 text-gradient-neon">{selectedStock.symbol} Details</h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedStock(null)}
                  className="p-3 glass hover:bg-white/10 rounded-xl"
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
    </motion.div>
  );
};

export default MarketDataTable;