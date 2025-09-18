import React, { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, Sparkles, MessageSquare, Zap, RefreshCw, AlertTriangle, Trash2, Circle } from 'lucide-react';
import { sendAIQuery } from '../api/aiAssistant';
import { useTheme } from '../contexts/ThemeContext';
import Tooltip from './Tooltip';

// Memoized message component for performance
const MessageItem = memo(({ message, isDark, onRetry, formatMessage }) => {
  const isUser = message.type === 'user';
  const isError = message.isError;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[80%] ${isUser ? 'ml-12' : 'mr-12'}`}>
        <div className={`
          ${isUser 
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' 
            : isError
              ? isDark 
                ? 'bg-red-900/20 border border-red-700/50' 
                : 'bg-red-50 border border-red-200'
              : isDark
                ? 'bg-gray-800 border border-gray-700' 
                : 'bg-white border border-gray-200 shadow-sm'
          } 
          rounded-2xl ${isUser ? 'rounded-tr-md' : 'rounded-tl-md'} px-4 py-3
        `}>
          {/* Error header */}
          {isError && (
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-500">Error</span>
            </div>
          )}
          
          {/* Message content */}
          <div className={`text-sm leading-relaxed ${
            isError ? (isDark ? 'text-gray-100' : 'text-gray-900') : ''
          }`}>
            {formatMessage(message.content)}
          </div>
          
          {/* Retry button for errors */}
          {isError && message.retryQuery && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onRetry(message.retryQuery)}
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
              aria-label="Retry message"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </motion.button>
          )}
        </div>
        
        {/* Timestamp */}
        <div className={`text-xs mt-1 ${
          isUser ? 'text-right text-gray-500' : 'text-gray-500'
        }`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  );
});

MessageItem.displayName = 'MessageItem';

const AIFinancialAssistant = () => {
  const { isDark } = useTheme();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: "Hello! I'm your AI Financial Assistant. I can help you with stock analysis, investment insights, and market information. Feel free to ask me anything about stocks, investments, or financial markets.",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape to clear input
      if (e.key === 'Escape' && inputValue) {
        setInputValue('');
        e.preventDefault();
      }
      // Ctrl/Cmd + K to clear chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        clearChat();
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [inputValue]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userQuery = inputValue.trim();
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: userQuery,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      // Prepare conversation history for API (exclude the welcome message)
      const conversationHistory = messages.slice(1).map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));
      
      // Add the current user message to history
      conversationHistory.push({
        role: 'user',
        content: userQuery
      });
      
      const data = await sendAIQuery(userQuery, conversationHistory);
      
      if (data.success) {
        const assistantMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.response || 'Failed to process query');
      }
    } catch (error) {
      console.error('AI Assistant Error:', error);
      
      let errorContent = "I encountered an issue processing your request. ";
      
      if (error.response?.status === 401) {
        errorContent += "Please log in to continue using the AI assistant.";
      } else if (error.response?.status >= 500) {
        errorContent += "There seems to be a server issue. Please try again in a moment.";
      } else if (error.message?.includes('Network Error')) {
        errorContent += "Please check your internet connection and try again.";
      } else {
        errorContent += "Please try rephrasing your question or try again later.";
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: errorContent,
        timestamp: new Date(),
        isError: true,
        retryQuery: userQuery
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (text) => {
    setInputValue(text);
    inputRef.current?.focus();
  };

  const handleRetry = async (query) => {
    setInputValue(query);
    // Simulate form submission
    const fakeEvent = { preventDefault: () => {} };
    await handleSubmit(fakeEvent);
  };

  const clearChat = () => {
    setMessages([{
      id: 1,
      type: 'assistant',
      content: "Chat cleared! I'm ready to help you with your financial questions. What would you like to know?",
      timestamp: new Date()
    }]);
    setError(null);
  };

  const formatMessage = (content) => {
    // Handle bold text within lines
    const formatBoldText = (text) => {
      const parts = text.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, partIndex) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const boldText = part.replace(/\*\*/g, '');
          return (
            <span key={partIndex} className={`font-semibold ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              {boldText}
            </span>
          );
        }
        return part;
      });
    };

    const lines = content.split('\n');
    return lines.map((line, index) => {
      // Handle section headers (lines with ** at start and end, or clean headers ending with :)
      if (line.match(/^\*\*(.*)?\*\*$/) || (line.endsWith(':') && line.length < 50 && !line.includes('-') && !line.match(/^\d+\./))) {
        const headerText = line.replace(/\*\*/g, '').replace(/:$/, '').trim();
        return (
          <motion.div 
            key={index} 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.01 }}
            className={`font-semibold text-base mt-4 mb-2 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}
          >
            {headerText}
          </motion.div>
        );
      }
      
      // Handle numbered sections (1., 2., etc.)
      if (line.match(/^\d+\.\s/)) {
        return (
          <motion.div 
            key={index} 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.01 }}
            className={`text-sm mt-3 mb-1 ${
              isDark ? 'text-cyan-400' : 'text-cyan-600'
            }`}
          >
            {line}
          </motion.div>
        );
      }
      
      // Handle bullet points with better styling (dash, bullet, or asterisk)
      if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
        const bulletText = line.substring(1).trim();
        return (
          <motion.div 
            key={index} 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.01 }}
            className="flex items-start gap-2 py-1.5"
          >
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
              isDark ? 'bg-emerald-400' : 'bg-emerald-500'
            }`} />
            <span className="text-sm leading-relaxed flex-1">{formatBoldText(bulletText)}</span>
          </motion.div>
        );
      }
      
      // Handle code blocks or inline code
      if (line.includes('`')) {
        const parts = line.split(/(`[^`]+`)/g);
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.01 }}
            className="py-1 text-sm"
          >
            {parts.map((part, partIndex) => {
              if (part.startsWith('`') && part.endsWith('`')) {
                const code = part.slice(1, -1);
                return (
                  <code
                    key={partIndex}
                    className={`font-mono text-xs px-2 py-1 rounded-md ${
                      isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {code}
                  </code>
                );
              }
              return formatBoldText(part);
            })}
          </motion.div>
        );
      }
      
      // Handle regular paragraphs with better spacing and bold formatting
      if (line.trim()) {
        // Skip disclaimer-like content
        if (line.toLowerCase().includes('disclaimer') || line.toLowerCase().includes('not financial advice')) {
          return null;
        }
        
        return (
          <motion.div 
            key={index} 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.01 }}
            className="py-1 text-sm leading-relaxed"
          >
            {formatBoldText(line)}
          </motion.div>
        );
      }
      
      // Empty lines for spacing
      if (line.trim() === '') {
        return <div key={index} className="h-2" />;
      }
      
      return null;
    }).filter(Boolean);
  };

  // Group messages by author for better visual grouping
  const groupedMessages = messages.reduce((groups, message, index) => {
    const prevMessage = messages[index - 1];
    if (!prevMessage || prevMessage.type !== message.type) {
      groups.push([message]);
    } else {
      groups[groups.length - 1].push(message);
    }
    return groups;
  }, []);

  return (
    <div className="flex flex-col h-[85vh] max-w-4xl mx-auto">
      {/* Premium Header with glass effect */}
      <div className={`flex items-center justify-between p-4 border-b backdrop-blur-sm ${
        isDark 
          ? 'bg-gray-900/50 border-gray-800' 
          : 'bg-white/50 border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
          </div>
          <div>
            <h3 className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              AI Financial Assistant
            </h3>
            <p className="text-xs text-emerald-600">Online</p>
          </div>
        </div>
        
        {messages.length > 1 && (
          <Tooltip content="Clear chat history" position="bottom">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearChat}
              className={`p-2 rounded-xl transition-colors ${
                isDark 
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-600'
              }`}
              aria-label="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </Tooltip>
        )}
      </div>

      {/* Messages Area with aria-live for accessibility */}
      <div 
        className={`flex-1 overflow-y-auto p-6 ${
          isDark ? 'bg-gray-900/30' : 'bg-gray-50/30'
        }`}
        aria-live="polite"
      >
        <div className="space-y-6">
          <AnimatePresence>
            {groupedMessages.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-2">
                {group.map((message) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    isDark={isDark}
                    onRetry={handleRetry}
                    formatMessage={formatMessage}
                  />
                ))}
              </div>
            ))}
          </AnimatePresence>
        </div>
        
        {/* Refined Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start mt-6"
          >
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl rounded-tl-md ${
              isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'
            }`}>
              <div className="flex gap-1">
                {[0, 0.2, 0.4].map((delay, i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, delay, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-blue-500"
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">Thinking</span>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Premium Input Area with glass effect */}
      <div className={`p-4 border-t backdrop-blur-sm ${
        isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200'
      }`}>
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= 500) {
                setInputValue(value);
              }
            }}
            placeholder="Ask about stocks, investments, or market analysis..."
            className={`w-full pl-4 pr-12 py-3 rounded-2xl border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/25 ${
              isDark
                ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400'
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
            }`}
            disabled={isLoading}
            aria-label="Message input"
          />
          
          {/* Character counter */}
          {inputValue.length > 400 && (
            <div className={`absolute -top-6 right-0 text-xs ${
              inputValue.length > 450 ? 'text-red-500' : 'text-amber-500'
            }`}>
              {inputValue.length}/500
            </div>
          )}
          
          {/* Submit button */}
          <motion.button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            whileHover={{ scale: !inputValue.trim() || isLoading ? 1 : 1.05 }}
            whileTap={{ scale: !inputValue.trim() || isLoading ? 1 : 0.95 }}
            className={`absolute right-2 p-2 rounded-xl transition-all ${
              !inputValue.trim() || isLoading
                ? isDark
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white hover:shadow-lg'
            }`}
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </form>
        
        {/* Helper row */}
        <div className="flex items-center justify-between mt-3 px-1">
          <div className={`flex items-center gap-2 text-xs ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <Sparkles className="w-3 h-3 text-purple-500" />
            <span>Powered by Gemini AI</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className={`px-2 py-0.5 text-xs rounded border ${
              isDark
                ? 'text-gray-400 bg-gray-800 border-gray-700'
                : 'text-gray-500 bg-gray-100 border-gray-200'
            }`}>⌘K</kbd>
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>to clear</span>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default AIFinancialAssistant;