import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownRight, LineChart, BarChart3, X, Trash2 } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import StockChart from './StockChart';
import { unfollowStock } from '../api/stock';

const PortfolioRow = ({
  stock,
  isDark = false,
  index = 0,
  onDelete
}) => {
  const [previousPrice, setPreviousPrice] = useState(stock.current_price);
  const [isPriceUpdating, setIsPriceUpdating] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (stock.current_price !== previousPrice) {
      setIsPriceUpdating(true);
      const timer = setTimeout(() => {
        setIsPriceUpdating(false);
        setPreviousPrice(stock.current_price);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [stock.current_price, previousPrice]);

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
    return { isPositive, change, percentChange };
  };

  const changeData = formatChange(stock.change, stock.percent_change);
  const changeColor = changeData.isPositive 
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400';

  // Use actual day high/low data from API
  const dayHigh = stock.high || stock.current_price * 1.02;
  const dayLow = stock.low || stock.current_price * 0.98;
  const dayRange = dayHigh > dayLow ? ((stock.current_price - dayLow) / (dayHigh - dayLow)) * 100 : 50;

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Recently';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await unfollowStock(stock.symbol, token);
      setShowDeleteConfirm(false);
      if (onDelete) {
        onDelete(stock.symbol);
      }
    } catch (error) {
      console.error('Failed to delete stock:', error);
      alert('Failed to delete stock. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`
        p-5 rounded-xl border transition-all duration-200
        ${isDark 
          ? 'bg-gray-800/30 border-gray-700/50 hover:border-gray-600/50' 
          : 'bg-white border-gray-100 hover:border-gray-200'
        }
        shadow-sm hover:shadow-md cursor-pointer
      `}
    >
      {/* Header with Logo and Stock Info */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <CompanyLogo symbol={stock.symbol} size="md" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`font-semibold text-lg ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {stock.symbol}
              </h3>
            </div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {stock.sector || 'Stock'}
            </p>
          </div>
        </div>
        
        {/* Price and Change */}
        <div className="text-right">
          <div className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {formatPrice(stock.current_price)}
          </div>
          <div className={`text-sm font-medium ${changeColor}`}>
            <span>{changeData.isPositive ? '+' : ''}{formatPrice(Math.abs(changeData.change))}</span>
            <span className="ml-1">({changeData.isPositive ? '+' : ''}{changeData.percentChange.toFixed(2)}%)</span>
          </div>
        </div>
      </div>

      {/* Day Range and Stats */}
      <div className={`space-y-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        <div className="flex justify-between text-sm">
          <span>Day Range</span>
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Last Updated {formatTime(stock.last_updated)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {formatPrice(dayLow)}
          </span>
          <div className={`
            flex-1 h-2 rounded-full relative overflow-hidden
            ${isDark ? 'bg-gray-700' : 'bg-gray-200'}
          `}>
            <div 
              className="absolute h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${dayRange}%` }}
            />
          </div>
          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {formatPrice(dayHigh)}
          </span>
        </div>
        
        {/* Actions Row */}
        <div className="flex items-center justify-between pt-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
              flex items-center gap-2
              ${isDark 
                ? 'bg-gray-700 hover:bg-red-900/30 text-gray-400 hover:text-red-400' 
                : 'bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600'
              }
            `}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowChart(true);
            }}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
              flex items-center gap-2
              ${isDark 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }
            `}
          >
            <LineChart className="w-4 h-4" />
            View Chart
          </motion.button>
        </div>
      </div>
      
      {/* Chart Modal */}
      <AnimatePresence>
        {showChart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowChart(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowChart(false)}
                  className={`absolute -top-2 -right-2 z-10 p-2 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-white hover:bg-gray-100 text-gray-700'} rounded-full shadow-lg transition-colors`}
                >
                  <X className="w-5 h-5" />
                </motion.button>
                <StockChart symbol={stock.symbol} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 max-w-sm w-full shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                Delete {stock.symbol}?
              </h3>
              <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Are you sure you want to remove {stock.name || stock.symbol} from your portfolio? This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className={`
                    flex-1 px-4 py-2 rounded-lg font-medium transition-colors
                    ${isDark 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }
                    ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  Cancel
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className={`
                    flex-1 px-4 py-2 rounded-lg font-medium transition-colors
                    ${isDark 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                    }
                    ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PortfolioRow;