import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, TrendingUp, X, RefreshCw, Copy, Download, 
  FileText, Clock, BarChart3, Shield, Target, MessageSquare,
  AlertCircle, ChevronRight, Activity, DollarSign, Brain,
  MoreVertical, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { fetchLiveFollowedMarketData } from '../api/liveMarket';
import { searchStocks } from '../api/stock';
import CompanyLogo from './CompanyLogo';
import axios from 'axios';

// Section configuration with gradient colors
const SECTIONS = [
  { 
    key: 'overview', 
    title: 'Overview', 
    icon: FileText, 
    color: 'indigo',
    gradient: 'from-indigo-500 to-indigo-600',
    lightGradient: 'from-indigo-50 to-indigo-100'
  },
  { 
    key: 'market_analysis', 
    title: 'Market Analysis', 
    icon: Activity, 
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600',
    lightGradient: 'from-blue-50 to-blue-100'
  },
  { 
    key: 'fundamental_analysis', 
    title: 'Fundamentals', 
    icon: DollarSign, 
    color: 'emerald',
    gradient: 'from-emerald-500 to-emerald-600',
    lightGradient: 'from-emerald-50 to-emerald-100'
  },
  { 
    key: 'sentiment_snapshot', 
    title: 'Sentiment', 
    icon: MessageSquare, 
    color: 'purple',
    gradient: 'from-purple-500 to-purple-600',
    lightGradient: 'from-purple-50 to-purple-100'
  },
  { 
    key: 'risk_assessment', 
    title: 'Risk Factors', 
    icon: Shield, 
    color: 'red',
    gradient: 'from-red-500 to-red-600',
    lightGradient: 'from-red-50 to-red-100'
  },
  { 
    key: 'strategy_note', 
    title: 'Strategy Note', 
    icon: Target, 
    color: 'amber',
    gradient: 'from-amber-500 to-amber-600',
    lightGradient: 'from-amber-50 to-amber-100'
  }
];

