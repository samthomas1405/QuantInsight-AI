import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ExternalLink, Plus, ArrowUpRight, ArrowDownRight, DollarSign, BarChart3 } from 'lucide-react';
import { fetchLiveFollowedMarketData } from '../api/liveMarket';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import Sparkline from './Sparkline';
import CompanyLogo from './CompanyLogo';

const DashboardHome = () => {
  const [followedStocks, setFollowedStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isDark } = useTheme();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      // Fetch followed stocks
      const stocksResponse = await fetchLiveFollowedMarketData(token);
      
      // Convert dictionary response to array format
      const stocksArray = stocksResponse ? Object.entries(stocksResponse).map(([symbol, data]) => ({
        symbol: symbol,
        name: symbol,
        current_price: data?.price || 0,
        change: data?.change || 0,
        percent_change: data?.percent_change || 0,
        last_updated: data?.last_updated || new Date().toISOString(),
        sparklineData: Array.from({ length: 20 }, () => Math.random() * 100 + 50),
      })) : [];
      
      setFollowedStocks(stocksArray);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setFollowedStocks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowMore = () => {
    navigate('/select-stocks');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatChange = (change, percentChange) => {
    const isPositive = change >= 0;
    const sign = isPositive ? '+' : '';
    return { isPositive, sign, change, percentChange };
  };

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Portfolio Summary Skeleton */}
        <div className={`section-header ${isDark ? 'dark' : ''}`}>
          <div className={`skeleton ${isDark ? 'dark' : ''} h-6 w-48 mb-2`}></div>
          <div className={`skeleton ${isDark ? 'dark' : ''} h-4 w-64`}></div>
        </div>
        
        {/* Quick Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`data-row ${isDark ? 'dark' : ''} p-6`}>
              <div className={`skeleton ${isDark ? 'dark' : ''} h-8 w-16 mb-2`}></div>
              <div className={`skeleton ${isDark ? 'dark' : ''} h-4 w-24`}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const portfolioValue = followedStocks.reduce((acc, stock) => acc + stock.current_price, 0);
  const avgChangePercent = followedStocks.length > 0 
    ? followedStocks.reduce((acc, stock) => acc + (stock.percent_change || 0), 0) / followedStocks.length
    : 0;

  return (
    <div className="space-y-8">
      {/* Portfolio Summary */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-3xl font-bold font-['Space_Grotesk'] ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Portfolio Overview
            </h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Track your investments in real-time
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleFollowMore}
            className="btn-modern interactive-scale"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Stocks
          </motion.button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`data-row ${isDark ? 'dark' : ''} p-6`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-2xl font-bold font-['JetBrains_Mono'] ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {formatPrice(portfolioValue)}
              </div>
              <div className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wider mt-1`}>
                Total Value
              </div>
            </div>
            <div className={`p-3 ${isDark ? 'bg-indigo-900/30' : 'bg-indigo-100'} rounded-xl`}>
              <DollarSign className={`w-6 h-6 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`data-row ${isDark ? 'dark' : ''} p-6`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-2xl font-bold font-['JetBrains_Mono'] ${
                avgChangePercent >= 0 
                  ? (isDark ? 'text-green-400' : 'text-green-600')
                  : (isDark ? 'text-red-400' : 'text-red-600')
              }`}>
                {avgChangePercent >= 0 ? '+' : ''}{avgChangePercent.toFixed(2)}%
              </div>
              <div className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wider mt-1`}>
                Avg Change
              </div>
            </div>
            <div className={`p-3 ${
              avgChangePercent >= 0 
                ? (isDark ? 'bg-green-900/30' : 'bg-green-100') 
                : (isDark ? 'bg-red-900/30' : 'bg-red-100')
            } rounded-xl`}>
              {avgChangePercent >= 0 ? (
                <TrendingUp className={`w-6 h-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              ) : (
                <ArrowDownRight className={`w-6 h-6 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`data-row ${isDark ? 'dark' : ''} p-6`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-2xl font-bold font-['JetBrains_Mono'] ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {followedStocks.length}
              </div>
              <div className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wider mt-1`}>
                Stocks Tracked
              </div>
            </div>
            <div className={`p-3 ${isDark ? 'bg-purple-900/30' : 'bg-purple-100'} rounded-xl`}>
              <BarChart3 className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Stocks List */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-xl ${isDark ? 'bg-indigo-900/20' : 'bg-indigo-100'}`}>
            <TrendingUp className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
          </div>
          <h3 className={`text-xl font-bold font-['Space_Grotesk'] ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            Your Portfolio
          </h3>
        </div>

          {followedStocks.length === 0 ? (
            <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <TrendingUp className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <h4 className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>No stocks tracked yet</h4>
              <p className="text-sm mb-4">Add stocks to your watchlist to see them here</p>
              <button
                onClick={handleFollowMore}
                className="btn-modern interactive-scale"
              >
                Add Your First Stock
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {followedStocks.map((stock, index) => {
                const changeData = formatChange(stock.change, stock.percent_change);
                const changeColor = changeData.isPositive 
                  ? (isDark ? 'text-green-400' : 'text-green-600')
                  : (isDark ? 'text-red-400' : 'text-red-600');

                return (
                  <motion.div
                    key={stock.symbol}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-lg cursor-pointer p-5 ${
                      isDark 
                        ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Gradient accent on hover */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r ${
                      changeData.isPositive 
                        ? 'from-emerald-500/5 to-green-500/5' 
                        : 'from-red-500/5 to-pink-500/5'
                    }`} />
                    
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-6 flex-1">
                        {/* Logo & Symbol */}
                        <div className="flex items-center gap-3">
                          <CompanyLogo symbol={stock.symbol} size="lg" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`font-bold text-xl font-['Space_Grotesk'] ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                                {stock.symbol}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                changeData.isPositive
                                  ? isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                                  : isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
                              }`}>
                                {changeData.isPositive ? 'UP' : 'DOWN'}
                              </span>
                            </div>
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Technology Stock
                            </div>
                          </div>
                        </div>
                        
                        {/* Sparkline */}
                        <div className="flex-1 max-w-[180px]">
                          <Sparkline 
                            data={stock.sparklineData} 
                            color={changeData.isPositive ? '#10b981' : '#ef4444'}
                            width={180}
                            height={50}
                          />
                        </div>
                        
                        {/* Price & Change */}
                        <div className="text-right">
                          <div className={`font-bold text-2xl font-['JetBrains_Mono'] ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                            {formatPrice(stock.current_price)}
                          </div>
                          <div className={`flex items-center justify-end gap-1 ${changeColor} font-semibold`}>
                            {changeData.isPositive ? (
                              <ArrowUpRight className="w-4 h-4" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4" />
                            )}
                            <span className="font-['JetBrains_Mono']">
                              {changeData.sign}{changeData.percentChange?.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                        
                        {/* View News Button */}
                        <a
                          href={`https://finance.yahoo.com/quote/${stock.symbol}/news`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap ${
                            isDark 
                              ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30' 
                              : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                          }`}
                        >
                          <span>View News</span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
  );
};

export default DashboardHome;