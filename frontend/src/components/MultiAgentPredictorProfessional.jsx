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

// Enhanced key levels chips with micro-interactions
const KeyLevelChip = ({ label, value, isDark }) => {
  const isSupport = label.toLowerCase().includes('support');
  const isResistance = label.toLowerCase().includes('resistance');
  const Icon = isSupport ? ArrowDownRight : isResistance ? ArrowUpRight : Minus;
  const color = isSupport ? 'green' : isResistance ? 'red' : 'blue';
  
  // Determine chip colors based on type
  const getChipColors = () => {
    if (isSupport) {
      return isDark 
        ? 'bg-green-900/20 text-green-300 border-green-800/30 hover:bg-green-900/30 hover:border-green-700/40 hover:shadow-green-900/20'
        : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300 hover:shadow-green-200/50';
    }
    if (isResistance) {
      return isDark
        ? 'bg-red-900/20 text-red-300 border-red-800/30 hover:bg-red-900/30 hover:border-red-700/40 hover:shadow-red-900/20'
        : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300 hover:shadow-red-200/50';
    }
    return isDark
      ? 'bg-blue-900/20 text-blue-300 border-blue-800/30 hover:bg-blue-900/30 hover:border-blue-700/40 hover:shadow-blue-900/20'
      : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 hover:shadow-blue-200/50';
  };
  
  return (
    <motion.span 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.15 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all cursor-default shadow-sm hover:shadow ${getChipColors()}`}
    >
      <Icon className="w-3 h-3" />
      <span className="font-semibold">{label}:</span>
      <span className="font-mono">{typeof value === 'number' ? value.toFixed(2) : value}</span>
    </motion.span>
  );
};

// Helper function to get section-specific colors
const getSectionColors = (sectionKey, isDark) => {
  const colorMap = {
    overview: { 
      bullet: isDark ? 'bg-indigo-400' : 'bg-indigo-500',
      accent: isDark ? 'bg-indigo-500' : 'bg-indigo-600',
      bg: isDark ? 'bg-indigo-900/20' : 'bg-indigo-50',
      text: isDark ? 'text-indigo-300' : 'text-indigo-700',
      border: isDark ? 'border-indigo-800/30' : 'border-indigo-200'
    },
    market_analysis: {
      bullet: isDark ? 'bg-blue-400' : 'bg-blue-500',
      accent: isDark ? 'bg-blue-500' : 'bg-blue-600',
      bg: isDark ? 'bg-blue-900/20' : 'bg-blue-50',
      text: isDark ? 'text-blue-300' : 'text-blue-700',
      border: isDark ? 'border-blue-800/30' : 'border-blue-200'
    },
    fundamental_analysis: {
      bullet: isDark ? 'bg-emerald-400' : 'bg-emerald-500',
      accent: isDark ? 'bg-emerald-500' : 'bg-emerald-600',
      bg: isDark ? 'bg-emerald-900/20' : 'bg-emerald-50',
      text: isDark ? 'text-emerald-300' : 'text-emerald-700',
      border: isDark ? 'border-emerald-800/30' : 'border-emerald-200'
    },
    sentiment_snapshot: {
      bullet: isDark ? 'bg-purple-400' : 'bg-purple-500',
      accent: isDark ? 'bg-purple-500' : 'bg-purple-600',
      bg: isDark ? 'bg-purple-900/20' : 'bg-purple-50',
      text: isDark ? 'text-purple-300' : 'text-purple-700',
      border: isDark ? 'border-purple-800/30' : 'border-purple-200'
    },
    risk_assessment: {
      bullet: isDark ? 'bg-red-400' : 'bg-red-500',
      accent: isDark ? 'bg-red-500' : 'bg-red-600',
      bg: isDark ? 'bg-red-900/20' : 'bg-red-50',
      text: isDark ? 'text-red-300' : 'text-red-700',
      border: isDark ? 'border-red-800/30' : 'border-red-200'
    },
    strategy_note: {
      bullet: isDark ? 'bg-amber-400' : 'bg-amber-500',
      accent: isDark ? 'bg-amber-500' : 'bg-amber-600',
      bg: isDark ? 'bg-amber-900/20' : 'bg-amber-50',
      text: isDark ? 'text-amber-300' : 'text-amber-700',
      border: isDark ? 'border-amber-800/30' : 'border-amber-200'
    }
  };
  
  return colorMap[sectionKey] || colorMap.overview;
};

// Enhanced markdown processing with sophisticated formatting
const processMarkdownContent = (content, isDark, sectionKey = null) => {
  if (!content || typeof content !== 'string') {
    return <span className="text-sm italic opacity-60">Content not available</span>;
  }

  const colors = getSectionColors(sectionKey, isDark);
  const lines = content.split('\n');
  const elements = [];
  let currentParagraph = [];
  let inList = false;
  let inBlockquote = false;
  let inTable = false;
  let tableRows = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const paragraphContent = currentParagraph.join(' ').trim();
      if (paragraphContent) {
        elements.push(
          <motion.p
            key={elements.length}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
          >
            {highlightContent(paragraphContent, isDark)}
          </motion.p>
        );
      }
      currentParagraph = [];
    }
  };

  const flushTable = () => {
    if (tableRows.length > 0) {
      elements.push(renderTable(tableRows, isDark, sectionKey));
      tableRows = [];
      inTable = false;
    }
  };

  lines.forEach((line, lineIndex) => {
    const trimmedLine = line.trim();

    // Empty line - flush current paragraph
    if (!trimmedLine && !inList && !inBlockquote && !inTable) {
      flushParagraph();
      return;
    }

    // Headers with **text:**
    if (trimmedLine.match(/^\*\*.*?\*\*:?/)) {
      flushParagraph();
      flushTable();
      const headerMatch = trimmedLine.match(/^\*\*(.*?)\*\*:?\s*(.*)/);
      if (headerMatch) {
        const [, header, rest] = headerMatch;
        elements.push(
          <motion.div
            key={`header-${lineIndex}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="mb-2 mt-4 first:mt-0"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-1 h-5 rounded-full ${colors.accent}`} />
              <h4 className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                {header}
              </h4>
            </div>
            {rest && (
              <p className={`text-sm leading-relaxed ml-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {highlightContent(rest, isDark)}
              </p>
            )}
          </motion.div>
        );
        inList = false;
      }
      return;
    }

    // Block quotes
    if (trimmedLine.startsWith('>')) {
      flushParagraph();
      flushTable();
      const quoteContent = trimmedLine.substring(1).trim();
      elements.push(
        <motion.blockquote
          key={`quote-${lineIndex}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={`px-3 py-2 my-2 border-l-2 rounded-r ${
            isDark 
              ? 'bg-gray-800/40 border-gray-600' 
              : 'bg-gray-50 border-gray-300'
          }`}
        >
          <p className={`text-sm italic ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {highlightContent(quoteContent, isDark)}
          </p>
        </motion.blockquote>
      );
      inBlockquote = true;
      return;
    }

    // Tables (detect pipes)
    if (trimmedLine.includes('|') && trimmedLine.split('|').length >= 3) {
      if (!inTable) {
        flushParagraph();
        inTable = true;
      }
      tableRows.push(trimmedLine);
      return;
    } else if (inTable) {
      flushTable();
    }

    // Bullet points
    if (trimmedLine.startsWith('*') && !trimmedLine.startsWith('**') || trimmedLine.startsWith('•')) {
      if (!inList) {
        flushParagraph();
        inList = true;
        elements.push(<ul key={`list-${lineIndex}`} className="space-y-1 my-2" />);
      }
      
      const bulletContent = trimmedLine.replace(/^[\*•]\s*/, '').trim();
      const listElement = elements[elements.length - 1];
      const newItem = (
        <motion.li
          key={`item-${lineIndex}`}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.18, ease: "easeOut", delay: 0.02 * lineIndex }}
          className="flex items-start gap-2.5"
        >
          <span className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${colors.bullet}`} />
          <span className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {highlightContent(bulletContent, isDark)}
          </span>
        </motion.li>
      );

      // Clone the list and add the new item
      elements[elements.length - 1] = React.cloneElement(listElement, {
        children: [...(listElement.props.children || []), newItem]
      });
      return;
    } else if (inList && !trimmedLine.startsWith('*') && !trimmedLine.startsWith('•')) {
      inList = false;
    }

    // Regular paragraph line
    if (trimmedLine && !inTable) {
      currentParagraph.push(trimmedLine);
    }
  });

  // Flush any remaining content
  flushParagraph();
  flushTable();

  return <div className="space-y-2">{elements}</div>;
};

// Process section-specific content
const processSectionContent = (content, isDark, sectionKey = null) => {
  if (Array.isArray(content)) {
    return (
      <div className="space-y-3">
        {content.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut", delay: 0.05 * index }}
          >
            {processMarkdownContent(item, isDark, sectionKey)}
          </motion.div>
        ))}
      </div>
    );
  }
  return processMarkdownContent(content, isDark, sectionKey);
};

// Enhanced content highlighting
const highlightContent = (text, isDark) => {
  if (!text) return text;

  // Pattern for various numeric formats and code spans
  const patterns = [
    // Numbers with currency, percentages, multipliers
    { regex: /(\$?\d+(?:,\d{3})*(?:\.\d+)?[BMK]?%?|\d+x|\d+bps|\d+-DMA|[QH]\d+'?\d*|FY\d+)/g, type: 'number' },
    // Code spans with backticks
    { regex: /`([^`]+)`/g, type: 'code' },
  ];

  let elements = [text];

  patterns.forEach(({ regex, type }) => {
    elements = elements.flatMap((element) => {
      if (typeof element !== 'string') return element;

      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(element)) !== null) {
        if (match.index > lastIndex) {
          parts.push(element.slice(lastIndex, match.index));
        }

        if (type === 'number') {
          parts.push(
            <span
              key={`${type}-${match.index}`}
              className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium ${
                isDark
                  ? 'bg-blue-900/20 text-blue-300 border border-blue-800/30'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}
            >
              {match[0]}
            </span>
          );
        } else if (type === 'code') {
          parts.push(
            <span
              key={`${type}-${match.index}`}
              className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-mono ${
                isDark
                  ? 'bg-gray-800 text-gray-300 border border-gray-700'
                  : 'bg-gray-100 text-gray-700 border border-gray-300'
              }`}
            >
              {match[1]}
            </span>
          );
        }

        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < element.length) {
        parts.push(element.slice(lastIndex));
      }

      return parts;
    });
  });

  return elements;
};

// Table renderer
const renderTable = (rows, isDark, sectionKey) => {
  const colors = getSectionColors(sectionKey, isDark);
  const parsedRows = rows.map(row => 
    row.split('|').map(cell => cell.trim()).filter(cell => cell)
  );

  if (parsedRows.length === 0) return null;

  const isHeaderSeparator = (row) => 
    row.every(cell => /^[-:\s]+$/.test(cell));

  let headerIndex = parsedRows.findIndex((row, index) => 
    index < parsedRows.length - 1 && isHeaderSeparator(parsedRows[index + 1])
  );

  if (headerIndex === -1) headerIndex = 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="my-3 overflow-x-auto"
    >
      <table className={`w-full text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        <thead>
          <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            {parsedRows[headerIndex].map((cell, i) => (
              <th
                key={i}
                className={`px-3 py-2 text-left font-semibold ${colors.text}`}
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {parsedRows.slice(headerIndex + 2).map((row, i) => (
            <tr
              key={i}
              className={`border-b ${
                isDark ? 'border-gray-800' : 'border-gray-100'
              } ${
                i % 2 === 0 
                  ? isDark ? 'bg-gray-900/20' : 'bg-gray-50/50'
                  : ''
              }`}
            >
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2">
                  {highlightContent(cell, isDark)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
};

// Helper function to get current phase from progress percentage
const getPhaseFromProgress = (progress) => {
  if (progress < 0.05) return 'Initializing...';
  if (progress < 0.25) return 'Gathering market data...';
  if (progress < 0.45) return 'Analyzing technical indicators...';
  if (progress < 0.65) return 'Evaluating fundamentals...';
  if (progress < 0.80) return 'Processing news and sentiment...';
  if (progress < 0.90) return 'Assessing risk factors...';
  if (progress < 0.98) return 'Finalizing strategy synthesis...';
  return progress === 1 ? 'Analysis complete!' : 'Completing analysis...';
};

// Enhanced section renderer with sophisticated styling
const ReportSection = ({ section, content, keyLevels, isDark, index }) => {
  const Icon = section.icon;
  const colors = getSectionColors(section.key, isDark);
  const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  const renderContent = () => {
    if (!content) {
      return (
        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'} italic`}>
          Data not currently available
        </p>
      );
    }

    return (
      <div className={`${
        isDark 
          ? 'bg-gray-900/40 border-gray-700/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]' 
          : 'bg-white/80 border-gray-200 shadow-sm'
      } rounded-xl p-4 border backdrop-blur-sm`}>
        {processSectionContent(content, isDark, section.key)}
        
        {/* Key levels for overview section */}
        {section.key === 'overview' && keyLevels && Object.keys(keyLevels).length > 0 && (
          <motion.div 
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-opacity-20 border-indigo-500/30"
          >
            {Object.entries(keyLevels).slice(0, 4).map(([label, value]) => (
              <KeyLevelChip key={label} label={label} value={value} isDark={isDark} />
            ))}
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <motion.div 
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative group"
    >
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${
            isDark ? section.gradient : section.lightGradient
          } shadow-sm group-hover:shadow-lg transition-all duration-300`}>
            <Icon className={`w-5 h-5 ${
              isDark ? 'text-white' : `text-${section.color}-600`
            }`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              {section.title}
            </h3>
            <div className={`mt-1 h-px bg-gradient-to-r ${
              isDark 
                ? 'from-gray-600/50 to-transparent' 
                : 'from-gray-300/70 to-transparent'
            }`} />
          </div>
        </div>
        
        {/* Content */}
        {renderContent()}
      </div>
    </motion.div>
  );
};

// Enhanced Progress Loader with improved animations
const ProgressLoader = ({ progress = 0, isDark, currentPhase = 'Analyzing...' }) => {
  const percentage = Math.round(progress * 100);
  const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  return (
    <motion.div 
      initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center justify-center py-8"
    >
      {/* Circular Progress */}
      <div className="relative w-32 h-32 mb-6">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke={isDark ? '#374151' : '#E5E7EB'}
            strokeWidth="12"
            fill="none"
          />
          <motion.circle
            cx="64"
            cy="64"
            r="56"
            stroke="url(#progressGradient)"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 56}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 56 * (1 - progress) }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Percentage Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span 
            key={percentage}
            initial={shouldReduceMotion ? {} : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-3xl font-bold ${
              isDark ? 'text-gray-100' : 'text-gray-900'
            }`}
          >
            {percentage}%
          </motion.span>
        </div>
      </div>
      
      {/* Status Text */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`text-sm font-medium mb-2 ${
          isDark ? 'text-gray-300' : 'text-gray-700'
        }`}
      >
        Analyzing Market Data
      </motion.p>
      
      {/* Current Section */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`text-xs ${
          isDark ? 'text-gray-500' : 'text-gray-500'
        }`}
      >
        {currentPhase}
      </motion.p>
      
      {/* Linear Progress Bar */}
      <div className={`w-full max-w-xs mt-6 h-1.5 rounded-full overflow-hidden ${
        isDark ? 'bg-gray-700' : 'bg-gray-200'
      }`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
        />
      </div>
    </motion.div>
  );
};

// Progress Tracker Component with refined styling
const ProgressTracker = ({ progress, isDark }) => {
  const percentage = Math.round(progress * 100);
  const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  return (
    <motion.div 
      initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95 }}
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
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
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

// Enhanced ticker report card with sophisticated design
const TickerReportCard = ({ ticker, report, isLoading, onRerun, onCancel, onCopy, onExport, isDark, analysisProgress = 0 }) => {
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
        ? 'bg-gradient-to-br from-gray-800/95 via-gray-900/90 to-gray-800/95 border-gray-700/50 shadow-2xl' 
        : 'bg-gradient-to-br from-white via-gray-50/50 to-white border-gray-200/60 shadow-xl'
      } rounded-2xl border backdrop-blur-sm overflow-hidden hover:shadow-2xl hover:scale-[1.01] transition-all duration-500`}
    >
      {/* Enhanced Header with sophisticated gradient */}
      <div className={`relative px-6 py-6 border-b ${
        isDark ? 'border-gray-700/50' : 'border-gray-100'
      }`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${
          isDark 
            ? 'from-indigo-900/10 via-purple-900/10 via-pink-900/10 to-transparent' 
            : 'from-indigo-50/80 via-purple-50/60 via-pink-50/40 to-transparent'
        }`} />
        {/* Subtle pattern overlay */}
        <div className={`absolute inset-0 opacity-30 ${
          isDark ? 'bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.1),transparent)]' : 'bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.05),transparent)]'
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

      {/* Content with sophisticated spacing and layout */}
      <div className="p-8">
        {(() => {
          if (isLoading) {
            return (
              <div>
                <ProgressLoader 
                  progress={analysisProgress || 0} 
                  isDark={isDark} 
                  currentPhase={getPhaseFromProgress(analysisProgress || 0)}
                />
                <div className="flex justify-center mt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onCancel(ticker)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isDark 
                        ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-800/50' 
                        : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                    }`}
                  >
                    Cancel Analysis
                  </motion.button>
                </div>
              </div>
            );
          } 
          
          // Try different possible data structures
          let sections = null;
          let meta = null;
          
          if (report?.prediction?.sections) {
            sections = report.prediction.sections;
            meta = report.prediction.meta;
          } else if (report?.sections) {
            sections = report.sections;
            meta = report.meta;
          } else if (report?.prediction && typeof report.prediction === 'object') {
            // Backend returns flat prediction object, map to expected sections structure
            sections = {
              overview: report.prediction.market_analysis || 'Analysis data not available',
              market_analysis: [report.prediction.market_analysis || 'Technical analysis not available'],
              fundamental_analysis: report.prediction.fundamental_analysis || 'Fundamental analysis not available',
              sentiment_snapshot: report.prediction.sentiment_analysis || 'Sentiment analysis not available',
              risk_assessment: [report.prediction.risk_assessment || 'Risk assessment not available'],
              strategy_note: [report.prediction.investment_strategy || 'Investment strategy not available']
            };
            meta = {
              generated_at: report.prediction.timestamp,
              key_levels: {}
            };
          } else if (typeof report === 'string') {
            // If it's just a string, treat it as overview
            sections = {
              overview: report,
              market_analysis: [],
              fundamental_analysis: '',
              sentiment_snapshot: '',
              risk_assessment: [],
              strategy_note: []
            };
          }
          
          if (sections) {
            return <div className="space-y-6">
            {SECTIONS.map((section, index) => {
              const content = sections[section.key];
              const keyLevels = section.key === 'overview' ? meta?.key_levels : null;
              
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
                    <div className="mt-8 mb-2 relative">
                      <div className={`h-px bg-gradient-to-r ${
                        isDark 
                          ? 'from-transparent via-gray-600/40 to-transparent' 
                          : 'from-transparent via-gray-300/60 to-transparent'
                      }`} />
                      <div className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${
                        isDark ? 'bg-gray-600' : 'bg-gray-300'
                      }`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>;
          } else {
            return (
              <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-base font-medium">Analysis Temporarily Unavailable</p>
                <p className="text-sm mt-1 opacity-75">Please try again in a moment</p>
              </div>
            );
          }
        })()}
      </div>
    </motion.div>
  );
};

// Main component
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
  const [globalProgress, setGlobalProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('');
  const [completedTickers, setCompletedTickers] = useState(new Set());
  const [analysisControllers, setAnalysisControllers] = useState({}); // Store AbortControllers for cancellation
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

    console.log('Starting analysis for:', selectedTickers);
    setLoading(true);
    setError(null);
    setReports({});
    setLoadingTickers({});
    setAnalysisProgress({});
    setGlobalProgress(0);
    setCurrentPhase('');
    setCompletedTickers(new Set());
    setAnalysisControllers({});

    const token = localStorage.getItem('token');
    if (!token) {
      setError("Authentication required");
      setLoading(false);
      return;
    }

    try {
      // Set loading state for all tickers
      const tickersToAnalyze = selectedTickers.slice();
      const loadingState = {};
      const progressState = {};
      const controllers = {};
      
      tickersToAnalyze.forEach(ticker => {
        loadingState[ticker] = true;
        progressState[ticker] = 0;
        controllers[ticker] = new AbortController(); // Create abort controller for each ticker
      });
      
      console.log('Setting loading states:', loadingState);
      setLoadingTickers(loadingState);
      setAnalysisProgress(progressState);
      setAnalysisControllers(controllers);
      
      // More accurate progress tracking based on API phases
      const analysisPhases = [
        { name: 'Initializing', duration: 2000, progress: 0.05 },
        { name: 'Gathering market data', duration: 8000, progress: 0.25 },
        { name: 'Technical analysis', duration: 12000, progress: 0.45 },
        { name: 'Fundamental analysis', duration: 12000, progress: 0.65 },
        { name: 'Sentiment analysis', duration: 8000, progress: 0.80 },
        { name: 'Risk assessment', duration: 6000, progress: 0.90 },
        { name: 'Strategy synthesis', duration: 7000, progress: 0.98 }
      ];
      
      const totalEstimatedTime = analysisPhases.reduce((sum, phase) => sum + phase.duration, 0);
      const startTime = Date.now();
      let currentPhaseIndex = 0;
      let phaseStartTime = startTime;
      
      // More realistic progress simulation
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const currentPhase = analysisPhases[currentPhaseIndex];
        
        if (!currentPhase) {
          clearInterval(progressInterval);
          return;
        }
        
        const phaseElapsed = Date.now() - phaseStartTime;
        const phaseProgress = Math.min(phaseElapsed / currentPhase.duration, 1);
        
        // Calculate current progress based on completed phases + current phase progress
        let totalProgress = 0;
        for (let i = 0; i < currentPhaseIndex; i++) {
          totalProgress += (analysisPhases[i].progress - (i > 0 ? analysisPhases[i - 1].progress : 0));
        }
        
        const currentPhaseWeight = currentPhase.progress - (currentPhaseIndex > 0 ? analysisPhases[currentPhaseIndex - 1].progress : 0);
        totalProgress += currentPhaseWeight * phaseProgress;
        
        // Move to next phase when current phase is complete
        if (phaseProgress >= 1 && currentPhaseIndex < analysisPhases.length - 1) {
          currentPhaseIndex++;
          phaseStartTime = Date.now();
        }
        
        // Update individual ticker progress
        setAnalysisProgress(prev => {
          const newProgress = {};
          Object.keys(prev).forEach(ticker => {
            if (prev[ticker] < 1) {
              newProgress[ticker] = Math.min(totalProgress, 0.98); // Cap at 98% until API completes
            } else {
              newProgress[ticker] = prev[ticker];
            }
          });
          return newProgress;
        });
        
        // Update global progress and current phase
        setGlobalProgress(Math.min(totalProgress, 0.98));
        setCurrentPhase(currentPhase.name);
        
      }, 50); // Update every 50ms for smoother animation

      // API call with abort signal for cancellation
      const response = await axios.get(`http://localhost:8000/news/custom-summary`, {
        params: { tickers: tickersToAnalyze.join(',') },
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 300000, // Reduced timeout to 5 minutes
        signal: controllers[tickersToAnalyze[0]]?.signal // Use first ticker's controller for the entire request
      });
      
      clearInterval(progressInterval);
      
      console.log('API Response:', response.data);
      
      if (response.data && response.data.reports) {
        const tickerList = Object.keys(response.data.reports);
        
        // Immediately complete progress for all tickers and global progress
        const completeProgress = {};
        tickerList.forEach(ticker => {
          completeProgress[ticker] = 1;
        });
        setAnalysisProgress(completeProgress);
        setGlobalProgress(1);
        setCompletedTickers(new Set(tickerList));
        
        // Set reports with visual feedback
        for (let i = 0; i < tickerList.length; i++) {
          const ticker = tickerList[i];
          
          const reportData = response.data.reports[ticker];
          console.log(`Setting report for ${ticker}:`, reportData);
          console.log(`Report structure - has prediction? ${!!reportData?.prediction}, has sections? ${!!reportData?.prediction?.sections}`);
          
          // Set report immediately (no artificial delay)
          setReports(prev => ({
            ...prev,
            [ticker]: reportData
          }));
          
          // Remove loading state immediately
          setLoadingTickers(prev => ({
            ...prev,
            [ticker]: false
          }));
        }
        
        setLastRunTime(new Date());
      } else {
        setError("Analysis returned no results");
      }
    } catch (err) {
      console.error('Analysis error:', err);
      if (err.name === 'AbortError') {
        setError("Analysis was cancelled");
      } else {
        setError("Analysis temporarily unavailable");
      }
    } finally {
      setLoading(false);
      setLoadingTickers({});
      setAnalysisControllers({});
    }
  };

  // Cancel individual ticker analysis
  const handleCancelTicker = (ticker) => {
    const controller = analysisControllers[ticker];
    if (controller) {
      controller.abort();
      setLoadingTickers(prev => ({ ...prev, [ticker]: false }));
      setAnalysisProgress(prev => ({ ...prev, [ticker]: 0 }));
      setAnalysisControllers(prev => {
        const { [ticker]: removed, ...rest } = prev;
        return rest;
      });
    }
  };

  // Cancel all analysis
  const handleCancelAll = () => {
    Object.values(analysisControllers).forEach(controller => {
      controller.abort();
    });
    setLoading(false);
    setLoadingTickers({});
    setAnalysisProgress({});
    setGlobalProgress(0);
    setCurrentPhase('');
    setAnalysisControllers({});
    setError("Analysis cancelled by user");
  };

  const handleRerun = async (ticker) => {
    setLoadingTickers(prev => ({ ...prev, [ticker]: true }));
    setAnalysisProgress(prev => ({ ...prev, [ticker]: 0 }));
    
    // Continuous progress for rerun (reduced timing)
    const estimatedTime = 45000; // Reduced to 45 seconds
    const startTime = Date.now();
    
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / estimatedTime, 0.99); // Cap at 99%
      
      setAnalysisProgress(prev => ({ 
        ...prev, 
        [ticker]: prev[ticker] < 1 ? progress : prev[ticker]
      }));
    }, 100); // Update every 100ms
    
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`http://localhost:8000/news/custom-summary`, {
        params: { tickers: ticker },
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      clearInterval(progressInterval);
      
      if (response.data?.reports?.[ticker]) {
        setReports(prev => ({
          ...prev,
          [ticker]: response.data.reports[ticker]
        }));
        setAnalysisProgress(prev => ({ ...prev, [ticker]: 1 }));
      }
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

        {/* Analysis Summary with Global Progress */}
        {(lastRunTime || Object.keys(reports).length > 0 || loading) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${isDark 
              ? 'bg-gray-800/50 border-gray-700 backdrop-blur-sm' 
              : 'bg-white/70 border-gray-200 backdrop-blur-sm'
            } rounded-xl px-5 py-4 border shadow-sm`}
          >
            {loading && Object.keys(analysisProgress).length > 0 ? (
              <div className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-sm font-semibold ${
                    isDark ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    Analyzing {Object.keys(analysisProgress).length} ticker{Object.keys(analysisProgress).length > 1 ? 's' : ''}
                  </h3>
                  <span className={`text-2xl font-bold ${
                    isDark ? 'text-indigo-400' : 'text-indigo-600'
                  }`}>
                    {Math.round(globalProgress * 100)}%
                  </span>
                </div>

                {/* Global Progress Bar */}
                <div className="mb-4">
                  <div className={`w-full h-3 rounded-full overflow-hidden ${
                    isDark ? 'bg-gray-700/50' : 'bg-gray-200'
                  }`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${globalProgress * 100}%` }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        globalProgress === 1 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                          : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Individual Stock Progress */}
                <div className="mb-3">
                  <h4 className={`text-xs font-medium mb-2 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Individual Progress
                  </h4>
                </div>
                
                {/* Individual Ticker Progress */}
                <div className="space-y-1">
                  {Object.entries(analysisProgress).map(([ticker, progress]) => (
                    <div key={ticker} className="flex items-center gap-2">
                      <span className={`text-xs font-mono w-12 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {ticker}
                      </span>
                      <div className={`flex-1 h-1 rounded-full overflow-hidden ${
                        isDark ? 'bg-gray-700/50' : 'bg-gray-300/50'
                      }`}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress * 100}%` }}
                          className={`h-full rounded-full ${
                            progress === 1 
                              ? 'bg-green-500' 
                              : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                          }`}
                        />
                      </div>
                      <span className={`text-xs font-medium w-10 text-right ${
                        progress === 1 
                          ? isDark ? 'text-green-400' : 'text-green-600'
                          : isDark ? 'text-gray-500' : 'text-gray-600'
                      }`}>
                        {Math.round(progress * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Cancel All Button */}
                <div className="mt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCancelAll}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isDark 
                        ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-800/50' 
                        : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                    }`}
                  >
                    Cancel All Analysis
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
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
              </div>
            )}
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
              const tickerProgress = analysisProgress[ticker] || 0;

              if (!report && !isLoading) return null;

              return (
                <TickerReportCard
                  key={ticker}
                  ticker={ticker}
                  report={report}
                  isLoading={isLoading}
                  analysisProgress={tickerProgress}
                  onRerun={handleRerun}
                  onCancel={handleCancelTicker}
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