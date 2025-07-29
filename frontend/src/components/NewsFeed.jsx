import React, { useEffect, useState } from 'react';
import { getReports, testPredictionEndpoints } from '../api/news';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, AlertTriangle, RefreshCw, Play, CheckCircle, XCircle, Clock, BarChart3, Zap, Target, Shield } from 'lucide-react';

const NewsFeed = () => {
  const [reports, setReports] = useState({});
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [progress, setProgress] = useState(0);
  const [analysisStarted, setAnalysisStarted] = useState(false);

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
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md"
          >
            <div className="backdrop-blur-md bg-white/5 rounded-2xl p-8 border border-white/10 shadow-2xl">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-center mb-8"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-4">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  AI Stock Analysis
                </h2>
                <p className="text-gray-300 mt-2">
                  Multi-agent intelligence powered by Gemini AI
                </p>
              </motion.div>

              <motion.button
                onClick={fetchReports}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Run Analysis
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md"
          >
            <div className="backdrop-blur-md bg-white/5 rounded-2xl p-8 border border-white/10 shadow-2xl">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-6 mx-auto"
              >
                <RefreshCw className="w-8 h-8 text-white" />
              </motion.div>
              
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent text-center mb-4">
                AI Analysis in Progress
              </h2>
              
              <div className="mb-6">
                <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full"
                  />
                </div>
                <p className="text-gray-300 text-sm text-center">{progress}% Complete</p>
              </div>
              
              <p className="text-gray-300 text-center mb-2">
                Our AI agents are analyzing market data, news sentiment, and technical indicators...
              </p>
              <p className="text-gray-400 text-sm text-center">
                This may take 1-2 minutes for comprehensive analysis
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md"
          >
            <div className="backdrop-blur-md bg-white/5 rounded-2xl p-8 border border-white/10 shadow-2xl">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full mb-6 mx-auto">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent text-center mb-4">
                Analysis Error
              </h2>
              
              <p className="text-red-300 text-center mb-6">{error}</p>
              
              <div className="space-y-3">
                <motion.button
                  onClick={retryFetch}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Retry Analysis
                </motion.button>
                
                <motion.button
                  onClick={testEndpoints}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  Test System
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
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
      'success': 'from-green-500 to-emerald-500',
      'fallback': 'from-yellow-500 to-orange-500',
      'error': 'from-red-500 to-pink-500',
      'timeout': 'from-purple-500 to-indigo-500'
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="backdrop-blur-md bg-white/5 rounded-2xl p-8 border border-white/10 shadow-2xl mb-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                AI Stock Intelligence
              </h1>
              <p className="text-gray-300 text-lg">
                Multi-Agent Analysis • Powered by Gemini AI
              </p>
            </div>
          </div>

          {/* Summary */}
          {summary && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="backdrop-blur-md bg-white/5 rounded-2xl p-6 border border-white/10 shadow-2xl mb-8"
            >
              <h3 className="text-xl font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                Analysis Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{summary.total_tickers}</div>
                  <div className="text-gray-300 text-sm">Stocks Analyzed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{summary.success_rate}</div>
                  <div className="text-gray-300 text-sm">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{summary.model}</div>
                  <div className="text-gray-300 text-sm">Model</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{new Date(summary.timestamp).toLocaleDateString()}</div>
                  <div className="text-gray-300 text-sm">Completed</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stock Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="backdrop-blur-md bg-white/5 rounded-2xl p-6 border border-white/10 shadow-2xl mb-8"
          >
            <label htmlFor="ticker-select" className="block text-lg font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
              Select Stock for Detailed Analysis
            </label>
                         <select
               id="ticker-select"
               onChange={handleSelect}
               value={selectedTicker || ''}
               className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
             >
               {Object.keys(reports).map((ticker) => (
                 <option key={ticker} value={ticker} className="bg-gray-800 text-white">
                   {ticker} - {reports[ticker]?.status === 'success' ? '✅' : 
                             reports[ticker]?.status === 'fallback' ? '⚠️' : '❌'}
                 </option>
               ))}
             </select>
          </motion.div>

          {/* Stock Analysis */}
          {selectedTicker && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="backdrop-blur-md bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className={`bg-gradient-to-r ${getStatusColor(reports[selectedTicker]?.status)} p-6 text-center`}>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {selectedTicker} Analysis Report
                </h2>
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium">
                  {(() => {
                    const StatusIcon = getStatusIcon(reports[selectedTicker]?.status);
                    return <StatusIcon className="w-4 h-4" />;
                  })()}
                  Status: {reports[selectedTicker]?.status?.toUpperCase()}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
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
                          className="backdrop-blur-md bg-white/5 rounded-xl p-6 border border-white/10"
                        >
                          <h3 className="text-xl font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4 flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                              <IconComponent className="w-5 h-5 text-white" />
                            </div>
                            {formatAnalysisKey(key)}
                          </h3>
                          <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                          </div>
                        </motion.div>
                      );
                    })}

                    {reports[selectedTicker].prediction?.timestamp && (
                      <div className="text-center text-gray-400 text-sm pt-6 border-t border-white/10">
                        Analysis completed: {new Date(reports[selectedTicker].prediction.timestamp).toLocaleString()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full mb-4">
                      <XCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Analysis Unavailable</h3>
                    <p className="text-gray-300 mb-6">Report for {selectedTicker} could not be generated.</p>
                    {reports[selectedTicker]?.error && (
                      <p className="text-red-300 text-sm mb-6">
                        {reports[selectedTicker].error}
                      </p>
                    )}
                    <motion.button
                      onClick={retryFetch}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Retry Analysis
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default NewsFeed;