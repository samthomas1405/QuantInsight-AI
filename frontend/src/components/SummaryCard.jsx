import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';

const SummaryCard = ({ 
  title, 
  value, 
  icon: Icon, 
  format = 'number',
  trend,
  isDark = false,
  animate = true
}) => {
  const formatValue = () => {
    if (format === 'percent') {
      const sign = value > 0 ? '+' : '';
      return `${sign}${value.toFixed(2)}%`;
    }
    return value.toString();
  };

  const getValueColor = () => {
    if (format === 'percent') {
      if (value > 0) return 'text-green-600';
      if (value < 0) return 'text-red-600';
      return isDark ? 'text-gray-100' : 'text-gray-900';
    }
    return isDark ? 'text-gray-100' : 'text-gray-900';
  };

  const getTrendIcon = () => {
    if (format === 'percent') {
      if (value > 0) return TrendingUp;
      if (value < 0) return TrendingDown;
      return Minus;
    }
    return null;
  };

  const getTrendIconColor = () => {
    if (format === 'percent') {
      if (value > 0) return 'text-green-600';
      if (value < 0) return 'text-red-600';
      return isDark ? 'text-gray-600' : 'text-gray-900';
    }
    return '';
  };

  const TrendIcon = getTrendIcon();

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 20 } : {}}
      animate={animate ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3 }}
      className={`
        p-6 rounded-xl border
        ${isDark 
          ? 'bg-gray-800/30 border-gray-700/50' 
          : 'bg-white border-gray-100'
        }
        shadow-sm relative
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {title}
        </h3>
        {TrendIcon && format === 'percent' && (
          <TrendIcon className={`w-4 h-4 ${getTrendIconColor()}`} />
        )}
        {Icon && format !== 'percent' && (
          <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
            <Icon className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
          </div>
        )}
      </div>
      
      <div className={`text-2xl font-bold ${getValueColor()}`}>
        {formatValue()}
      </div>
    </motion.div>
  );
};

export default SummaryCard;