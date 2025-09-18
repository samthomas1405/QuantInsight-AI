import React, { useEffect, useState, useRef } from 'react';
import { fetchStockHistory, fetchStockQuote } from '../api/liveMarket';
import CompanyLogo from './CompanyLogo';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart3 } from 'lucide-react';
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
  ReferenceLine
} from 'recharts';

const StockChart = ({ symbol }) => {
  const [history, setHistory] = useState([]);
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState('area');
  const isDark = localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    setLoading(true);
    
    Promise.all([
      fetchStockHistory(symbol),
      fetchStockQuote(symbol)
    ])
      .then(([historyData, quoteData]) => {
        if (historyData && historyData.length > 0) {
          const sorted = [...historyData].sort((a, b) => a.timestamp - b.timestamp);
          setHistory(sorted);
          
          const currentPrice = sorted[sorted.length - 1].price;
          const high = Math.max(...sorted.map(d => d.high || d.price));
          const low = Math.min(...sorted.map(d => d.low || d.price));
          
          let previousClose, delta, percent;
          
          if (quoteData && quoteData.previous_close) {
            previousClose = quoteData.previous_close;
            delta = currentPrice - previousClose;
            percent = (delta / previousClose) * 100;
          } else {
            previousClose = sorted[0].price;
            delta = currentPrice - previousClose;
            percent = (delta / previousClose) * 100;
          }
          
          setLatest({
            current: currentPrice,
            delta: delta.toFixed(2),
            percent: percent.toFixed(2),
            high: quoteData?.high || high,
            low: quoteData?.low || low,
            previousClose: previousClose
          });
        }
      })
      .catch(error => {
        console.error('Error fetching stock data:', error);
        setHistory([]);
        setLatest(null);
      })
      .finally(() => setLoading(false));
  }, [symbol]);

  const isPositive = latest && parseFloat(latest.delta) >= 0;

  // Helper function to generate hourly ticks for the chart
  const generateHourlyTicks = (data) => {
    if (!data || data.length === 0) return [];
    
    const startTime = data[0].timestamp;
    const endTime = data[data.length - 1].timestamp;
    
    // Get the start hour (9:30 becomes 10:00)
    const startDate = new Date(startTime * 1000);
    const startHour = startDate.getHours();
    const startMinutes = startDate.getMinutes();
    
    // Start from the next full hour after market open
    let firstTickHour = startMinutes >= 30 ? startHour + 1 : startHour;
    const firstTickTime = new Date(startDate);
    firstTickTime.setHours(firstTickHour, 0, 0, 0);
    
    const ticks = [];
    let currentTick = Math.floor(firstTickTime.getTime() / 1000);
    
    // Generate hourly ticks
    while (currentTick <= endTime) {
      ticks.push(currentTick);
      currentTick += 3600; // Add one hour
    }
    
    // Always include market open (9:30)
    const marketOpenTime = new Date(startDate);
    marketOpenTime.setHours(9, 30, 0, 0);
    const marketOpenTick = Math.floor(marketOpenTime.getTime() / 1000);
    if (marketOpenTick >= startTime && !ticks.includes(marketOpenTick)) {
      ticks.unshift(marketOpenTick);
    }
    
    return ticks;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const price = payload[0].value;
    const time = new Date(label * 1000);

    return (
      <div className={`${isDark ? 'bg-slate-800/95 border-slate-700' : 'bg-white border-gray-200'} backdrop-blur-sm border rounded-lg p-3 shadow-xl`}>
        <p className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
          {time.toLocaleTimeString('en-US', { 
            hour: 'numeric',
            minute: '2-digit',
            hour12: true 
          })}
        </p>
        <p className={`font-semibold text-lg ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
          ${price.toFixed(2)}
        </p>
      </div>
    );
  };

  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded-lg`}></div>
          <div className={`h-8 ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded w-24`}></div>
        </div>
        <div className="flex gap-2">
          <div className={`w-16 h-8 ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded-full`}></div>
          <div className={`w-16 h-8 ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded-full`}></div>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`${isDark ? 'bg-slate-700/50' : 'bg-gray-100'} rounded-lg p-4`}>
            <div className={`h-4 ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded w-16 mb-2`}></div>
            <div className={`h-6 ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded w-20`}></div>
          </div>
        ))}
      </div>
      
      <div className={`h-[400px] ${isDark ? 'bg-slate-700/50' : 'bg-gray-100'} rounded-lg`}></div>
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-[400px] text-center">
      <Activity className={`w-16 h-16 ${isDark ? 'text-slate-600' : 'text-gray-400'} mb-4`} />
      <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'} mb-2`}>No data available</h3>
      <p className={`${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Unable to load chart data for {symbol}</p>
    </div>
  );

  return (
    <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl p-6 shadow-lg border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CompanyLogo 
                symbol={symbol}
                size="md"
                className="rounded-lg"
              />
              <div>
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {symbol}
                </h2>
                {history.length > 0 && (
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {new Date(history[0].timestamp * 1000).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })} • Intraday
                  </p>
                )}
              </div>
            </div>
            
            {/* Chart Type Toggle */}
            <div className={`flex ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded-full p-1`}>
              <button
                onClick={() => setChartType('area')}
                className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                  chartType === 'area'
                    ? `${isPositive ? 'bg-green-600' : 'bg-red-600'} text-white`
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Area
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                  chartType === 'line'
                    ? `${isPositive ? 'bg-green-600' : 'bg-red-600'} text-white`
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Line
              </button>
            </div>
          </div>

          {/* KPIs */}
          {latest && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className={`${isDark ? 'bg-slate-700/50' : 'bg-gray-100'} rounded-lg p-4`}>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Current</span>
                </div>
                <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  ${latest.current.toFixed(2)}
                </p>
              </div>
              
              <div className={`${isDark ? 'bg-slate-700/50' : 'bg-gray-100'} rounded-lg p-4`}>
                <div className="flex items-center gap-2 mb-1">
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Change</span>
                </div>
                <p className={`text-xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive ? '+' : ''}{latest.percent}%
                </p>
              </div>
              
              <div className={`${isDark ? 'bg-slate-700/50' : 'bg-gray-100'} rounded-lg p-4`}>
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>High</span>
                </div>
                <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  ${latest.high.toFixed(2)}
                </p>
              </div>
              
              <div className={`${isDark ? 'bg-slate-700/50' : 'bg-gray-100'} rounded-lg p-4`}>
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Low</span>
                </div>
                <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  ${latest.low.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="h-[400px]">
            {history.length === 0 ? (
              <EmptyState />
            ) : (
              <AnimatePresence mode="wait">
                {chartType === 'area' ? (
                  <motion.div
                    key="area-chart"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={history} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
                        <defs>
                          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} vertical={false} />
                        <XAxis
                          dataKey="timestamp"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                          ticks={generateHourlyTicks(history)}
                          domain={['dataMin', 'dataMax']}
                          type="number"
                          tickFormatter={(value) => {
                            const date = new Date(value * 1000);
                            const hours = date.getHours();
                            const minutes = date.getMinutes();
                            
                            // Show 9:30 for market open, otherwise show hour only
                            if (hours === 9 && minutes === 30) {
                              return '9:30';
                            }
                            
                            // Convert to 12-hour format
                            const hour12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
                            const ampm = hours >= 12 ? 'pm' : 'am';
                            return `${hour12}${ampm}`;
                          }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                          tickFormatter={(value) => `$${value.toFixed(0)}`}
                          domain={['dataMin - 1', 'dataMax + 1']}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: isDark ? '#475569' : '#d1d5db', strokeWidth: 1 }} />
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke={isPositive ? '#10b981' : '#ef4444'}
                          strokeWidth={2}
                          fill="url(#colorGradient)"
                          dot={false}
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </motion.div>
                ) : (
                  <motion.div
                    key="line-chart"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={history} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} vertical={false} />
                        <XAxis
                          dataKey="timestamp"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                          ticks={generateHourlyTicks(history)}
                          domain={['dataMin', 'dataMax']}
                          type="number"
                          tickFormatter={(value) => {
                            const date = new Date(value * 1000);
                            const hours = date.getHours();
                            const minutes = date.getMinutes();
                            
                            // Show 9:30 for market open, otherwise show hour only
                            if (hours === 9 && minutes === 30) {
                              return '9:30';
                            }
                            
                            // Convert to 12-hour format
                            const hour12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
                            const ampm = hours >= 12 ? 'pm' : 'am';
                            return `${hour12}${ampm}`;
                          }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                          tickFormatter={(value) => `$${value.toFixed(0)}`}
                          domain={['dataMin - 1', 'dataMax + 1']}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: isDark ? '#475569' : '#d1d5db', strokeWidth: 1 }} />
                        <Line
                          type="monotone"
                          dataKey="price"
                          stroke={isPositive ? '#10b981' : '#ef4444'}
                          strokeWidth={2.5}
                          dot={false}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StockChart;