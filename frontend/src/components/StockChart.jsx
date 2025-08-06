import React, { useEffect, useState } from 'react';
import { fetchStockHistory } from '../api/liveMarket';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Activity, Clock, Zap, BarChart3 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
  Dot
} from 'recharts';

const StockChart = ({ symbol }) => {
  const [history, setHistory] = useState([]);
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState('area');

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
            percent: (((end - start) / start) * 100).toFixed(2),
            high: Math.max(...sorted.map(d => d.price)),
            low: Math.min(...sorted.map(d => d.price)),
            avg: sorted.reduce((sum, d) => sum + d.price, 0) / sorted.length
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [symbol]);

  const isPositive = latest && parseFloat(latest.delta) >= 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const date = new Date(label * 1000);
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-dark rounded-xl p-4 border border-[var(--dark-border-light)] shadow-2xl"
        >
          <p className="text-xs text-[var(--text-tertiary)] mb-1">
            {date.toLocaleString()}
          </p>
          <p className="text-lg font-bold text-gradient-neon">
            ${payload[0].value.toFixed(2)}
          </p>
        </motion.div>
      );
    }
    return null;
  };

  const CustomDot = (props) => {
    const { cx, cy, index } = props;
    if (index === history.length - 1) {
      return (
        <g>
          <motion.circle
            initial={{ r: 0 }}
            animate={{ r: 8 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            cx={cx}
            cy={cy}
            fill={isPositive ? 'var(--accent-neon-green)' : 'var(--error)'}
            stroke="var(--dark-bg)"
            strokeWidth={2}
          />
          <motion.circle
            animate={{ r: [8, 16, 8] }}
            transition={{ duration: 2, repeat: Infinity }}
            cx={cx}
            cy={cy}
            fill="none"
            stroke={isPositive ? 'var(--accent-neon-green)' : 'var(--error)'}
            strokeWidth={2}
            opacity={0.3}
          />
        </g>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative"
    >
      {/* Futuristic Background Effects */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] opacity-20 animate-float ${
          isPositive ? 'bg-gradient-to-br from-[var(--accent-neon-green)] to-[var(--accent-neon-cyan)]' : 'bg-gradient-to-br from-[var(--error)] to-[var(--accent-neon-pink)]'
        }`} />
        <div className={`absolute bottom-0 left-0 w-48 h-48 rounded-full blur-[80px] opacity-20 animate-float ${
          isPositive ? 'bg-[var(--accent-neon-cyan)]' : 'bg-[var(--accent-neon-pink)]'
        }`} style={{ animationDelay: '2s' }} />
      </div>
      
      <div className="relative z-10">
        {/* Futuristic Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className={`p-3 rounded-xl shadow-lg ${
                  isPositive 
                    ? 'bg-gradient-to-br from-[var(--accent-neon-green)] to-[var(--accent-neon-cyan)]' 
                    : 'bg-gradient-to-br from-[var(--error)] to-[var(--accent-neon-pink)]'
                }`}
              >
                <Activity className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h3 className="text-2xl font-bold text-gradient-neon">
                  {symbol}
                </h3>
                <p className="text-xs text-[var(--text-tertiary)]">Real-time market data</p>
              </div>
            </div>
            
            {latest && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass rounded-xl p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-[var(--accent-neon-purple)]" />
                    <span className="text-xs text-[var(--text-tertiary)]">Current</span>
                  </div>
                  <p className="text-xl font-bold text-[var(--text-primary)]">
                    ${latest.current.toFixed(2)}
                  </p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`glass rounded-xl p-3 border ${
                    isPositive 
                      ? 'border-[var(--success)]/30' 
                      : 'border-[var(--error)]/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4 text-[var(--success)]" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-[var(--error)]" />
                    )}
                    <span className="text-xs text-[var(--text-tertiary)]">Change</span>
                  </div>
                  <p className={`text-xl font-bold ${
                    isPositive ? 'text-[var(--success)]' : 'text-[var(--error)]'
                  }`}>
                    {isPositive ? '+' : ''}{latest.percent}%
                  </p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass rounded-xl p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-[var(--accent-neon-cyan)]" />
                    <span className="text-xs text-[var(--text-tertiary)]">High</span>
                  </div>
                  <p className="text-xl font-bold text-[var(--text-primary)]">
                    ${latest.high.toFixed(2)}
                  </p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="glass rounded-xl p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="w-4 h-4 text-[var(--accent-neon-pink)]" />
                    <span className="text-xs text-[var(--text-tertiary)]">Low</span>
                  </div>
                  <p className="text-xl font-bold text-[var(--text-primary)]">
                    ${latest.low.toFixed(2)}
                  </p>
                </motion.div>
              </div>
            )}
          </div>
          
          {/* Chart Type Selector */}
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setChartType('area')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                chartType === 'area' 
                  ? 'bg-[var(--accent-neon-purple)] text-white' 
                  : 'glass text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Area
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setChartType('line')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                chartType === 'line' 
                  ? 'bg-[var(--accent-neon-purple)] text-white' 
                  : 'glass text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Line
            </motion.button>
          </div>
        </div>

        {/* Chart */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-64 flex items-center justify-center"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
                  <div className="absolute w-16 h-16 border-4 border-[var(--accent-neon-purple)]/20 rounded-full"></div>
                  <div className="absolute w-16 h-16 border-4 border-t-[var(--accent-neon-cyan)] rounded-full animate-spin"></div>
                  <BarChart3 className="w-6 h-6 text-[var(--accent-neon-purple)]" />
                </div>
                <p className="text-sm text-[var(--text-secondary)]">Loading chart data...</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="chart"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="h-80 -mx-4"
            >
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'area' ? (
                  <AreaChart data={history} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <defs>
                      <linearGradient id={`${symbol}-area-gradient`} x1="0" y1="0" x2="0" y2="1">
                        <stop 
                          offset="0%" 
                          stopColor={isPositive ? 'var(--accent-neon-cyan)' : 'var(--error)'} 
                          stopOpacity={0.8}
                        />
                        <stop 
                          offset="95%" 
                          stopColor={isPositive ? 'var(--accent-neon-cyan)' : 'var(--error)'} 
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient id={`${symbol}-line-gradient`} x1="0" y1="0" x2="1" y2="0">
                        <stop 
                          offset="0%" 
                          stopColor={isPositive ? 'var(--accent-neon-purple)' : 'var(--accent-neon-pink)'} 
                          stopOpacity={0.8}
                        />
                        <stop 
                          offset="100%" 
                          stopColor={isPositive ? 'var(--accent-neon-cyan)' : 'var(--error)'} 
                          stopOpacity={1}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="var(--dark-border)" 
                      opacity={0.3}
                    />
                    <XAxis 
                      dataKey="timestamp"
                      stroke="var(--text-tertiary)"
                      fontSize={10}
                      tickFormatter={(value) => {
                        const date = new Date(value * 1000);
                        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      }}
                    />
                    <YAxis 
                      domain={['dataMin - 10', 'dataMax + 10']}
                      stroke="var(--text-tertiary)"
                      fontSize={10}
                      tickFormatter={(value) => `$${value.toFixed(0)}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {latest && (
                      <ReferenceLine 
                        y={latest.avg} 
                        stroke="var(--accent-neon-purple)" 
                        strokeDasharray="5 5" 
                        opacity={0.5}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={`url(#${symbol}-line-gradient)`}
                      strokeWidth={3}
                      fillOpacity={1}
                      fill={`url(#${symbol}-area-gradient)`}
                      dot={<CustomDot />}
                    />
                  </AreaChart>
                ) : (
                  <LineChart data={history} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <defs>
                      <linearGradient id={`${symbol}-line-gradient-2`} x1="0" y1="0" x2="1" y2="0">
                        <stop 
                          offset="0%" 
                          stopColor={isPositive ? 'var(--accent-neon-purple)' : 'var(--accent-neon-pink)'} 
                          stopOpacity={0.8}
                        />
                        <stop 
                          offset="100%" 
                          stopColor={isPositive ? 'var(--accent-neon-cyan)' : 'var(--error)'} 
                          stopOpacity={1}
                        />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="var(--dark-border)" 
                      opacity={0.3}
                    />
                    <XAxis 
                      dataKey="timestamp"
                      stroke="var(--text-tertiary)"
                      fontSize={10}
                      tickFormatter={(value) => {
                        const date = new Date(value * 1000);
                        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      }}
                    />
                    <YAxis 
                      domain={['dataMin - 10', 'dataMax + 10']}
                      stroke="var(--text-tertiary)"
                      fontSize={10}
                      tickFormatter={(value) => `$${value.toFixed(0)}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {latest && (
                      <ReferenceLine 
                        y={latest.avg} 
                        stroke="var(--accent-neon-purple)" 
                        strokeDasharray="5 5" 
                        opacity={0.5}
                        label={{ value: "AVG", fill: "var(--text-tertiary)", fontSize: 10 }}
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke={`url(#${symbol}-line-gradient-2)`}
                      strokeWidth={4}
                      dot={<CustomDot />}
                      filter="url(#glow)"
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Time Range Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-2 mt-6"
        >
          {['1D', '1W', '1M', '3M', '1Y'].map((range, index) => (
            <motion.button
              key={range}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.05 }}
              className="px-4 py-2 glass hover:bg-white/10 rounded-lg text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
            >
              {range}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default StockChart;