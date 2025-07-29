import React, { useEffect, useState } from 'react';
import { fetchLiveFollowedMarketData } from '../api/liveMarket';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, RefreshCw, AlertCircle, BarChart3 } from 'lucide-react';
import StockChart from './StockChart';

const MarketDataTable = () => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchEnabled, setFetchEnabled] = useState(false);

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
  }));

  const handleRetry = () => {
    setError(null);
    setFetchEnabled(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-6"
    >
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-md shadow-xl border border-white/10 p-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
                Live Market Data
              </h2>
              <p className="text-slate-300 text-sm">Real-time stock prices and trends</p>
            </div>
          </div>
          {!fetchEnabled && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white rounded-xl font-medium shadow-lg"
              onClick={() => setFetchEnabled(true)}
            >
              <RefreshCw className="w-4 h-4" />
              Load Market Data
            </motion.button>
          )}
        </div>
      </div>

      {/* Loading State */}
      <AnimatePresence>
        {loading && fetchEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-md shadow-xl border border-white/10 p-8"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative z-10 flex items-center justify-center gap-3 text-slate-300">
              <div className="w-6 h-6 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
              <span>Loading market data...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative overflow-hidden rounded-2xl bg-red-500/10 backdrop-blur-md shadow-xl border border-red-500/20 p-6"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/20 rounded-full blur-2xl" />
            <div className="relative z-10 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-red-400 font-medium mb-2">Error Loading Market Data</h3>
                <p className="text-red-300 text-sm mb-3">{error}</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded-lg text-sm font-medium transition-colors"
                  onClick={handleRetry}
                >
                  Retry
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Market Data Content */}
      <AnimatePresence>
        {fetchEnabled && !loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {stocks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-md shadow-xl border border-white/10 p-8 text-center"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/20 rounded-full blur-2xl" />
                <div className="relative z-10">
                  <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-slate-300 font-medium mb-2">No Stocks Found</h3>
                  <p className="text-slate-400 text-sm">Add some stocks to your watchlist to see live market data.</p>
                </div>
              </motion.div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stocks.slice(0, 3).map((stock, index) => (
                    <motion.div
                      key={stock.symbol}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-md shadow-lg border border-white/10 p-4"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/20 rounded-full blur-xl" />
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-white">{stock.symbol}</h3>
                          <DollarSign className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">
                          ${stock.price.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(stock.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Detailed Table */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-md shadow-xl border border-white/10 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
                  <div className="relative z-10">
                    <div className="px-6 py-4 border-b border-white/10">
                      <h3 className="text-lg font-semibold text-white">Market Overview</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-white/5">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                              Symbol
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                              Price
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                              Last Updated
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {stocks.map((stock, index) => (
                            <motion.tr
                              key={stock.symbol}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.4 + index * 0.05 }}
                              className="hover:bg-white/5 transition-colors"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="font-medium text-white">{stock.symbol}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-white font-semibold">${stock.price.toFixed(2)}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                {new Date(stock.timestamp).toLocaleTimeString()}
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>

                {/* Stock Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {stocks.map((stock, index) => (
                    <motion.div
                      key={stock.symbol}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      <StockChart symbol={stock.symbol} />
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MarketDataTable;