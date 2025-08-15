import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import CompanyLogo from './CompanyLogo';

const TopMovers = ({ stocks = [], isDark = false }) => {
  // Sort stocks by percent change
  const sortedStocks = [...stocks].sort((a, b) => b.percent_change - a.percent_change);
  const topGainers = sortedStocks.filter(s => s.percent_change > 0).slice(0, 3);
  const topLosers = sortedStocks.filter(s => s.percent_change < 0).slice(-3).reverse();

  const MoverRow = ({ stock, index, type }) => {
    const isGainer = type === 'gainer';
    const color = isGainer 
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';

    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`
          flex items-center justify-between p-3 rounded-lg transition-all duration-200
          ${isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}
        `}
      >
        <div className="flex items-center gap-3">
          <CompanyLogo symbol={stock.symbol} size="sm" />
          <div>
            <span className={`font-semibold text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
              {stock.symbol}
            </span>
            {isGainer ? (
              <ArrowUpRight className={`inline-block w-3 h-3 ml-1 ${color}`} />
            ) : (
              <ArrowDownRight className={`inline-block w-3 h-3 ml-1 ${color}`} />
            )}
          </div>
        </div>
        
        <span className={`text-sm font-bold ${color}`}>
          {isGainer ? '+' : ''}{stock.percent_change.toFixed(2)}%
        </span>
      </motion.div>
    );
  };

  if (stocks.length === 0) {
    return (
      <div className={`
        p-6 rounded-xl border
        ${isDark 
          ? 'bg-gray-800/30 border-gray-700/50' 
          : 'bg-white border-gray-100'
        }
        shadow-sm
      `}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          Top Movers
        </h3>
        <div className="text-center py-8">
          <TrendingUp className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            No movers to display
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      p-6 rounded-xl border
      ${isDark 
        ? 'bg-gray-800/30 border-gray-700/50' 
        : 'bg-white border-gray-100'
      }
      shadow-sm
    `}>
      <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
        Top Movers
      </h3>
      
      {/* Show either gainers or losers based on what's available */}
      {topLosers.length > 0 && (
        <div>
          <h4 className={`text-xs font-medium mb-3 flex items-center gap-2 uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
            Top Losers
          </h4>
          <div className="space-y-1">
            {topLosers.map((stock, index) => (
              <MoverRow key={stock.symbol} stock={stock} index={index} type="loser" />
            ))}
          </div>
        </div>
      )}
      
      {topGainers.length > 0 && topLosers.length > 0 && (
        <div className={`my-4 border-t ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`} />
      )}
      
      {topGainers.length > 0 && (
        <div>
          <h4 className={`text-xs font-medium mb-3 flex items-center gap-2 uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            Top Gainers
          </h4>
          <div className="space-y-1">
            {topGainers.map((stock, index) => (
              <MoverRow key={stock.symbol} stock={stock} index={index} type="gainer" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TopMovers;