// Enhanced skeleton loader
const SectionSkeleton = ({ isDark }) => (
  <div className="space-y-5">
    {SECTIONS.map((section, idx) => (
      <motion.div 
        key={section.key} 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: idx * 0.1 }}
        className="animate-pulse"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
          <div className={`h-5 w-32 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
        </div>
        <div className="space-y-2 ml-13">
          <div className={`h-4 w-full rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
          {(section.key === 'overview' || section.key === 'fundamental_analysis') && (
            <>
              <div className={`h-4 w-5/6 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
              <div className={`h-4 w-4/6 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
            </>
          )}
          {(section.key === 'risk_assessment' || section.key === 'strategy_note' || section.key === 'market_analysis') && (
            <>
              <div className={`h-4 w-5/6 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
              <div className={`h-4 w-4/6 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
            </>
          )}
        </div>
      </motion.div>
    ))}
  </div>
);

// Enhanced key levels chips with icons
const KeyLevelChip = ({ label, value, isDark }) => {
  const isSupport = label.toLowerCase().includes('support');
  const isResistance = label.toLowerCase().includes('resistance');
  const Icon = isSupport ? ArrowDownRight : isResistance ? ArrowUpRight : Minus;
  const color = isSupport ? 'green' : isResistance ? 'red' : 'blue';
  
  return (
    <motion.span 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
        ${isDark 
          ? `bg-${color}-900/20 text-${color}-400 border border-${color}-800/30` 
          : `bg-${color}-50 text-${color}-700 border border-${color}-200`
        }`}
    >
      <Icon className="w-3 h-3" />
      <span className="font-semibold">{label}:</span>
      <span className="font-mono">{typeof value === 'number' ? value.toFixed(2) : value}</span>
    </motion.span>
  );
};

// Enhanced section renderer with better typography
const ReportSection = ({ section, content, keyLevels, isDark, index }) => {
  const Icon = section.icon;
  
  const renderContent = () => {
    if (!content) {
      return (
        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'} italic`}>
          Data not currently available
        </p>
      );
    }

    // Market Analysis - Technical bullets with enhanced styling
    if (section.key === 'market_analysis' && Array.isArray(content)) {
      return (
        <div className="space-y-2">
          {content.map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-start gap-3 group`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                ${isDark 
                  ? 'bg-blue-900/30 group-hover:bg-blue-900/50' 
                  : 'bg-blue-100 group-hover:bg-blue-200'
                } transition-colors`}
              >
                <ChevronRight className={`w-3.5 h-3.5 ${
                  isDark ? 'text-blue-400' : 'text-blue-600'
                }`} />
              </div>
              <span className={`text-sm leading-relaxed ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {highlightNumbers(item, isDark)}
              </span>
            </motion.div>
          ))}
        </div>
      );
    }

    // Risk Assessment & Strategy - Styled bullets
    if ((section.key === 'risk_assessment' || section.key === 'strategy_note') && Array.isArray(content)) {
      return (
        <div className="space-y-2">
          {content.map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-3"
            >
              <span className={`text-lg leading-none mt-0.5 
                ${section.key === 'risk_assessment' 
                  ? 'text-red-500' 
                  : 'text-amber-500'
                }`}>
                •
              </span>
              <span className={`text-sm leading-relaxed flex-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {highlightNumbers(item, isDark)}
              </span>
            </motion.div>
          ))}
        </div>
      );
    }

    // Overview - Enhanced with better spacing and key levels
    if (section.key === 'overview') {
      return (
        <div className="space-y-3">
          <p className={`text-sm leading-relaxed ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {highlightNumbers(content, isDark)}
          </p>
          {keyLevels && Object.keys(keyLevels).length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap gap-2 pt-2"
            >
              {Object.entries(keyLevels).slice(0, 4).map(([label, value]) => (
                <KeyLevelChip key={label} label={label} value={value} isDark={isDark} />
              ))}
            </motion.div>
          )}
        </div>
      );
    }

    // Default paragraph with enhanced typography
    return (
      <p className={`text-sm leading-relaxed ${
        isDark ? 'text-gray-300' : 'text-gray-700'
      }`}>
        {highlightNumbers(content, isDark)}
      </p>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative group"
    >
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${
          isDark ? section.gradient : section.lightGradient
        } shadow-sm group-hover:shadow-md transition-all`}>
          <Icon className={`w-5 h-5 ${
            isDark ? 'text-white' : `text-${section.color}-600`
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-base font-semibold mb-2 ${
            isDark ? 'text-gray-100' : 'text-gray-900'
          }`}>
            {section.title}
          </h3>
          {renderContent()}
        </div>
      </div>
    </motion.div>
  );
};

// Helper to highlight numbers in text
const highlightNumbers = (text, isDark) => {
  if (!text) return text;
  
  // Pattern to match numbers with optional $ and %
  const pattern = /(\$?\d+\.?\d*%?|\d+\.?\d*x|\d+bps|\d+-DMA|Q\d+|H\d+|FY\d+)/g;
  
  const parts = text.split(pattern);
  
  return parts.map((part, i) => {
    if (part.match(pattern)) {
      return (
        <span key={i} className={`font-semibold ${
          isDark ? 'text-blue-400' : 'text-blue-600'
        }`}>
          {part}
        </span>
      );
    }
    return part;
  });
};

