import { motion } from 'framer-motion';
import { ExternalLink, Newspaper, BarChart3 } from 'lucide-react';

const QuickLinks = ({ stocks = [], isDark = false }) => {
  const links = stocks.slice(0, 2).map((stock, index) => {
    if (index === 0) {
      return {
        title: `Latest news on ${stock.symbol}`,
        subtitle: 'Breaking stories and analysis',
        icon: Newspaper,
        symbol: stock.symbol,
        url: `https://finance.yahoo.com/quote/${stock.symbol}/news`
      };
    } else {
      return {
        title: `Market insights for ${stock.symbol}`,
        subtitle: 'Charts and technical data',
        icon: BarChart3,
        symbol: stock.symbol,
        url: `https://finance.yahoo.com/quote/${stock.symbol}`
      };
    }
  });

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
          Quick Links
        </h3>
        <div className="text-center py-8">
          <Newspaper className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            No links available
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
        Quick Links
      </h3>
      
      <div className="space-y-3">
        {links.map((link, index) => {
          const Icon = link.icon;
          
          return (
            <motion.a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ x: 4 }}
              className={`
                group flex items-center justify-between p-4 rounded-lg border transition-all duration-200
                ${isDark 
                  ? 'bg-gray-800/20 border-gray-700/50 hover:bg-gray-800/40 hover:border-gray-600/50' 
                  : 'bg-gray-50 border-gray-100 hover:bg-gray-100 hover:border-gray-200'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-200'}`}>
                  <Icon className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                </div>
                <div>
                  <div className={`font-medium text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                    {link.title}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {link.subtitle}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`
                  text-xs font-medium px-2 py-1 rounded
                  ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}
                `}>
                  {link.symbol}
                </span>
                <ExternalLink className={`
                  w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity
                  ${isDark ? 'text-gray-400' : 'text-gray-400'}
                `} />
              </div>
            </motion.a>
          );
        })}
      </div>
    </div>
  );
};

export default QuickLinks;