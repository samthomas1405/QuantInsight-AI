import React, { useEffect, useState } from 'react';
import { getReports, testPredictionEndpoints } from '../api/news';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, AlertTriangle, RefreshCw, Play, CheckCircle, XCircle, Clock, BarChart3, Zap, Target, Shield, Sparkles, Activity } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const NewsFeed = () => {
  const [reports, setReports] = useState({});
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [progress, setProgress] = useState(0);
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const { isDark } = useTheme();

  const fetchReports = async () => {
    setAnalysisStarted(true);
    const token = localStorage.getItem('token');

    if (!token) {
        setError("Please log in to view financial reports.");
        setLoading(false);
        return;
    }

    try {
        setLoading(true);
        setProgress(25);

        const res = await getReports(token);
        setProgress(75);

        if (res && res.reports && typeof res.reports === 'object' && Object.keys(res.reports).length > 0) {
        setReports(res.reports);
        const tickers = Object.keys(res.reports);
        if (tickers.length > 0) {
            setSelectedTicker(tickers[0]);
        }
        if (res.summary) {
            setSummary(res.summary);
        }
        setProgress(100);
        } else {
        console.error('Invalid response structure:', res);
        setError("No stock reports available. Make sure you have stocks in your watchlist.");
        }
    } catch (err) {
        console.error('Error fetching reports:', err);
        let errorMessage = "Failed to fetch reports.";
        if (err.status === 'NETWORK_ERROR') {
        errorMessage = "Network error. Try again later.";
        } else if (err.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
        } else if (err.message) {
        errorMessage = err.message;
        }
        setError(errorMessage);
    } finally {
        setLoading(false);
        setProgress(0);
    }
  };

  const handleSelect = (e) => {
    setSelectedTicker(e.target.value);
  };

  const retryFetch = () => {
    setError(null);
    setReports({});
    setSelectedTicker(null);
    window.location.reload(); // Simple retry
  };

  const testEndpoints = async () => {
    const token = localStorage.getItem('token');
    try {
      const results = await testPredictionEndpoints(token);
      console.log('Test Results:', results);
      alert('Test results logged to console');
    } catch (err) {
      console.error('Test failed:', err);
      alert('Test failed - check console');
    }
  };

  if (!analysisStarted) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-8 shadow-sm border`}>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <h2 className={`text-3xl font-bold font-['Space_Grotesk'] tracking-tight ${
                isDark 
                  ? 'bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-clip-text text-transparent'
                  : 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent'
              }`}>
                AI Stock Analysis
              </h2>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mt-3 font-medium`}>
                Multi-agent intelligence powered by <span className={`font-semibold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>Gemini AI</span>
              </p>
            </motion.div>

            <motion.button
              onClick={fetchReports}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-modern w-full py-4 px-6 text-lg gap-3"
            >
              <Play className="w-6 h-6" />
              Run Analysis
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-8 shadow-sm border`}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-6 mx-auto shadow-lg"
            >
              <RefreshCw className="w-10 h-10 text-white" />
            </motion.div>
            
            <h2 className={`text-3xl font-bold font-['Space_Grotesk'] text-center mb-6 tracking-tight ${
              isDark 
                ? 'bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-clip-text text-transparent'
                : 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent'
            }`}>
              AI Analysis in Progress
            </h2>
            
            <div className="mb-6">
              <div className="w-full bg-gray-100 rounded-full h-3 mb-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full shadow-inner"
                />
              </div>
              <p className="text-gray-700 text-sm font-semibold text-center font-['JetBrains_Mono']">{progress}% Complete</p>
            </div>
            
            <p className="text-gray-700 text-center mb-2 font-medium">
              Our AI agents are analyzing market data, news sentiment, and technical indicators...
            </p>
            <p className="text-gray-500 text-sm text-center">
              This may take 1-2 minutes for comprehensive analysis
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className={`${isDark ? 'bg-gray-800 border-red-800/50' : 'bg-white border-red-100'} rounded-2xl p-8 shadow-sm border`}>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl mb-6 mx-auto shadow-lg">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>
            
            <h2 className={`text-3xl font-bold font-['Space_Grotesk'] text-center mb-4 tracking-tight ${
              isDark
                ? 'bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent'
                : 'bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent'
            }`}>
              Analysis Error
            </h2>
            
            <p className={`${isDark ? 'text-red-300' : 'text-red-700'} text-center mb-6 font-medium`}>{error}</p>
            
            <div className="space-y-3">
              <motion.button
                onClick={retryFetch}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-modern w-full py-3 px-6 gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Retry Analysis
              </motion.button>
              
              <motion.button
                onClick={testEndpoints}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold font-['Space_Grotesk'] py-3 px-6 rounded-xl interactive-scale flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Test System
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const formatAnalysisKey = (key) => {
    return key.replace(/_/g, ' ')
             .replace(/\b\w/g, l => l.toUpperCase())
             .replace('Analysis', 'Analysis')
             .replace('Strategy', 'Strategy')
             .replace('Assessment', 'Assessment');
  };

  const getAnalysisIcon = (key) => {
    const icons = {
      'market_analysis': TrendingUp,
      'fundamental_analysis': BarChart3,
      'sentiment_analysis': Brain,
      'risk_assessment': Shield,
      'investment_strategy': Target,
      'comprehensive_analysis': Zap
    };
    return icons[key] || BarChart3;
  };

  const getStatusColor = (status) => {
    const colors = {
      'success': 'from-emerald-500 to-green-600',
      'fallback': 'from-amber-500 to-orange-600',
      'error': 'from-red-500 to-pink-600',
      'timeout': 'from-purple-500 to-indigo-600'
    };
    return colors[status] || 'from-gray-500 to-gray-600';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'success': CheckCircle,
      'fallback': AlertTriangle,
      'error': XCircle,
      'timeout': Clock
    };
    return icons[status] || XCircle;
  };

  return (
    <div className="space-y-6">

      {/* Summary */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}
        >
          <h3 className={`text-2xl font-bold font-['Space_Grotesk'] mb-6 flex items-center gap-3 ${
            isDark
              ? 'bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent'
              : 'bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent'
          }`}>
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            Analysis Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`${isDark ? 'bg-gradient-to-br from-gray-700 to-gray-800' : 'bg-gradient-to-br from-gray-50 to-white'} p-4 rounded-xl border ${isDark ? 'border-gray-600' : 'border-gray-100'}`}>
              <div className={`text-3xl font-bold font-['JetBrains_Mono'] ${
                isDark
                  ? 'bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent'
                  : 'bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent'
              }`}>{summary.total_tickers}</div>
              <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm font-medium mt-1 uppercase tracking-wider`}>Stocks Analyzed</div>
            </div>
            <div className={`${isDark ? 'bg-gradient-to-br from-gray-700 to-gray-800' : 'bg-gradient-to-br from-gray-50 to-white'} p-4 rounded-xl border ${isDark ? 'border-gray-600' : 'border-gray-100'}`}>
              <div className="text-3xl font-bold font-['JetBrains_Mono'] bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">{summary.success_rate}</div>
              <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm font-medium mt-1 uppercase tracking-wider`}>Success Rate</div>
            </div>
            <div className={`${isDark ? 'bg-gradient-to-br from-gray-700 to-gray-800' : 'bg-gradient-to-br from-gray-50 to-white'} p-4 rounded-xl border ${isDark ? 'border-gray-600' : 'border-gray-100'}`}>
              <div className="text-3xl font-bold font-['JetBrains_Mono'] bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{summary.model}</div>
              <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm font-medium mt-1 uppercase tracking-wider`}>Model</div>
            </div>
            <div className={`${isDark ? 'bg-gradient-to-br from-gray-700 to-gray-800' : 'bg-gradient-to-br from-gray-50 to-white'} p-4 rounded-xl border ${isDark ? 'border-gray-600' : 'border-gray-100'}`}>
              <div className={`text-3xl font-bold font-['JetBrains_Mono'] ${
                isDark
                  ? 'bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent'
                  : 'bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent'
              }`}>{new Date(summary.timestamp).toLocaleDateString()}</div>
              <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm font-medium mt-1 uppercase tracking-wider`}>Completed</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stock Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}
      >
        <label htmlFor="ticker-select" className={`block text-xl font-bold font-['Space_Grotesk'] mb-4 ${
          isDark
            ? 'bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent'
            : 'bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent'
        }`}>
          Select Stock for Detailed Analysis
        </label>
        <div className="relative">
          <select
            id="ticker-select"
            onChange={handleSelect}
            value={selectedTicker || ''}
            className={`w-full rounded-xl px-6 py-4 font-semibold font-['Space_Grotesk'] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer ${
              isDark
                ? 'bg-gradient-to-r from-gray-700 to-gray-800 border-2 border-gray-600 text-gray-100'
                : 'bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 text-gray-900'
            }`}
          >
            {Object.keys(reports).map((ticker) => (
              <option key={ticker} value={ticker} className="bg-white text-gray-900 font-medium">
                {ticker} - {reports[ticker]?.status === 'success' ? '✅ Success' : 
                          reports[ticker]?.status === 'fallback' ? '⚠️ Fallback' : '❌ Error'}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </motion.div>

      {/* Stock Analysis */}
      {selectedTicker && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-sm border overflow-hidden`}
        >
          {/* Header */}
          <div className={`bg-gradient-to-r ${getStatusColor(reports[selectedTicker]?.status)} p-8 text-center`}>
            <h2 className="text-3xl font-bold font-['Space_Grotesk'] text-white mb-3 tracking-tight">
              {selectedTicker} Analysis Report
            </h2>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-6 py-3 rounded-full text-white font-semibold">
              {(() => {
                const StatusIcon = getStatusIcon(reports[selectedTicker]?.status);
                return <StatusIcon className="w-5 h-5" />;
              })()}
              <span className="uppercase tracking-wider text-sm">Status: {reports[selectedTicker]?.status}</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {reports[selectedTicker]?.status === 'success' || reports[selectedTicker]?.status === 'fallback' ? (
              <div className="space-y-6">
                {Object.entries(reports[selectedTicker].prediction || {}).map(([key, value]) => {
                  // Skip metadata fields
                  if (['ticker', 'timestamp', 'agents_used', 'analysis_type', 'model'].includes(key)) {
                    return null;
                  }

                  const IconComponent = getAnalysisIcon(key);

                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className={`rounded-xl p-6 border ${
                        isDark
                          ? 'bg-gradient-to-r from-gray-700 to-gray-800 border-gray-600'
                          : 'bg-gradient-to-r from-gray-50 to-white border-gray-100'
                      }`}
                    >
                      <h3 className={`text-2xl font-bold font-['Space_Grotesk'] mb-4 flex items-center gap-3 ${
                        isDark
                          ? 'bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent'
                          : 'bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent'
                      }`}>
                        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md">
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        {formatAnalysisKey(key)}
                      </h3>
                      <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} leading-relaxed whitespace-pre-wrap font-medium`}>
                        {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                      </div>
                    </motion.div>
                  );
                })}

                {reports[selectedTicker].prediction?.timestamp && (
                  <div className={`text-center text-sm font-medium pt-6 border-t ${
                    isDark ? 'text-gray-400 border-gray-600' : 'text-gray-500 border-gray-200'
                  }`}>
                    <span className="font-['JetBrains_Mono']">
                      Analysis completed: {new Date(reports[selectedTicker].prediction.timestamp).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl mb-6 shadow-lg">
                  <XCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className={`text-2xl font-bold font-['Space_Grotesk'] mb-3 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Analysis Unavailable</h3>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mb-6 font-medium`}>Report for <span className={`font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{selectedTicker}</span> could not be generated.</p>
                {reports[selectedTicker]?.error && (
                  <p className={`${isDark ? 'text-red-400' : 'text-red-600'} text-sm mb-6 font-medium`}>
                    {reports[selectedTicker].error}
                  </p>
                )}
                <motion.button
                  onClick={retryFetch}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-modern py-3 px-6 gap-2 mx-auto"
                >
                  <RefreshCw className="w-5 h-5" />
                  Retry Analysis
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default NewsFeed;