// Progress Tracker Component
const ProgressTracker = ({ progress, isDark }) => {
  const percentage = Math.round(progress * 100);
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mb-4"
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Analyzing {SECTIONS.length} sections
        </span>
        <span className={`text-xs font-bold ${
          isDark ? 'text-indigo-400' : 'text-indigo-600'
        }`}>
          {percentage}%
        </span>
      </div>
      
      <div className={`h-2 rounded-full overflow-hidden ${
        isDark ? 'bg-gray-700' : 'bg-gray-200'
      }`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`h-full rounded-full bg-gradient-to-r ${
            percentage < 30 
              ? 'from-red-500 to-orange-500' 
              : percentage < 60 
                ? 'from-orange-500 to-yellow-500'
                : percentage < 90
                  ? 'from-yellow-500 to-green-500'
                  : 'from-green-500 to-emerald-500'
          }`}
        />
      </div>
      
      <div className="mt-3 grid grid-cols-3 gap-2">
        {SECTIONS.map((section, idx) => {
          const isComplete = idx < Math.floor(progress * SECTIONS.length);
          const isCurrent = idx === Math.floor(progress * SECTIONS.length);
          
          return (
            <motion.div
              key={section.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`flex items-center gap-1.5 text-xs ${
                isComplete 
                  ? isDark ? 'text-green-400' : 'text-green-600'
                  : isCurrent
                    ? isDark ? 'text-yellow-400' : 'text-yellow-600'
                    : isDark ? 'text-gray-600' : 'text-gray-400'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${
                isComplete 
                  ? 'bg-current' 
                  : isCurrent
                    ? 'bg-current animate-pulse'
                    : isDark ? 'bg-gray-700' : 'bg-gray-300'
              }`} />
              <span className={`truncate ${isComplete || isCurrent ? 'font-medium' : ''}`}>
                {section.title}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

// Enhanced ticker report card
const TickerReportCard = ({ ticker, report, isLoading, onRerun, onCopy, onExport, isDark, analysisProgress = 0 }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatReportText = () => {
    if (!report?.prediction?.sections) return '';
    
    const sections = report.prediction.sections;
    const meta = report.prediction.meta;
    
    let text = `${ticker} Equity Analysis\n`;
    text += `Generated: ${new Date(meta.generated_at).toLocaleString()}\n\n`;
    
    // Overview
    text += `OVERVIEW\n${'='.repeat(40)}\n${sections.overview}\n\n`;
    
    // Market Analysis
    text += `MARKET ANALYSIS\n${'='.repeat(40)}\n`;
    if (Array.isArray(sections.market_analysis)) {
      sections.market_analysis.forEach(item => text += `• ${item}\n`);
    } else {
      text += `${sections.market_analysis}\n`;
    }
    text += '\n';
    
    // Fundamentals
    text += `FUNDAMENTALS\n${'='.repeat(40)}\n${sections.fundamental_analysis}\n\n`;
    
    // Sentiment
    text += `SENTIMENT\n${'='.repeat(40)}\n${sections.sentiment_snapshot}\n\n`;
    
    // Risks
    text += `RISK FACTORS\n${'='.repeat(40)}\n`;
    sections.risk_assessment.forEach(risk => text += `• ${risk}\n`);
    text += '\n';
    
    // Strategy
    text += `STRATEGY NOTE\n${'='.repeat(40)}\n`;
    sections.strategy_note.forEach(note => text += `• ${note}\n`);
    
    return text;
  };

  const handleCopy = () => {
    const text = formatReportText();
    navigator.clipboard.writeText(text);
    onCopy(ticker);
    setMenuOpen(false);
  };

  const handleExport = () => {
    const text = formatReportText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ticker}_analysis_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onExport(ticker);
    setMenuOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`${isDark 
        ? 'bg-gradient-to-br from-gray-800 to-gray-850 border-gray-700' 
        : 'bg-white border-gray-200'
      } rounded-2xl shadow-lg border overflow-hidden hover:shadow-xl transition-all`}
    >
      {/* Header with gradient accent */}
      <div className={`relative px-6 py-5 border-b ${
        isDark ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <div className={`absolute inset-0 bg-gradient-to-r ${
          isDark 
            ? 'from-indigo-900/20 via-purple-900/20 to-pink-900/20' 
            : 'from-indigo-50 via-purple-50 to-pink-50'
        }`} />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CompanyLogo symbol={ticker} size="lg" />
            <div>
              <h2 className={`text-xl font-bold ${
                isDark ? 'text-gray-100' : 'text-gray-900'
              }`}>
                {ticker}
              </h2>
              {report?.prediction?.meta?.generated_at && (
                <p className={`text-xs flex items-center gap-1.5 mt-1 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <Clock className="w-3 h-3" />
                  <span className="font-medium">
                    {new Date(report.prediction.meta.generated_at).toLocaleString()}
                  </span>
                </p>
              )}
            </div>
          </div>
          
          {!isLoading && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`p-2.5 rounded-xl transition-all ${
                  isDark 
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
                aria-label="More options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className={`absolute right-0 mt-2 w-52 rounded-xl shadow-xl 
                      ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
                      border overflow-hidden z-20`}
                  >
                    <button
                      onClick={() => {
                        onRerun(ticker);
                        setMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 
                        ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span className="font-medium">Rerun Analysis</span>
                    </button>
                    <button
                      onClick={handleCopy}
                      className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 
                        ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}
                    >
                      <Copy className="w-4 h-4" />
                      <span className="font-medium">Copy Report</span>
                    </button>
                    <button
                      onClick={handleExport}
                      className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 
                        ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}
                    >
                      <Download className="w-4 h-4" />
                      <span className="font-medium">Export as Text</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Content with better spacing */}
      <div className="p-6">
        {isLoading ? (
          <>
            <ProgressTracker progress={analysisProgress} isDark={isDark} />
            <SectionSkeleton isDark={isDark} />
          </>
        ) : report?.prediction?.sections ? (
          <div className="space-y-6">
            {SECTIONS.map((section, index) => {
              const content = report.prediction.sections[section.key];
              const keyLevels = section.key === 'overview' ? report.prediction.meta?.key_levels : null;
              
              return (
                <div key={section.key}>
                  <ReportSection
                    section={section}
                    content={content}
                    keyLevels={keyLevels}
                    isDark={isDark}
                    index={index}
                  />
                  {index < SECTIONS.length - 1 && (
                    <div className={`mt-6 border-b ${
                      isDark ? 'border-gray-700/30' : 'border-gray-100'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-base font-medium">Analysis Temporarily Unavailable</p>
            <p className="text-sm mt-1 opacity-75">Please try again in a moment</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Main component with enhanced UI
const MultiAgentPredictorProfessional = () => {
  const { isDark } = useTheme();
  const [availableTickers, setAvailableTickers] = useState([]);
  const [selectedTickers, setSelectedTickers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [reports, setReports] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRunTime, setLastRunTime] = useState(null);
  const [loadingTickers, setLoadingTickers] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({});
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Load available tickers
  useEffect(() => {
    const loadAvailableTickers = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const stocksData = await fetchLiveFollowedMarketData(token);
        const tickers = Object.keys(stocksData || {});
        setAvailableTickers(tickers);
      } catch (error) {
        console.error('Failed to load available tickers:', error);
      }
    };

    loadAvailableTickers();
  }, []);

  // Load persisted selections
  useEffect(() => {
    const saved = localStorage.getItem('multiAgentSelectedTickers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSelectedTickers(parsed.filter(t => availableTickers.includes(t)));
      } catch (e) {
        console.error('Failed to load saved tickers');
      }
    }
  }, [availableTickers]);

  // Save selections
  useEffect(() => {
    if (selectedTickers.length > 0) {
      localStorage.setItem('multiAgentSelectedTickers', JSON.stringify(selectedTickers));
    }
  }, [selectedTickers]);

  // Search stocks
  useEffect(() => {
    const searchStocksDebounced = async () => {
      if (!searchQuery || searchQuery.length < 1) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      const token = localStorage.getItem('token');
      
      try {
        const response = await searchStocks(searchQuery, token);
        if (response.data) {
          setSearchResults(response.data.filter(stock => 
            !selectedTickers.includes(stock.symbol)
          ));
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchStocksDebounced, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedTickers]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTickerToggle = (ticker) => {
    if (selectedTickers.includes(ticker)) {
      setSelectedTickers(prev => prev.filter(t => t !== ticker));
    } else {
      setSelectedTickers(prev => [...prev, ticker]);
    }
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const handleRemoveTicker = (ticker) => {
    setSelectedTickers(prev => prev.filter(t => t !== ticker));
  };

  const handleClearAll = () => {
    setSelectedTickers([]);
    localStorage.removeItem('multiAgentSelectedTickers');
  };

  const runAnalysis = async () => {
    if (selectedTickers.length === 0) return;

    setLoading(true);
    setError(null);
    setReports({});
    setLoadingTickers({});
    setAnalysisProgress({});

    const token = localStorage.getItem('token');
    if (!token) {
      setError("Authentication required");
      setLoading(false);
      return;
    }

    let progressInterval;
    
    try {
      // Only set loading state for tickers we're analyzing
      const tickersToAnalyze = selectedTickers.slice();
      const loadingState = {};
      const progressState = {};
      tickersToAnalyze.forEach(ticker => {
        loadingState[ticker] = true;
        progressState[ticker] = 0;
      });
      setLoadingTickers(loadingState);
      setAnalysisProgress(progressState);
      
      // Simulate progress updates
      progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          const newProgress = {};
          Object.keys(prev).forEach(ticker => {
            if (prev[ticker] < 0.95) {
              newProgress[ticker] = Math.min(prev[ticker] + 0.15, 0.95);
            } else {
              newProgress[ticker] = prev[ticker];
            }
          });
          return newProgress;
        });
      }, 2000);

      // API call
      const response = await axios.get(`http://localhost:8000/news/custom-summary`, {
        params: { tickers: tickersToAnalyze.join(',') },
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 600000
      });
      
      if (response.data && response.data.reports) {
        const tickerList = Object.keys(response.data.reports);
        
        // Update loading states to only include returned tickers
        const actualLoadingState = {};
        tickerList.forEach(ticker => {
          actualLoadingState[ticker] = true;
        });
        setLoadingTickers(actualLoadingState);
        
        // Stream results
        for (let i = 0; i < tickerList.length; i++) {
          const ticker = tickerList[i];
          await new Promise(resolve => setTimeout(resolve, 300));
          
          setReports(prev => ({
            ...prev,
            [ticker]: response.data.reports[ticker]
          }));
          
          setLoadingTickers(prev => ({
            ...prev,
            [ticker]: false
          }));
          
          // Set progress to 100% for completed ticker
          setAnalysisProgress(prev => ({
            ...prev,
            [ticker]: 1
          }));
        }
        
        clearInterval(progressInterval);
        setLastRunTime(new Date());
      } else {
        clearInterval(progressInterval);
        setError("Analysis returned no results");
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError("Analysis temporarily unavailable");
      clearInterval(progressInterval);
    } finally {
      setLoading(false);
      setLoadingTickers({});
      // Keep progress at 100% for completed tickers
    }
  };

  const handleRerun = async (ticker) => {
    setLoadingTickers(prev => ({ ...prev, [ticker]: true }));
    setAnalysisProgress(prev => ({ ...prev, [ticker]: 0 }));
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev[ticker] < 0.95) {
          return { ...prev, [ticker]: Math.min(prev[ticker] + 0.2, 0.95) };
        }
        return prev;
      });
    }, 1500);
    
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`http://localhost:8000/news/custom-summary`, {
        params: { tickers: ticker },
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data?.reports?.[ticker]) {
        setReports(prev => ({
          ...prev,
          [ticker]: response.data.reports[ticker]
        }));
        setAnalysisProgress(prev => ({ ...prev, [ticker]: 1 }));
      }
      clearInterval(progressInterval);
    } catch (err) {
      console.error('Rerun error:', err);
      clearInterval(progressInterval);
    } finally {
      setLoadingTickers(prev => ({ ...prev, [ticker]: false }));
    }
  };

  const handleCopy = (ticker) => {
    // Copy handled in component
  };

  const handleExport = (ticker) => {
    // Export handled in component
  };

  return (
    <div className={`min-h-screen ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950' 
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className={`text-3xl font-bold bg-gradient-to-r ${
            isDark 
              ? 'from-gray-100 to-gray-300' 
              : 'from-gray-900 to-gray-700'
          } bg-clip-text text-transparent`}>
            Equity Analysis
          </h1>
          <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Professional multi-agent research reports powered by AI
          </p>
        </motion.div>

        {/* Analysis Summary */}
        {(lastRunTime || Object.keys(reports).length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${isDark 
              ? 'bg-gray-800/50 border-gray-700 backdrop-blur-sm' 
              : 'bg-white/70 border-gray-200 backdrop-blur-sm'
            } rounded-xl px-5 py-4 border flex items-center justify-between shadow-sm`}
          >
            <div className="flex items-center gap-8">
              <div>
                <p className={`text-xs font-medium ${
                  isDark ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  Reports Generated
                </p>
                <p className={`text-2xl font-bold font-mono mt-1 ${
                  isDark ? 'text-gray-100' : 'text-gray-900'
                }`}>
                  {Object.keys(reports).length}
                </p>
              </div>
              {lastRunTime && (
                <div>
                  <p className={`text-xs font-medium ${
                    isDark ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    Last Analysis
                  </p>
                  <p className={`text-sm font-semibold mt-1 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {lastRunTime.toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Enhanced Selection Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
          } rounded-2xl p-6 border shadow-lg`}
        >
          {/* Multi-Select Dropdown */}
          <div className="mb-5 relative" ref={dropdownRef}>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Select Tickers to Analyze
            </label>
            <div 
              className={`${isDark 
                ? 'bg-gray-900 border-gray-600 hover:border-gray-500' 
                : 'bg-white border-gray-300 hover:border-gray-400'
              } border-2 rounded-xl p-3 cursor-text min-h-[52px] focus-within:ring-2 
                focus-within:ring-indigo-500/30 focus-within:border-indigo-500 transition-all`}
              onClick={() => {
                setIsDropdownOpen(true);
                searchInputRef.current?.focus();
              }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                {selectedTickers.map(ticker => (
                  <motion.div
                    key={ticker}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className={`${isDark 
                      ? 'bg-gradient-to-r from-gray-700 to-gray-600 text-gray-100' 
                      : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800'
                    } px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 shadow-sm`}
                  >
                    <CompanyLogo symbol={ticker} size="sm" />
                    <span className="font-semibold">{ticker}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTicker(ticker);
                      }}
                      className="hover:opacity-70 transition-opacity focus:outline-none ml-1"
                      aria-label={`Remove ${ticker}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
                <div className="flex-1 min-w-[200px] flex items-center gap-2">
                  <Search className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder={selectedTickers.length > 0 ? "Add more tickers..." : "Search and select tickers..."}
                    className={`w-full bg-transparent outline-none text-sm ${
                      isDark ? 'text-gray-100 placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                    }`}
                    aria-label="Search tickers"
                  />
                </div>
              </div>
            </div>

            {/* Enhanced Dropdown */}
            <AnimatePresence>
              {isDropdownOpen && (searchQuery || availableTickers.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute z-30 mt-2 w-full ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  } border-2 rounded-xl shadow-2xl max-h-72 overflow-y-auto`}
                >
                  {isSearching ? (
                    <div className={`p-6 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-sm font-medium">Searching stocks...</p>
                    </div>
                  ) : searchQuery && searchResults.length > 0 ? (
                    <div className="py-2">
                      <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        Search Results
                      </div>
                      {searchResults.map(stock => (
                        <button
                          key={stock.symbol}
                          onClick={() => handleTickerToggle(stock.symbol)}
                          className={`w-full text-left px-4 py-3 text-sm transition-all
                            ${isDark 
                              ? 'hover:bg-gray-700 text-gray-200' 
                              : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          aria-label={`Select ${stock.symbol}`}
                        >
                          <div className="flex items-center gap-3">
                            <CompanyLogo symbol={stock.symbol} size="sm" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold">{stock.symbol}</span>
                                <span className={`text-xs truncate ${
                                  isDark ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  {stock.name}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : !searchQuery && availableTickers.length > 0 ? (
                    <div className="py-2">
                      <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        Your Followed Stocks
                      </div>
                      {availableTickers
                        .filter(ticker => !selectedTickers.includes(ticker))
                        .map(ticker => (
                          <button
                            key={ticker}
                            onClick={() => handleTickerToggle(ticker)}
                            className={`w-full text-left px-4 py-3 text-sm font-medium transition-all
                              ${isDark 
                                ? 'hover:bg-gray-700 text-gray-200' 
                                : 'hover:bg-gray-50 text-gray-700'
                              }`}
                            aria-label={`Select ${ticker}`}
                          >
                            <div className="flex items-center gap-3">
                              <CompanyLogo symbol={ticker} size="sm" />
                              <span className="font-semibold">{ticker}</span>
                            </div>
                          </button>
                        ))}
                    </div>
                  ) : (
                    <div className={`p-6 text-center text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {searchQuery ? 'No matching tickers found' : 'No followed stocks available'}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={runAnalysis}
              disabled={selectedTickers.length === 0 || loading}
              className={`flex-1 px-5 py-3 rounded-xl font-semibold transition-all text-sm
                ${selectedTickers.length === 0 || loading
                  ? isDark 
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                }`}
              aria-label="Run analysis on selected tickers"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Brain className="w-4 h-4 animate-pulse" />
                  Running Analysis...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Brain className="w-4 h-4" />
                  Analyze Selected
                </span>
              )}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClearAll}
              disabled={selectedTickers.length === 0}
              className={`px-5 py-3 rounded-xl font-semibold transition-all text-sm
                ${isDark 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${selectedTickers.length === 0 ? 'opacity-50 cursor-not-allowed' : 'shadow-sm hover:shadow-md'}`}
              aria-label="Clear all selections"
            >
              Clear All
            </motion.button>
          </div>
        </motion.div>

        {/* Enhanced Empty State */}
        {selectedTickers.length === 0 && Object.keys(reports).length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-center py-16 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
          >
            <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${
              isDark 
                ? 'from-gray-700 to-gray-800' 
                : 'from-gray-100 to-gray-200'
            } flex items-center justify-center`}>
              <TrendingUp className="w-10 h-10 opacity-50" />
            </div>
            <p className="text-lg font-semibold mb-2">Select tickers to start analysis</p>
            <p className="text-sm opacity-75">Professional equity research reports on demand</p>
          </motion.div>
        )}

        {/* Enhanced Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${isDark 
              ? 'bg-red-900/20 border-red-800/50 backdrop-blur-sm' 
              : 'bg-red-50 border-red-200'
            } rounded-xl p-5 border-2 flex items-start gap-3`}
          >
            <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              isDark ? 'text-red-400' : 'text-red-600'
            }`} />
            <p className={`${isDark ? 'text-red-300' : 'text-red-700'} text-sm font-medium`}>
              {error}
            </p>
          </motion.div>
        )}

        {/* Analysis Results */}
        <div className="space-y-6">
          <AnimatePresence>
            {selectedTickers.map(ticker => {
              const report = reports[ticker];
              const isLoading = loadingTickers[ticker];

              if (!report && !isLoading) return null;

              return (
                <TickerReportCard
                  key={ticker}
                  ticker={ticker}
                  report={report}
                  isLoading={isLoading}
                  analysisProgress={analysisProgress[ticker] || 0}
                  onRerun={handleRerun}
                  onCopy={handleCopy}
                  onExport={handleExport}
                  isDark={isDark}
                />
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default MultiAgentPredictorProfessional;