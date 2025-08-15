import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownRight } from 'lucide-react';
import CompanyLogo from './CompanyLogo';

const PortfolioRow = ({
  stock,
  isDark = false,
  index = 0
}) => {
  const [previousPrice, setPreviousPrice] = useState(stock.current_price);
  const [isPriceUpdating, setIsPriceUpdating] = useState(false);

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
              {!changeData.isPositive && (
                <span className={`
                  inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                  bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400
                `}>
                  <ArrowDownRight className="w-3 h-3" />
                  Loser
                </span>
              )}
            </div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Technology Stock
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

      {/* Day Range */}
      <div className={`space-y-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
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
      </div>
    </motion.div>
  );
};

export default PortfolioRow;