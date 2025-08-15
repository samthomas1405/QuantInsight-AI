import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, Search, ChevronDown, RefreshCw, Plus, Activity } from 'lucide-react';
import { fetchLiveFollowedMarketData } from '../api/liveMarket';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import SummaryCard from './SummaryCard';
import PortfolioRow from './PortfolioRow';
import TopMovers from './TopMovers';
import QuickLinks from './QuickLinks';

const DashboardHome = () => {
  const [followedStocks, setFollowedStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('symbol');
  const [filterQuery, setFilterQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const { isDark } = useTheme();

  useEffect(() => {
    loadDashboardData();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    if (!loading) setIsRefreshing(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      const stocksResponse = await fetchLiveFollowedMarketData(token);
      
      const stocksArray = stocksResponse ? Object.entries(stocksResponse).map(([symbol, data]) => ({
        symbol: symbol,
        name: symbol,
        current_price: data?.price || 0,
        change: data?.change || 0,
        percent_change: data?.percent_change || 0,
        high: data?.high || 0,
        low: data?.low || 0,
        open: data?.open || 0,
        previous_close: data?.previous_close || 0,
        last_updated: data?.last_updated || new Date().toISOString(),
      })) : [];
      
      setFollowedStocks(stocksArray);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setFollowedStocks([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo(() => {
    if (followedStocks.length === 0) {
      return {
        avgChangePercent: 0,
        stockCount: 0
      };
    }

    const avgChangePercent = followedStocks.reduce((acc, stock) => acc + (stock.percent_change || 0), 0) / followedStocks.length;

    return {
      avgChangePercent,
      stockCount: followedStocks.length
    };
  }, [followedStocks]);

  // Sort and filter stocks
  const processedStocks = useMemo(() => {
    let filtered = followedStocks;
    
    // Apply filter
    if (filterQuery) {
      filtered = followedStocks.filter(stock => 
        stock.symbol.toLowerCase().includes(filterQuery.toLowerCase())
      );
    }

    // Apply sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'symbol':
          return a.symbol.localeCompare(b.symbol);
        case 'price':
          return b.current_price - a.current_price;
        case 'change':
          return b.percent_change - a.percent_change;
        default:
          return 0;
      }
    });

    return sorted;
  }, [followedStocks, sortBy, filterQuery]);

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className={`text-2xl lg:text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  Portfolio Overview
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Track your investments in real-time
                  </p>
                  <LiveIndicator isDark={isDark} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={loadDashboardData}
                  disabled={isRefreshing}
                  className={`
                    p-2.5 rounded-lg transition-all duration-200
                    ${isDark 
                      ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' 
                      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                    }
                    ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/select-stocks')}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Stocks
                </motion.button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mb-8">
            <SummaryCard
              title="AVERAGE CHANGE"
              value={portfolioMetrics.avgChangePercent}
              trend={portfolioMetrics.avgChangePercent > 0 ? 'up' : portfolioMetrics.avgChangePercent < 0 ? 'down' : 'neutral'}
              icon={TrendingUp}
              format="percent"
              isDark={isDark}
            />
            <SummaryCard
              title="STOCKS TRACKED"
              value={portfolioMetrics.stockCount}
              icon={BarChart3}
              format="number"
              isDark={isDark}
              animate={false}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Portfolio List */}
            <div className="lg:col-span-2">
              <div className={`
                p-6 rounded-xl border mb-6
                ${isDark 
                  ? 'bg-gray-800/30 border-gray-700/50' 
                  : 'bg-white border-gray-100'
                }
                shadow-sm
              `}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <h2 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    Your Portfolio
                  </h2>
                  
                  <div className="flex gap-3 w-full sm:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 sm:flex-initial">
                      <Search className={`
                        absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4
                        ${isDark ? 'text-gray-500' : 'text-gray-400'}
                      `} />
                      <input
                        type="text"
                        placeholder="Filter by ticker..."
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value)}
                        className={`
                          pl-9 pr-3 py-2 rounded-lg border text-sm w-full sm:w-48
                          ${isDark 
                            ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' 
                            : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                          }
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        `}
                      />
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className={`
                          appearance-none pl-3 pr-8 py-2 rounded-lg border text-sm cursor-pointer
                          ${isDark 
                            ? 'bg-gray-800 border-gray-700 text-gray-200' 
                            : 'bg-gray-50 border-gray-300 text-gray-900'
                          }
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        `}
                      >
                        <option value="symbol">Sort by Name</option>
                        <option value="price">Sort by Price</option>
                        <option value="change">Sort by Change</option>
                      </select>
                      <ChevronDown className={`
                        absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none
                        ${isDark ? 'text-gray-500' : 'text-gray-400'}
                      `} />
                    </div>
                  </div>
                </div>

                {/* Portfolio Rows */}
                {processedStocks.length === 0 ? (
                  <EmptyState 
                    isDark={isDark} 
                    hasStocks={followedStocks.length > 0}
                    onAddStocks={() => navigate('/select-stocks')}
                  />
                ) : (
                  <div className="space-y-4">
                    {processedStocks.map((stock, index) => (
                      <PortfolioRow
                        key={stock.symbol}
                        stock={stock}
                        isDark={isDark}
                        index={index}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Side Panels */}
            <div className="space-y-6">
              <TopMovers stocks={followedStocks} isDark={isDark} />
              <QuickLinks stocks={followedStocks} isDark={isDark} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Live Indicator Component
const LiveIndicator = ({ isDark }) => (
  <motion.div 
    className="flex items-center gap-1.5"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.5 }}
  >
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        opacity: [1, 0.7, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="relative"
    >
      <div className="w-2 h-2 bg-green-500 rounded-full" />
    </motion.div>
    <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
      Live
    </span>
  </motion.div>
);

// Empty State Component
const EmptyState = ({ isDark, hasStocks, onAddStocks }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`
      text-center py-16 px-8 rounded-xl border
      ${isDark 
        ? 'bg-gray-800/30 border-gray-700/50' 
        : 'bg-white border-gray-100'
      }
      shadow-sm
    `}
  >
    <Activity className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
    <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
      {hasStocks ? 'No stocks match your filter' : 'No stocks tracked yet'}
    </h3>
    <p className={`text-sm mb-6 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
      {hasStocks 
        ? 'Try adjusting your search criteria' 
        : 'Add stocks to your watchlist to see them here'
      }
    </p>
    {!hasStocks && (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onAddStocks}
        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors"
      >
        Add Your First Stock
      </motion.button>
    )}
  </motion.div>
);

export default DashboardHome;