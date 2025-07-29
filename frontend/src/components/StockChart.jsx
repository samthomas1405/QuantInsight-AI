import React, { useEffect, useState } from 'react';
import { fetchStockHistory } from '../api/liveMarket';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const StockChart = ({ symbol }) => {
  const [history, setHistory] = useState([]);
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchStockHistory(symbol)
      .then((data) => {
        const sorted = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setHistory(sorted);
        if (sorted.length > 0) {
          const start = sorted[0].price;
          const end = sorted[sorted.length - 1].price;
          setLatest({
            current: end,
            delta: (end - start).toFixed(2),
            percent: (((end - start) / start) * 100).toFixed(2)
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [symbol]);

  const isPositive = latest && parseFloat(latest.delta) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-md shadow-xl border border-white/10 p-6 mb-6"
    >
      {/* Glowing accent */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 ${
        isPositive ? 'bg-emerald-500' : 'bg-red-500'
      }`} />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
              {symbol}
            </h2>
            {latest && (
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-slate-300" />
                  <span className="text-xl font-semibold text-white">
                    ${latest.current.toFixed(2)}
                  </span>
                </div>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                  isPositive 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  ${latest.delta} ({latest.percent}%)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chart */}
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="flex items-center gap-2 text-slate-400">
              <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
              Loading chart...
            </div>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <XAxis 
                  dataKey="timestamp" 
                  hide 
                />
                <YAxis 
                  domain={['auto', 'auto']} 
                  hide 
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    borderRadius: '12px',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.3)'
                  }}
                  labelFormatter={(label) =>
                    `Time: ${new Date(label).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}`
                  }
                  formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={`url(#${symbol}-gradient)`}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ 
                    r: 8, 
                    fill: isPositive ? '#10b981' : '#ef4444',
                    stroke: 'rgba(255, 255, 255, 0.2)',
                    strokeWidth: 3 
                  }}
                />
                <defs>
                  <linearGradient id={`${symbol}-gradient`} x1="0" y1="0" x2="0" y2="1">
                    <stop 
                      offset="0%" 
                      stopColor={isPositive ? '#10b981' : '#ef4444'} 
                      stopOpacity={0.8}
                    />
                    <stop 
                      offset="100%" 
                      stopColor={isPositive ? '#10b981' : '#ef4444'} 
                      stopOpacity={0.2}
                    />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StockChart;