import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, AlertCircle, Activity, Sparkles, BarChart3, 
  Zap, Link, FileText, DollarSign, Clock, Target, AlertTriangle,
  ChartBar, Building2, Calendar, Shield
} from 'lucide-react';
import { analyzeMarketImpact } from '../api/marketImpact';
import { useTheme } from '../contexts/ThemeContext';
import CompanyLogo from './CompanyLogo';

const MarketImpactAnalyzer = () => {
  const { isDark } = useTheme();
  const [inputText, setInputText] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [inputType, setInputType] = useState('text'); // 'text' or 'url'
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    const input = inputType === 'text' ? inputText.trim() : inputUrl.trim();
    if (!input) {
      setError(`Please enter ${inputType === 'text' ? 'some text' : 'a URL'} to analyze`);
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const payload = inputType === 'text' 
        ? { text: input }
        : { url: input };
      
      const analysis = await analyzeMarketImpact(payload);
      setResult(analysis);
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Error analyzing market impact. Please try again.');
      }
      setResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getImpactColor = (impact) => {
    if (!impact) return 'gray';
    if (impact.includes('Strong Positive')) return 'emerald';
    if (impact.includes('Positive')) return 'green';
    if (impact.includes('Strong Negative')) return 'red';
    if (impact.includes('Negative')) return 'orange';
    return 'gray';
  };

  const getRecommendationColor = (recommendation) => {
    if (!recommendation) return 'gray';
    if (recommendation.includes('Strong Buy')) return 'emerald';
    if (recommendation.includes('Buy')) return 'green';
    if (recommendation.includes('Strong Sell')) return 'red';
    if (recommendation.includes('Sell')) return 'orange';
    return 'blue';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className={`text-4xl font-bold mb-4 bg-gradient-to-r ${
          isDark 
            ? 'from-blue-400 to-purple-400' 
            : 'from-blue-600 to-purple-600'
        } bg-clip-text text-transparent`}>
          AI Market Impact Analyzer
        </h1>
        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Predict how news will affect stock prices using advanced AI
        </p>
      </motion.div>

      {/* Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}
      >
        <div className="space-y-4">
          {/* Input Type Toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <button
              onClick={() => setInputType('text')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                inputType === 'text'
                  ? isDark
                    ? 'bg-gray-800 text-white shadow-md'
                    : 'bg-white text-gray-900 shadow-md'
                  : isDark
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="font-medium">Text</span>
            </button>
            <button
              onClick={() => setInputType('url')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                inputType === 'url'
                  ? isDark
                    ? 'bg-gray-800 text-white shadow-md'
                    : 'bg-white text-gray-900 shadow-md'
                  : isDark
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Link className="w-4 h-4" />
              <span className="font-medium">URL</span>
            </button>
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {inputType === 'text' ? 'Enter financial news or market update' : 'Enter news article URL'}
            </label>
            {inputType === 'text' ? (
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Example: Apple announced record Q4 earnings with revenue of $90 billion, beating analyst expectations..."
                className={`w-full p-4 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 font-medium resize-none ${
                  isDark
                    ? 'bg-gradient-to-r from-gray-700 to-gray-800 border-2 border-gray-600 text-gray-100 placeholder-gray-400'
                    : 'bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
                rows="6"
              />
            ) : (
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://example.com/news-article"
                className={`w-full p-4 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 font-medium ${
                  isDark
                    ? 'bg-gradient-to-r from-gray-700 to-gray-800 border-2 border-gray-600 text-gray-100 placeholder-gray-400'
                    : 'bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
              />
            )}
            <div className="flex items-center justify-between mt-2">
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {inputType === 'text' 
                  ? `${inputText.length} characters`
                  : inputUrl ? 'Valid URL format' : 'Enter a URL'
                }
              </span>
              <div className={`flex items-center gap-2 text-xs ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <Sparkles className="w-3 h-3 text-purple-500" />
                <span className="font-medium">Powered by AI</span>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAnalyze}
            disabled={isAnalyzing || (inputType === 'text' ? !inputText.trim() : !inputUrl.trim())}
            className="btn-modern w-full py-4 px-6 gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg"
          >
            {isAnalyzing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Zap className="w-5 h-5" />
                </motion.div>
                <span>Analyzing Market Impact...</span>
              </>
            ) : (
              <>
                <ChartBar className="w-5 h-5" />
                <span>Analyze Market Impact</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Results Section */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Summary Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${
                  isDark ? 'bg-blue-900/30' : 'bg-blue-50'
                }`}>
                  <FileText className={`w-5 h-5 ${
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                <h3 className={`text-xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Article Summary
                </h3>
              </div>
              <p className={`leading-relaxed ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {result.summary}
              </p>
              <div className="flex items-center gap-4 mt-4 text-sm">
                <span className={`flex items-center gap-1 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <Calendar className="w-4 h-4" />
                  {result.event_type}
                </span>
                <span className={`flex items-center gap-1 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <Clock className="w-4 h-4" />
                  {result.impact_timeline}
                </span>
              </div>
            </motion.div>

            {/* Key Points */}
            {result.key_points && result.key_points.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}
              >
                <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  <Target className="w-5 h-5" />
                  Key Points
                </h3>
                <ul className="space-y-3">
                  {result.key_points.map((point, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className="flex items-start gap-3"
                    >
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        isDark ? 'bg-blue-400' : 'bg-blue-600'
                      }`} />
                      <span className={`${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {point}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Affected Stocks */}
            {result.affected_stocks && result.affected_stocks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}
              >
                <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  <TrendingUp className="w-5 h-5" />
                  Stock Impact Predictions
                </h3>
                <div className="space-y-4">
                  {result.affected_stocks.map((stock, index) => (
                    <motion.div
                      key={stock.ticker}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className={`rounded-xl border p-5 ${
                        isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      {/* Stock Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <CompanyLogo symbol={stock.ticker} size="md" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className={`font-bold text-lg ${
                                isDark ? 'text-white' : 'text-gray-900'
                              }`}>
                                {stock.ticker}
                              </h4>
                              {stock.current_price > 0 && (
                                <span className={`text-sm ${
                                  isDark ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  ${stock.current_price.toFixed(2)}
                                </span>
                              )}
                            </div>
                            <p className={`text-sm ${
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {stock.company_name}
                            </p>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-full text-sm font-semibold bg-${getRecommendationColor(stock.recommendation)}-100 text-${getRecommendationColor(stock.recommendation)}-700 dark:bg-${getRecommendationColor(stock.recommendation)}-900/30 dark:text-${getRecommendationColor(stock.recommendation)}-400`}>
                          {stock.recommendation}
                        </div>
                      </div>

                      {/* Impact Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className={`text-xs font-semibold mb-1 ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Predicted Impact
                          </p>
                          <div className={`flex items-center gap-1 font-semibold text-${getImpactColor(stock.predicted_impact)}-600 dark:text-${getImpactColor(stock.predicted_impact)}-400`}>
                            {stock.predicted_impact.includes('Positive') ? 
                              <TrendingUp className="w-4 h-4" /> : 
                              stock.predicted_impact.includes('Negative') ?
                              <TrendingDown className="w-4 h-4" /> :
                              <Activity className="w-4 h-4" />
                            }
                            {stock.predicted_impact}
                          </div>
                        </div>
                        <div>
                          <p className={`text-xs font-semibold mb-1 ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Price Change
                          </p>
                          <p className={`font-semibold ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>
                            {stock.impact_percentage}
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs font-semibold mb-1 ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Confidence
                          </p>
                          <div className="flex items-center gap-2">
                            <div className={`w-full h-2 rounded-full overflow-hidden ${
                              isDark ? 'bg-gray-600' : 'bg-gray-200'
                            }`}>
                              <div
                                className={`h-full bg-gradient-to-r from-blue-500 to-purple-600`}
                                style={{ width: `${stock.confidence * 100}%` }}
                              />
                            </div>
                            <span className={`text-sm font-medium ${
                              isDark ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {(stock.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className={`text-xs font-semibold mb-1 ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Timeframe
                          </p>
                          <p className={`text-sm ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {stock.timeframe}
                          </p>
                        </div>
                      </div>

                      {/* Reasons */}
                      {stock.reasons && stock.reasons.length > 0 && (
                        <div className={`mt-4 pt-4 border-t ${
                          isDark ? 'border-gray-600' : 'border-gray-200'
                        }`}>
                          <p className={`text-xs font-semibold mb-2 ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Analysis Reasons
                          </p>
                          <ul className="space-y-1">
                            {stock.reasons.map((reason, idx) => (
                              <li key={idx} className={`text-sm flex items-start gap-2 ${
                                isDark ? 'text-gray-300' : 'text-gray-600'
                              }`}>
                                <Shield className="w-3 h-3 mt-0.5 text-blue-500" />
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Sector Impacts */}
            {result.sector_impacts && Object.keys(result.sector_impacts).length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}
              >
                <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  <Building2 className="w-5 h-5" />
                  Sector Impacts
                </h3>
                <div className="grid gap-3">
                  {Object.entries(result.sector_impacts).map(([sector, impact], index) => (
                    <motion.div
                      key={sector}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.05 }}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        isDark ? 'bg-gray-700/50' : 'bg-gray-50'
                      }`}
                    >
                      <span className={`font-medium ${
                        isDark ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        {sector}
                      </span>
                      <span className={`text-sm ${
                        impact.includes('Positive') 
                          ? isDark ? 'text-green-400' : 'text-green-600'
                          : impact.includes('Negative')
                          ? isDark ? 'text-red-400' : 'text-red-600'
                          : isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {impact}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Market Sentiment Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="flex justify-center"
            >
              <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full ${
                result.market_sentiment === 'Bullish'
                  ? isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                  : result.market_sentiment === 'Bearish'
                  ? isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
                  : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
              }`}>
                <BarChart3 className="w-5 h-5" />
                <span className="font-semibold">Overall Market Sentiment: {result.market_sentiment}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`rounded-2xl p-6 border ${
              isDark
                ? 'bg-red-900/20 border-red-800/50'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-lg ${
                isDark ? 'bg-red-900/30' : 'bg-red-100'
              }`}>
                <AlertCircle className={`w-5 h-5 ${
                  isDark ? 'text-red-400' : 'text-red-600'
                }`} />
              </div>
              <div>
                <h4 className={`font-bold mb-1 ${
                  isDark ? 'text-red-300' : 'text-red-900'
                }`}>Analysis Error</h4>
                <p className={`text-sm ${
                  isDark ? 'text-red-400' : 'text-red-700'
                }`}>{error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MarketImpactAnalyzer;