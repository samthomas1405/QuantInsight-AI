import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertCircle, Activity, Sparkles, BarChart3, Zap } from 'lucide-react';
import { analyzeSentiment } from '../api/sentiment';
import { useTheme } from '../contexts/ThemeContext';

const SentimentAnalyzer = () => {
  const { isDark } = useTheme();
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const analysis = await analyzeSentiment(inputText);
      setResult(analysis);
    } catch (err) {
      setError('Error analyzing sentiment. Please try again.');
      setResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSentimentIcon = (label) => {
    if (!label) return Activity;
    const labelLower = label.toLowerCase();
    if (labelLower.includes('positive') || labelLower.includes('bullish')) return TrendingUp;
    if (labelLower.includes('negative') || labelLower.includes('bearish')) return TrendingDown;
    return Activity;
  };

  const getSentimentColor = (label) => {
    if (!label) return 'from-gray-500 to-gray-600';
    const labelLower = label.toLowerCase();
    if (labelLower.includes('positive') || labelLower.includes('bullish')) return 'from-emerald-500 to-green-600';
    if (labelLower.includes('negative') || labelLower.includes('bearish')) return 'from-red-500 to-pink-600';
    return 'from-amber-500 to-orange-600';
  };

  const getScoreBarWidth = (score) => {
    return Math.abs(score) * 100;
  };

  return (
    <div className="space-y-6">

      {/* Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}
      >
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-semibold font-['Space_Grotesk'] mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Enter text for sentiment analysis
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter market news, financial reports, or any text to analyze its sentiment..."
              className={`w-full p-4 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 font-medium font-['Space_Grotesk'] resize-none ${
                isDark
                  ? 'bg-gradient-to-r from-gray-700 to-gray-800 border-2 border-gray-600 text-gray-100 placeholder-gray-400'
                  : 'bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 text-gray-900 placeholder-gray-400'
              }`}
              rows="6"
            />
            <div className="flex items-center justify-between mt-2">
              <span className={`text-xs font-['JetBrains_Mono'] ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {inputText.length} characters
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
            disabled={isAnalyzing || !inputText.trim()}
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
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <BarChart3 className="w-5 h-5" />
                <span>Analyze Sentiment</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Results Section */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}
          >
            <h3 className={`text-xl font-bold font-['Space_Grotesk'] mb-6 flex items-center gap-3 ${
              isDark
                ? 'bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent'
                : 'bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent'
            }`}>
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                <Activity className="w-5 h-5 text-white" />
              </div>
              Analysis Results
            </h3>

            <div className="space-y-6">
              {/* Sentiment Label */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className={`p-6 rounded-xl border ${
                  isDark
                    ? 'bg-gradient-to-r from-gray-700 to-gray-800 border-gray-600'
                    : 'bg-gradient-to-r from-gray-50 to-white border-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium uppercase tracking-wider mb-2 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Sentiment
                    </p>
                    <div className="flex items-center gap-3">
                      <div className={`p-3 bg-gradient-to-br ${getSentimentColor(result.label)} rounded-xl shadow-lg`}>
                        {(() => {
                          const Icon = getSentimentIcon(result.label);
                          return <Icon className="w-6 h-6 text-white" />;
                        })()}
                      </div>
                      <h4 className={`text-2xl font-bold font-['Space_Grotesk'] ${
                        isDark
                          ? 'bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent'
                          : 'bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent'
                      }`}>
                        {result.label}
                      </h4>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Confidence Score */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className={`p-6 rounded-xl border ${
                  isDark
                    ? 'bg-gradient-to-r from-gray-700 to-gray-800 border-gray-600'
                    : 'bg-gradient-to-r from-gray-50 to-white border-gray-100'
                }`}
              >
                <p className={`text-sm font-medium uppercase tracking-wider mb-4 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Confidence Score
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold font-['JetBrains_Mono'] bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {(result.score * 100).toFixed(2)}%
                    </span>
                    <span className={`text-sm font-medium ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {result.score >= 0.8 ? 'Very High' : result.score >= 0.6 ? 'High' : result.score >= 0.4 ? 'Moderate' : 'Low'}
                    </span>
                  </div>
                  <div className={`w-full rounded-full h-4 overflow-hidden ${
                    isDark ? 'bg-gray-600' : 'bg-gray-100'
                  }`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${getScoreBarWidth(result.score)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full bg-gradient-to-r ${getSentimentColor(result.label)} rounded-full shadow-inner`}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Additional Insights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`p-6 rounded-xl ${
                  isDark
                    ? 'bg-gradient-to-br from-indigo-900/20 to-purple-900/20'
                    : 'bg-gradient-to-br from-indigo-50 to-purple-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className={`w-5 h-5 ${
                    isDark ? 'text-indigo-400' : 'text-indigo-600'
                  }`} />
                  <p className={`text-sm font-semibold font-['Space_Grotesk'] ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    AI Insights
                  </p>
                </div>
                <p className={`text-sm leading-relaxed ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {result.label && result.label.toLowerCase().includes('positive') 
                    ? 'The analyzed text shows positive sentiment, which may indicate bullish market conditions or favorable outlook.'
                    : result.label && result.label.toLowerCase().includes('negative')
                    ? 'The analyzed text shows negative sentiment, which may indicate bearish market conditions or cautious outlook.'
                    : 'The analyzed text shows neutral sentiment, suggesting a balanced or uncertain market perspective.'}
                </p>
              </motion.div>
            </div>
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
                <h4 className={`font-bold font-['Space_Grotesk'] mb-1 ${
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

export default SentimentAnalyzer;
