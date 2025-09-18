import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Search, 
  Brain, 
  MessageSquare, 
  FileText, 
  BarChart3,
  Sparkles,
  ArrowRight,
  Plus
} from 'lucide-react';

// Empty Portfolio State
export const EmptyPortfolio = ({ isDark, onAddStocks }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`text-center py-16 px-8 rounded-2xl ${
        isDark ? 'bg-gray-800/30' : 'bg-gradient-to-br from-indigo-50/50 to-purple-50/50'
      }`}
    >
      <motion.div
        animate={{ 
          y: [0, -10, 0],
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="inline-flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600"
      >
        <TrendingUp className="w-12 h-12 text-white" />
      </motion.div>
      
      <h3 className={`text-2xl font-bold mb-3 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
        Start Your Investment Journey
      </h3>
      <p className={`text-base mb-8 max-w-md mx-auto leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        Add stocks to your portfolio to track real-time prices, get AI-powered predictions, and make smarter investment decisions.
      </p>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onAddStocks}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
      >
        <Plus className="w-5 h-5" />
        Add Your First Stock
        <ArrowRight className="w-4 h-4" />
      </motion.button>
      
      <div className="mt-12 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
        <div className="text-center">
          <div className={`w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center ${
            isDark ? 'bg-gray-700' : 'bg-indigo-100'
          }`}>
            <BarChart3 className={`w-6 h-6 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
          </div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Live Data</p>
        </div>
        <div className="text-center">
          <div className={`w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center ${
            isDark ? 'bg-gray-700' : 'bg-purple-100'
          }`}>
            <Brain className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>AI Analysis</p>
        </div>
        <div className="text-center">
          <div className={`w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center ${
            isDark ? 'bg-gray-700' : 'bg-green-100'
          }`}>
            <TrendingUp className={`w-6 h-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
          </div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Smart Insights</p>
        </div>
      </div>
    </motion.div>
  );
};

// Empty Search Results
export const EmptySearchResults = ({ isDark, searchQuery }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`text-center py-12 px-6 rounded-xl ${
        isDark ? 'bg-gray-800/50' : 'bg-gray-50'
      }`}
    >
      <Search className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
      <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        No results found
      </h3>
      <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
        {searchQuery ? `No stocks found matching "${searchQuery}"` : 'Try searching for a stock symbol or company name'}
      </p>
    </motion.div>
  );
};

// Empty Analysis History
export const EmptyAnalysisHistory = ({ isDark, onStartAnalysis }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`text-center py-12 px-6 rounded-xl border-2 border-dashed ${
        isDark ? 'border-gray-700 bg-gray-800/30' : 'border-gray-300 bg-gray-50/50'
      }`}
    >
      <Brain className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
      <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        No Analysis Yet
      </h3>
      <p className={`text-sm mb-6 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
        Run your first multi-agent analysis to see AI-powered predictions here
      </p>
      <button
        onClick={onStartAnalysis}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          isDark 
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
      >
        <Sparkles className="w-4 h-4" />
        Start Analysis
      </button>
    </motion.div>
  );
};

// Empty Chat State
export const EmptyChatState = ({ isDark }) => {
  const suggestions = [
    "What's the outlook for Apple stock?",
    "Compare Tesla vs traditional automakers",
    "Explain P/E ratio in simple terms",
    "Best sectors to invest in 2024"
  ];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full py-12"
    >
      <MessageSquare className={`w-16 h-16 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
      <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        Ask Me Anything
      </h3>
      <p className={`text-sm mb-8 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
        I can help with stock analysis, market insights, and investment questions
      </p>
      
      <div className="grid grid-cols-2 gap-3 max-w-lg">
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`text-left p-3 rounded-lg border transition-all ${
              isDark 
                ? 'border-gray-700 hover:border-gray-600 bg-gray-800/50 hover:bg-gray-800' 
                : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
            }`}
          >
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {suggestion}
            </p>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

// Empty Sentiment Analysis
export const EmptySentimentState = ({ isDark }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12"
    >
      <FileText className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
      <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        Analyze Market Sentiment
      </h3>
      <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
        Paste any text or URL to analyze its financial sentiment
      </p>
    </motion.div>
  );
};

// Generic Empty State
export const EmptyState = ({ 
  icon: Icon = FileText, 
  title, 
  description, 
  action, 
  isDark 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12 px-6"
    >
      <Icon className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
      <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        {title}
      </h3>
      <p className={`text-sm mb-6 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
        {description}
      </p>
      {action && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
        >
          {action.icon && <action.icon className="w-4 h-4" />}
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
};