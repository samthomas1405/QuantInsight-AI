import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, Sparkles, Brain, MessageSquare, Zap, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { sendAIQuery } from '../api/aiAssistant';
import { useTheme } from '../contexts/ThemeContext';

const suggestionChips = [
  { icon: TrendingUp, text: "Market trends today", color: "from-indigo-500 to-purple-600" },
  { icon: DollarSign, text: "AAPL price analysis", color: "from-cyan-500 to-blue-600" },
  { icon: BarChart3, text: "Compare TSLA vs NVDA", color: "from-emerald-500 to-green-600" },
  { icon: Brain, text: "AI stock predictions", color: "from-amber-500 to-orange-600" },
];

const AIFinancialAssistant = () => {
  const { isDark } = useTheme();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: "Hello! I'm your AI Financial Assistant powered by Gemini. I can understand natural language and help you with any questions about stocks and financial data!\n\nTry asking me anything:\n• \"What's the price of Apple?\"\n• \"Should I buy Tesla stock?\"\n• \"How is the market doing today?\"\n• \"Find me some AI stocks\"\n• \"Compare Apple and Google\"\n• \"What's happening with Microsoft?\"\n\nI'll understand your question and get you the information you need!",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const data = await sendAIQuery(inputValue);
      
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: "I'm sorry, I encountered an error while processing your request. Please try again or check your connection.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (text) => {
    setInputValue(text);
    inputRef.current?.focus();
  };

  const formatMessage = (content) => {
    const lines = content.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('•')) {
        return (
          <motion.div 
            key={index} 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-start space-x-2 py-1"
          >
            <span className={`${isDark ? 'text-indigo-400' : 'text-indigo-600'} mt-1`}>•</span>
            <span>{line.substring(1).trim()}</span>
          </motion.div>
        );
      } else if (line.includes(':') && !line.includes('http')) {
        const [label, value] = line.split(':');
        return (
          <motion.div 
            key={index} 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`flex justify-between items-center py-1.5 px-3 my-1 rounded-lg border ${
              isDark
                ? 'bg-gradient-to-r from-gray-700 to-gray-800 border-gray-600'
                : 'bg-gradient-to-r from-gray-50 to-white border-gray-100'
            }`}
          >
            <span className={`font-medium font-['Space_Grotesk'] ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{label}:</span>
            <span className={`font-semibold font-['JetBrains_Mono'] ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{value}</span>
          </motion.div>
        );
      } else if (line.trim()) {
        return (
          <motion.div 
            key={index} 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className="py-1"
          >
            {line}
          </motion.div>
        );
      }
      return null;
    });
  };

  return (
    <div className="flex flex-col h-[80vh] max-h-[800px]">

      {/* Messages Area with Modern Design */}
      <div className={`flex-1 overflow-y-auto p-6 space-y-4 rounded-t-2xl border relative ${
        isDark
          ? 'bg-gradient-to-b from-gray-800 to-gray-900 border-gray-700'
          : 'bg-gradient-to-b from-gray-50 to-white border-gray-100'
      }`}>
        
        {/* Suggestion Chips */}
        {showSuggestions && messages.length === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-3 mb-6"
          >
            {suggestionChips.map((chip, index) => {
              const Icon = chip.icon;
              return (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSuggestionClick(chip.text)}
                  className={`group relative overflow-hidden hover:shadow-md rounded-xl p-4 text-left transition-all duration-300 border interactive-scale ${
                    isDark
                      ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                      : 'bg-white border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${chip.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                  <div className="relative z-10 flex items-center gap-3">
                    <div className={`p-2.5 bg-gradient-to-br ${chip.color} rounded-lg shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className={`text-sm font-semibold font-['Space_Grotesk'] group-hover:text-indigo-600 transition-colors ${
                      isDark ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {chip.text}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
        
        {/* Messages */}
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, type: "spring" }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} relative z-10`}
            >
              <div className={`flex items-start gap-3 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring" }}
                  className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                    message.type === 'user' 
                      ? 'bg-gradient-to-br from-indigo-600 to-purple-600' 
                      : 'bg-gradient-to-br from-cyan-500 to-blue-600'
                  }`}
                >
                  {message.type === 'user' ? (
                    <MessageSquare className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </motion.div>
                
                {/* Message Bubble */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className={`rounded-2xl px-5 py-4 shadow-sm relative overflow-hidden ${
                    message.type === 'user'
                      ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
                      : isDark
                        ? 'bg-gray-800 border border-gray-700 text-gray-100'
                        : 'bg-white border border-gray-100 text-gray-900'
                  }`}
                >
                  <div className="relative z-10">
                    <div className="text-sm leading-relaxed font-medium">
                      {formatMessage(message.content)}
                    </div>
                    
                    {/* Timestamp */}
                    <div className={`text-xs mt-2 font-['JetBrains_Mono'] ${
                      message.type === 'user' 
                        ? 'text-white/70' 
                        : isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className={`rounded-2xl px-5 py-4 border shadow-sm ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, repeatType: "loop" }}
                      className="w-2 h-2 rounded-full bg-cyan-500"
                    />
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.6, delay: 0.2, repeat: Infinity, repeatType: "loop" }}
                      className="w-2 h-2 rounded-full bg-indigo-600"
                    />
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.6, delay: 0.4, repeat: Infinity, repeatType: "loop" }}
                      className="w-2 h-2 rounded-full bg-purple-600"
                    />
                  </div>
                  <span className={`text-sm font-medium font-['Space_Grotesk'] ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>AI is analyzing your request...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Modern Input Area */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-b-2xl border-t border-x border-b shadow-sm ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}
      >
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative group">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about stocks, market analysis, or financial data..."
              className={`w-full pl-12 pr-32 py-4 text-base font-medium font-['Space_Grotesk'] rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300 ${
                isDark
                  ? 'bg-gradient-to-r from-gray-700 to-gray-800 border-2 border-gray-600 text-gray-100 placeholder-gray-400'
                  : 'bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 text-gray-900'
              }`}
              disabled={isLoading}
            />
            
            {/* Input Decorations */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Sparkles className={`w-5 h-5 opacity-50 group-focus-within:opacity-100 transition-opacity ${
                isDark ? 'text-indigo-400' : 'text-indigo-600'
              }`} />
            </div>
            
            {/* Character Count */}
            <div className={`absolute right-20 top-1/2 -translate-y-1/2 text-xs font-['JetBrains_Mono'] ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {inputValue.length}/500
            </div>
            
            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-modern absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg"
            >
              <Send className="w-4 h-4" />
              <span className="font-semibold font-['Space_Grotesk']">Send</span>
            </motion.button>
            
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center justify-between mt-3">
            <div className={`flex items-center gap-2 text-xs font-medium ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Powered by <span className={`font-semibold ${
                isDark ? 'text-indigo-400' : 'text-indigo-600'
              }`}>Gemini AI</span></span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-xs ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>Press</span>
              <kbd className={`px-2 py-1 text-xs font-semibold font-['JetBrains_Mono'] border rounded ${
                isDark
                  ? 'text-gray-300 bg-gray-700 border-gray-600'
                  : 'text-gray-700 bg-gray-100 border-gray-200'
              }`}>Enter</kbd>
              <span className={`text-xs ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>to send</span>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AIFinancialAssistant;