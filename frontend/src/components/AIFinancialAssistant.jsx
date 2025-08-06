import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, Loader2, Sparkles, Brain, MessageSquare, Zap, TrendingUp, DollarSign, BarChart3, Info } from 'lucide-react';
import { sendAIQuery } from '../api/aiAssistant';

const suggestionChips = [
  { icon: TrendingUp, text: "Market trends today", color: "from-blue-500 to-cyan-500" },
  { icon: DollarSign, text: "AAPL price analysis", color: "from-purple-500 to-pink-500" },
  { icon: BarChart3, text: "Compare TSLA vs NVDA", color: "from-green-500 to-emerald-500" },
  { icon: Brain, text: "AI stock predictions", color: "from-amber-500 to-orange-500" },
];

const AIFinancialAssistant = () => {
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
            <span className="text-[var(--accent-neon-cyan)] mt-1">•</span>
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
            className="flex justify-between items-center py-1.5 px-3 my-1 glass rounded-lg"
          >
            <span className="font-medium text-[var(--text-secondary)]">{label}:</span>
            <span className="text-[var(--text-primary)] font-semibold">{value}</span>
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
      {/* Futuristic Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-6 glass-dark rounded-t-2xl border-b border-[var(--dark-border-light)]"
      >
        <div className="flex items-center space-x-4">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-neon-purple)] to-[var(--accent-neon-cyan)] rounded-2xl blur-lg opacity-60"></div>
            <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[var(--accent-neon-purple)] to-[var(--accent-neon-cyan)] rounded-2xl shadow-2xl">
              <Brain className="w-7 h-7 text-white" />
            </div>
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold text-gradient-neon">AI Financial Assistant</h2>
            <div className="text-sm text-[var(--text-tertiary)] flex items-center gap-2">
              Powered by Gemini & MCP
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[var(--accent-neon-green)] animate-pulse"></div>
                <span className="text-xs">Online</span>
              </div>
            </div>
          </div>
        </div>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 px-4 py-2 glass rounded-full"
        >
          <Info className="w-4 h-4 text-[var(--accent-neon-purple)]" />
          <span className="text-xs text-[var(--text-secondary)]">Natural Language AI</span>
        </motion.div>
      </motion.div>

      {/* Messages Area with Futuristic Design */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 glass-dark border-x border-[var(--dark-border-light)] relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(192, 132, 252, 0.3) 0%, transparent 50%),
                              radial-gradient(circle at 80% 80%, rgba(6, 182, 212, 0.3) 0%, transparent 50%)`
          }}></div>
        </div>
        
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
                  className="group relative overflow-hidden glass hover:bg-white/10 rounded-xl p-4 text-left transition-all duration-300 border border-[var(--dark-border)] hover:border-[var(--accent-neon-purple)]/50"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${chip.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                  <div className="relative z-10 flex items-center gap-3">
                    <div className={`p-2.5 bg-gradient-to-br ${chip.color} rounded-lg shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-neon-purple)] transition-colors">
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
                      ? 'bg-gradient-to-br from-[var(--accent-neon-purple)] to-[var(--accent-neon-pink)]' 
                      : 'bg-gradient-to-br from-[var(--accent-neon-cyan)] to-[var(--accent-neon-blue)]'
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
                  whileHover={{ scale: 1.02 }}
                  className={`rounded-2xl px-5 py-4 shadow-xl relative overflow-hidden ${
                    message.type === 'user'
                      ? 'bg-gradient-to-br from-[var(--accent-neon-purple)] to-[var(--accent-neon-pink)] text-white'
                      : 'glass-dark border border-[var(--dark-border-light)] text-[var(--text-primary)]'
                  }`}
                >
                  {/* Message Glow Effect */}
                  {message.type === 'assistant' && (
                    <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent-neon-cyan)] to-[var(--accent-neon-purple)] rounded-2xl opacity-20 blur-lg"></div>
                  )}
                  
                  <div className="relative z-10">
                    <div className="text-sm leading-relaxed">
                      {formatMessage(message.content)}
                    </div>
                    
                    {/* Timestamp */}
                    <div className={`text-xs mt-2 ${
                      message.type === 'user' ? 'text-white/70' : 'text-[var(--text-tertiary)]'
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
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-neon-cyan)] to-[var(--accent-neon-blue)] flex items-center justify-center shadow-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="glass-dark rounded-2xl px-5 py-4 border border-[var(--dark-border-light)]">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, repeatType: "loop" }}
                      className="w-2 h-2 rounded-full bg-[var(--accent-neon-cyan)]"
                    />
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.6, delay: 0.2, repeat: Infinity, repeatType: "loop" }}
                      className="w-2 h-2 rounded-full bg-[var(--accent-neon-purple)]"
                    />
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.6, delay: 0.4, repeat: Infinity, repeatType: "loop" }}
                      className="w-2 h-2 rounded-full bg-[var(--accent-neon-pink)]"
                    />
                  </div>
                  <span className="text-sm text-[var(--text-secondary)]">AI is analyzing your request...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Futuristic Input Area */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 glass-dark rounded-b-2xl border-t border-x border-[var(--dark-border-light)]"
      >
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative group">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about stocks, market analysis, or financial data..."
              className="input-modern pl-6 pr-32 py-4 text-base font-medium bg-[var(--dark-surface)] border-2 border-[var(--dark-border)] focus:border-[var(--accent-neon-purple)] transition-all duration-300"
              disabled={isLoading}
            />
            
            {/* Input Decorations */}
            <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--accent-neon-purple)] opacity-50 group-focus-within:opacity-100 transition-opacity" />
            </div>
            
            {/* Character Count */}
            <div className="absolute right-20 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)]">
              {inputValue.length}/500
            </div>
            
            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span className="font-semibold">Send</span>
            </motion.button>
            
            {/* Input Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--accent-neon-purple)] to-[var(--accent-neon-cyan)] rounded-2xl opacity-0 group-focus-within:opacity-20 blur transition-all duration-300"></div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
              <Zap className="w-3 h-3" />
              <span>Powered by Gemini AI</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-[var(--text-tertiary)]">Press</span>
              <kbd className="px-2 py-1 text-xs font-semibold text-[var(--text-secondary)] bg-[var(--dark-surface)] border border-[var(--dark-border)] rounded">Enter</kbd>
              <span className="text-xs text-[var(--text-tertiary)]">to send</span>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AIFinancialAssistant;