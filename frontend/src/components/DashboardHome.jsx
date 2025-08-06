import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, FileText, Clock, ExternalLink, Plus } from 'lucide-react';
import { fetchLiveFollowedMarketData } from '../api/liveMarket';
import { fetchNewsForStocks } from '../api/news';
import { useNavigate } from 'react-router-dom';

const DashboardHome = () => {
  const [followedStocks, setFollowedStocks] = useState([]);
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Get token from localStorage
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
        name: symbol, // We'll use symbol as name since we don't have company names
        current_price: data?.price || 0,
        change: data?.change || 0,
        percent_change: data?.percent_change || 0,
        last_updated: data?.last_updated || new Date().toISOString()
      })) : [];
      
      console.log('Stock data received:', stocksResponse);
      console.log('Processed stocks array:', stocksArray);
      setFollowedStocks(stocksArray);

      // Fetch news for followed stocks
      const stockSymbols = stocksArray.map(stock => stock.symbol).join(',');
      if (stockSymbols) {
        try {
          const newsResponse = await fetchNewsForStocks(stockSymbols);
          // The API returns {data: [...], message: "..."}, so we need to access response.data.data
          setNewsData(newsResponse.data?.data || []);
          console.log('Processed news:', newsResponse);
        } catch (newsError) {
          console.error('Error fetching news:', newsError);
          setNewsData([]);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setFollowedStocks([]);
      setNewsData([]);
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
    return (
      <span className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {sign}{formatPrice(change)} ({sign}{percentChange?.toFixed(2)}%)
      </span>
    );
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Recently';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      
      // Handle invalid dates
      if (isNaN(date.getTime())) {
        return 'Recently';
      }
      
      // Handle future dates (news might have future publication dates)
      if (diffInMinutes < 0) {
        return date.toLocaleDateString();
      }
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      if (diffInMinutes < 2880) return 'Yesterday';
      if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Recently';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Your followed stocks and latest news</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleFollowMore}
          className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Follow More Stocks</span>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Followed Stocks Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Followed Stocks</h2>
              <p className="text-gray-600 text-sm">Real-time market data</p>
            </div>
          </div>

          {followedStocks.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No stocks followed yet</p>
              <p className="text-gray-500 text-sm">Add stocks to your watchlist to see them here</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {followedStocks.map((stock, index) => (
                <motion.div
                  key={stock.symbol}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-all duration-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{stock.symbol.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{stock.symbol}</h3>
                        <p className="text-gray-600 text-sm">{stock.name}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatPrice(stock.current_price)}
                    </div>
                    <div className="text-sm">
                      {formatChange(stock.change, stock.percent_change)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* News Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Latest News</h2>
              <p className="text-gray-600 text-sm">News about your followed stocks</p>
            </div>
          </div>

          {newsData.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No news available</p>
              <p className="text-gray-500 text-sm">News will appear here when available</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {newsData.map((news, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-all duration-200"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm leading-tight mb-2">
                        {news.title}
                      </h3>
                      <p className="text-gray-600 text-xs leading-relaxed mb-3">
                        {news.snippet}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{news.published || formatTime(news.timestamp)}</span>
                          </div>
                          {news.source && (
                            <span className="bg-gray-100 px-2 py-1 rounded-full">
                              {news.source}
                            </span>
                          )}
                        </div>
                        {news.url && (
                          <a
                            href={news.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors duration-200"
                          >
                            <span className="text-xs">Read</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardHome;