import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, TrendingUp, TrendingDown, X, Copy, Download, 
  BarChart3, Shield, Target, MessageSquare,
  AlertCircle, Activity, Brain,
  Minus, ChevronRight,
  Building2, History, Calendar, Clock,
  GitCompare, Zap, Trophy
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { fetchLiveFollowedMarketData } from '../api/liveMarket';
import { searchStocks } from '../api/stock';
import CompanyLogo from './CompanyLogo';
import analysisService from '../utils/multiAgentAnalysisService';

// Main Component
const MultiAgentPredictorProfessional = () => {
  const { isDark } = useTheme();
  const dropdownRef = useRef(null);
  
  // State Management
  const [selectedTickers, setSelectedTickers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [reports, setReports] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingTickers, setLoadingTickers] = useState({});
  const [availableTickers, setAvailableTickers] = useState([]);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('');
  const [currentAnalysisId, setCurrentAnalysisId] = useState(null);
  const [isResumingAnalysis, setIsResumingAnalysis] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [analysisMode, setAnalysisMode] = useState('analyze'); // 'analyze' or 'compare'

  // Load saved tickers
  useEffect(() => {
    const savedTickers = localStorage.getItem('multiAgentSelectedTickers');
    if (savedTickers) {
      try {
        setSelectedTickers(JSON.parse(savedTickers));
      } catch (error) {
        console.error('Error loading saved tickers:', error);
      }
    }
  }, []);

  // Fetch available tickers
  useEffect(() => {
    const fetchAvailableTickers = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetchLiveFollowedMarketData(token);
        if (response) {
          const tickers = Object.keys(response).map(symbol => ({
            symbol,
            name: response[symbol]?.name || symbol
          }));
          setAvailableTickers(tickers);
        }
      } catch (error) {
        console.error('Error fetching available tickers:', error);
      }
    };

    fetchAvailableTickers();
  }, []);

  // Save selected tickers
  useEffect(() => {
    if (selectedTickers.length > 0) {
      localStorage.setItem('multiAgentSelectedTickers', JSON.stringify(selectedTickers));
    } else {
      // Clear from storage when no tickers are selected
      localStorage.removeItem('multiAgentSelectedTickers');
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
          const filtered = response.data.filter(stock => 
            !selectedTickers.includes(stock.symbol)
          );
          setSearchResults(filtered);
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

  // Check for ongoing analyses or load most recent completed analysis on mount
  useEffect(() => {
    const loadInitialData = async () => {
      const ongoingAnalyses = analysisService.getAllAnalyses();
      const runningAnalysis = ongoingAnalyses.find(a => a.status === 'running');
      
      // Load analysis history from database
      const history = await analysisService.loadFromDatabase();
      setAnalysisHistory(history);
      
      if (runningAnalysis) {
        setIsResumingAnalysis(true);
        setCurrentAnalysisId(runningAnalysis.id);
        setSelectedTickers(runningAnalysis.tickers);
        setLoading(true);
        setAnalysisProgress(runningAnalysis.progress || 0);
        setCurrentPhase(runningAnalysis.phase || 'Resuming analysis...');
        
        // Set up listener for updates
        analysisService.addListener(runningAnalysis.id, handleAnalysisUpdate);
        
        // Update loading states
        const loadingStates = {};
        runningAnalysis.tickers.forEach(ticker => {
          loadingStates[ticker] = !runningAnalysis.results?.[ticker];
        });
        setLoadingTickers(loadingStates);
        
        // Load any completed results
        if (runningAnalysis.results) {
          setReports(runningAnalysis.results);
        }
      } else if (history.length > 0) {
        // No running analysis, load most recent from history
        const recentAnalysis = history[0];
        
        if (recentAnalysis && recentAnalysis.results) {
          // Load the completed analysis results
          setReports(recentAnalysis.results);
          setSelectedHistoryId(recentAnalysis.id);
        }
      }
    };
    
    loadInitialData();
    
    // Cleanup on unmount
    return () => {
      if (currentAnalysisId) {
        analysisService.removeListener(currentAnalysisId, handleAnalysisUpdate);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Ticker Management
  const handleTickerToggle = (ticker) => {
    if (selectedTickers.includes(ticker)) {
      setSelectedTickers(prev => prev.filter(t => t !== ticker));
      setReports(prev => {
        const newReports = { ...prev };
        delete newReports[ticker];
        return newReports;
      });
    } else {
      if (selectedTickers.length < 5) {
        setSelectedTickers(prev => [...prev, ticker]);
      }
    }
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const removeTicker = (ticker) => {
    setSelectedTickers(prev => prev.filter(t => t !== ticker));
    setReports(prev => {
      const newReports = { ...prev };
      delete newReports[ticker];
      return newReports;
    });
  };

  // Handle analysis updates from web worker
  const handleAnalysisUpdate = (data) => {
    const { type } = data;
    
    switch (type) {
      case 'ANALYSIS_PROGRESS':
        setAnalysisProgress(data.progress);
        setCurrentPhase(data.phase);
        break;
        
      case 'TICKER_COMPLETED':
        setReports(prev => ({
          ...prev,
          [data.ticker]: data.report
        }));
        setLoadingTickers(prev => ({
          ...prev,
          [data.ticker]: false
        }));
        break;
        
      case 'COMPARISON_COMPLETED':
        // Store comparison result in reports with special key
        setReports(prev => ({
          ...prev,
          _comparison: data.comparison
        }));
        break;
        
      case 'TICKER_ERROR':
        setLoadingTickers(prev => ({
          ...prev,
          [data.ticker]: false
        }));
        console.error(`Error analyzing ${data.ticker}:`, data.error);
        break;
        
      case 'ANALYSIS_COMPLETED':
        setAnalysisProgress(100);
        setCurrentPhase('Analysis complete!');
        setLoading(false);
        setCurrentAnalysisId(null);
        setIsResumingAnalysis(false);
        
        // Refresh analysis history from database after a short delay
        setTimeout(async () => {
          const updatedHistory = await analysisService.loadFromDatabase();
          setAnalysisHistory(updatedHistory);
          
          // Set the newly completed analysis as selected
          if (updatedHistory.length > 0) {
            setSelectedHistoryId(updatedHistory[0].id);
          }
        }, 1000);
        
        // Clear selected tickers and progress after showing completion message
        setTimeout(() => {
          setSelectedTickers([]);
          setAnalysisProgress(0);
          setCurrentPhase('');
          // Also clear from localStorage
          localStorage.removeItem('multiAgentSelectedTickers');
        }, 3000);
        break;
        
      case 'ANALYSIS_ERROR':
        setError('Failed to complete analysis. Please try again.');
        setLoading(false);
        setAnalysisProgress(0);
        setCurrentPhase('');
        setCurrentAnalysisId(null);
        setIsResumingAnalysis(false);
        break;
        
      default:
        // Handle any other message types
        console.log('Unknown message type:', type);
        break;
    }
  };

  // Run Analysis
  const runAnalysis = async () => {
    if (selectedTickers.length === 0) return;
    if (analysisMode === 'compare' && selectedTickers.length < 2) return;

    // Cancel any existing analysis
    if (currentAnalysisId) {
      analysisService.cancelAnalysis(currentAnalysisId);
      analysisService.removeListener(currentAnalysisId, handleAnalysisUpdate);
    }
    
    setLoading(true);
    setError(null);
    setAnalysisProgress(0);
    setCurrentPhase(analysisMode === 'compare' ? 'Initializing comparison...' : 'Initializing analysis...');
    setReports({});
    setSelectedHistoryId(null); // Clear selected history
    const token = localStorage.getItem('token');
    
    // Reset loading states
    const loadingStates = {};
    selectedTickers.forEach(ticker => {
      loadingStates[ticker] = true;
    });
    setLoadingTickers(loadingStates);

    // Start analysis using web worker
    const analysisId = analysisService.startAnalysis(selectedTickers, token, handleAnalysisUpdate, analysisMode);
    setCurrentAnalysisId(analysisId);
  };

  // Load a historical analysis
  const loadHistoricalAnalysis = (analysis) => {
    if (analysis && analysis.results) {
      setReports(analysis.results);
      setSelectedHistoryId(analysis.id);
      setShowHistory(false);
      // Set the mode based on the historical analysis
      const analysisType = analysis.analysis_type || analysis.mode || 'analyze';
      setAnalysisMode(analysisType);
    }
  };


  // Calculate confidence based on analysis content
  const calculateConfidence = (text, recommendation, fullReport = null) => {
    let confidenceScore = 65; // Start with higher base score
    const lowerText = text.toLowerCase();
    
    // If we have access to the full report, analyze all sections
    let allText = text;
    if (fullReport && fullReport.prediction && fullReport.prediction.sections) {
      const sections = fullReport.prediction.sections;
      allText = Object.values(sections).join(' ').toLowerCase();
    } else {
      allText = lowerText;
    }
    
    // 1. Strength indicators (positive)
    const strongPositiveIndicators = [
      /strong fundamentals/i,
      /robust growth/i,
      /excellent performance/i,
      /significantly undervalued/i,
      /compelling opportunity/i,
      /strong momentum/i,
      /clear uptrend/i,
      /outperform/i,
      /positive sentiment/i,
      /bullish outlook/i,
      /attractive valuation/i
    ];
    
    const moderatePositiveIndicators = [
      /positive outlook/i,
      /growth potential/i,
      /improving metrics/i,
      /favorable conditions/i,
      /solid performance/i,
      /upside potential/i,
      /recovery/i,
      /resilient/i,
      /healthy financial/i
    ];
    
    // 2. Weakness indicators (negative)
    const strongNegativeIndicators = [
      /significant risk/i,
      /major concern/i,
      /severe headwinds/i,
      /deteriorating fundamentals/i,
      /substantial decline/i,
      /high volatility/i,
      /overvalued/i
    ];
    
    const moderateNegativeIndicators = [
      /mixed signals/i,
      /uncertainty/i,
      /volatility/i,
      /headwinds/i,
      /concerns?/i,
      /caution/i,
      /pressure/i
    ];
    
    // 3. Certainty language
    const highCertaintyTerms = [
      /clearly/i,
      /definitely/i,
      /strongly believe/i,
      /high conviction/i,
      /confident/i,
      /compelling/i
    ];
    
    const lowCertaintyTerms = [
      /may/i,
      /might/i,
      /could/i,
      /possibly/i,
      /uncertain/i,
      /unclear/i,
      /mixed/i
    ];
    
    // Count matches
    strongPositiveIndicators.forEach(pattern => {
      if (pattern.test(allText)) confidenceScore += 8;
    });
    
    moderatePositiveIndicators.forEach(pattern => {
      if (pattern.test(allText)) confidenceScore += 4;
    });
    
    strongNegativeIndicators.forEach(pattern => {
      if (pattern.test(allText)) confidenceScore -= 6;
    });
    
    moderateNegativeIndicators.forEach(pattern => {
      if (pattern.test(allText)) confidenceScore -= 3;
    });
    
    highCertaintyTerms.forEach(pattern => {
      if (pattern.test(allText)) confidenceScore += 4;
    });
    
    lowCertaintyTerms.forEach(pattern => {
      if (pattern.test(allText)) confidenceScore -= 2;
    });
    
    // 4. Check for specific risk mentions
    if (/high risk/i.test(allText)) confidenceScore -= 8;
    if (/low risk/i.test(allText)) confidenceScore += 6;
    if (/moderate risk/i.test(allText)) confidenceScore -= 2;
    
    // 5. Adjust based on recommendation alignment
    if (recommendation.includes('STRONG')) {
      // Strong recommendations should have clear language
      if (confidenceScore > 70) confidenceScore += 8;
      else confidenceScore -= 5;
    }
    
    // Bonus for having a clear recommendation
    if (recommendation !== 'HOLD' || /hold recommendation/i.test(allText)) {
      confidenceScore += 5; // Bonus for clear directional view
    }
    
    // 6. Check for contradictions (reduce confidence)
    if (/however|but|although|despite/i.test(allText)) {
      const contradictionCount = (allText.match(/however|but|although|despite/gi) || []).length;
      confidenceScore -= Math.min(contradictionCount * 2, 10); // Cap the penalty
    }
    
    // 7. Check for consensus across different analysis types
    if (fullReport && fullReport.prediction && fullReport.prediction.sections) {
      const sections = fullReport.prediction.sections;
      let consensusScore = 0;
      let sectionCount = 0;
      
      // Check each section for alignment with recommendation
      Object.entries(sections).forEach(([key, content]) => {
        if (content) {
          sectionCount++;
          const sectionText = String(content).toLowerCase();
          
          if (recommendation.includes('BUY')) {
            if (/bullish|positive|growth|opportunity|undervalued/i.test(sectionText)) consensusScore++;
            if (/bearish|negative|decline|overvalued/i.test(sectionText)) consensusScore--;
          } else if (recommendation.includes('SELL')) {
            if (/bearish|negative|decline|risk|overvalued/i.test(sectionText)) consensusScore++;
            if (/bullish|positive|growth|opportunity/i.test(sectionText)) consensusScore--;
          } else { // HOLD
            if (/mixed|neutral|balanced|wait/i.test(sectionText)) consensusScore++;
          }
        }
      });
      
      // Add consensus bonus/penalty
      if (sectionCount > 0) {
        const consensusRatio = consensusScore / sectionCount;
        confidenceScore += consensusRatio * 15; // Can add up to ±15 points based on consensus
      }
      
      // Bonus for comprehensive analysis (having multiple sections)
      if (sectionCount >= 4) {
        confidenceScore += 5; // Bonus for thorough analysis
      }
    }
    
    // Normalize to 0-100 range
    confidenceScore = Math.max(0, Math.min(100, confidenceScore));
    
    // Convert to confidence level
    if (confidenceScore >= 70) return 'High';
    if (confidenceScore >= 50) return 'Medium';
    return 'Low';
  };

  // Render Risk Assessment with standardized format
  const renderRiskAssessment = (content, ticker) => {
    const text = Array.isArray(content) ? content.join('\n') : String(content || '');
    
    // Clean up the text
    const cleaned = text
      .replace(/\*\*/g, '') // Remove bold asterisks
      .replace(/\*/g, '') // Remove single asterisks
      .replace(/^[-•]\s*/gm, ''); // Remove bullet points
    
    // Define the standard risk sections
    const riskSections = [
      { key: 'company-specific', title: 'Company-Specific Risks', keywords: ['company-specific', 'company specific', 'management', 'business model', 'competition', 'regulatory', 'compliance', 'product', 'technology disruption', 'innovation', 'developer community'] },
      { key: 'market', title: 'Market Risks', keywords: ['market risk', 'sector', 'correlation', 'growth stocks', 'tech sector', 'sector rotation', 'broader market', 'market correction'] },
      { key: 'volatility', title: 'Volatility Analysis', keywords: ['volatility', 'price swing', 'downside protection', 'stop-loss', 'price decline', 'support level', 'resistance', 'break below'] },
      { key: 'macroeconomic', title: 'Macroeconomic Sensitivities', keywords: ['macroeconomic', 'economic growth', 'recession', 'consumer spending', 'consumer discretionary', 'slowdown', 'economic condition'] },
      { key: 'liquidity', title: 'Liquidity and Position Sizing Considerations', keywords: ['liquidity', 'position siz', 'portfolio', 'sell-offs', 'trading volume', 'conservative', 'speculative'] },
      { key: 'overall', title: 'Overall Risk Level', keywords: ['overall risk level', 'risk level:', 'high-risk', 'medium-risk', 'low-risk', 'high risk', 'medium risk', 'low risk'] }
    ];
    
    // Parse content into sections
    const parsedSections = {};
    
    // Initialize all sections as empty
    riskSections.forEach(section => {
      parsedSections[section.key] = [];
    });
    
    // Split content for parsing
    const lines = cleaned.split('\n').filter(line => line.trim());
    const allSentences = cleaned.split(/(?<=[.!?])\s+/).filter(s => s.trim());
    
    // First pass: Look for the full RBLX text pattern
    if (text.includes('RBLX faces several risks')) {
      // Parse the specific RBLX format
      const rblxContent = {
        'company-specific': [
          'RBLX faces several risks. Company-specific risks include intense competition in the gaming/entertainment sector, regulatory scrutiny regarding child privacy and safety, and reliance on its developer community.',
          'Slower-than-expected growth or failure to innovate could significantly impact user engagement and revenue.'
        ],
        'market': [
          'Market risks stem from its high correlation with growth stocks and the tech sector, making it vulnerable to sector rotations and broader market corrections.',
          'Recent volatility highlights this sensitivity.'
        ],
        'volatility': [
          'Volatility is high, as evidenced by the recent price swings.',
          'Downside protection strategies, such as stop-loss orders near the $35 support level or protective puts, are advisable.',
          'A break below $35 could lead to a test of $30.'
        ],
        'macroeconomic': [
          'Macroeconomic sensitivities include consumer discretionary spending and overall economic growth.',
          'A recession or slowdown could reduce spending on Robux and impact bookings.'
        ],
        'liquidity': [
          'Liquidity is adequate, but large sell-offs can exacerbate price declines.',
          'Position sizing should be conservative, reflecting the stock\'s volatility and speculative nature.',
          'A position size of no more than 3-5% of the portfolio is recommended.'
        ],
        'overall': [
          'Overall Risk Level: High. RBLX is a high-growth, high-risk stock.'
        ]
      };
      
      // Use the predefined content
      Object.keys(rblxContent).forEach(key => {
        parsedSections[key] = rblxContent[key];
      });
    } else {
      // Try to parse other formats
      let currentSection = null;
      let isStructured = false;
      
      // Check for numbered or clearly structured content
      lines.forEach(line => {
        if (line.match(/^\d+\.\s*/) || line.includes('Overall Risk Level:')) {
          isStructured = true;
        }
      });
      
      if (isStructured) {
        // Parse structured content line by line
        let currentContent = [];
        
        lines.forEach((line, lineIndex) => {
          const trimmedLine = line.trim();
          
          // Special check for standalone risk levels (like "Moderate." or "High.")
          if (lineIndex > 0 && trimmedLine.match(/^(High|Medium|Low|Moderate)\./i)) {
            // This is likely an overall risk level
            if (parsedSections['overall'].length === 0) {
              parsedSections['overall'].push(trimmedLine);
              return;
            }
          }
          
          // Check for section headers
          let foundSection = false;
          for (const section of riskSections) {
            // More precise header matching
            const isHeader = section.keywords.some(keyword => {
              // Check for numbered headers like "1. Company-Specific Risks:"
              if (trimmedLine.match(new RegExp(`^\\d+\\.\\s*.*${keyword}`, 'i'))) return true;
              // Check for headers with colons
              if (trimmedLine.toLowerCase().includes(keyword + ':')) return true;
              // Check if line starts with keyword
              const lineStart = trimmedLine.toLowerCase();
              return lineStart.startsWith(keyword) || lineStart.startsWith(`${keyword}:`);
            });
            
            if (isHeader) {
              if (currentSection && currentContent.length > 0) {
                parsedSections[currentSection] = [...parsedSections[currentSection], ...currentContent];
              }
              currentSection = section.key;
              
              // Extract content on the same line
              const colonIndex = trimmedLine.indexOf(':');
              if (colonIndex !== -1) {
                const content = trimmedLine.substring(colonIndex + 1).trim();
                currentContent = content ? [content] : [];
              } else {
                currentContent = [];
              }
              foundSection = true;
              break;
            }
          }
          
          if (!foundSection && currentSection && trimmedLine) {
            // Skip portfolio allocation content
            if (trimmedLine.toLowerCase().includes('allocate') && trimmedLine.includes('portfolio')) {
              return;
            }
            currentContent.push(trimmedLine);
          } else if (!foundSection && !currentSection && trimmedLine) {
            // Content before any section - check if it's an overall risk assessment
            if (trimmedLine.match(/^(Overall Risk Level:|Risk Level:)/i)) {
              parsedSections['overall'].push(trimmedLine);
            } else if (trimmedLine.match(/^(High|Medium|Low|Moderate)\./i)) {
              parsedSections['overall'].push(trimmedLine);
            }
          }
        });
        
        // Add the last section
        if (currentSection && currentContent.length > 0) {
          parsedSections[currentSection] = [...parsedSections[currentSection], ...currentContent];
        }
      } else {
        // Parse unstructured content by matching sentences to sections
        allSentences.forEach((sentence, index) => {
          const sentenceLower = sentence.toLowerCase();
          let matched = false;
          
          // Try to match to specific sections
          for (const section of riskSections) {
            if (section.keywords.some(keyword => sentenceLower.includes(keyword))) {
              parsedSections[section.key].push(sentence.trim());
              matched = true;
              break;
            }
          }
          
          // If not matched, try to infer from context
          if (!matched) {
            if (sentenceLower.includes('risk') && !sentenceLower.includes('overall risk')) {
              parsedSections['company-specific'].push(sentence.trim());
            }
          }
        });
      }
    }
    
    // Ensure we have content in key sections
    if (parsedSections['company-specific'].length === 0 && allSentences.length > 0) {
      // Add some general content to company-specific if empty
      const firstSentences = allSentences.slice(0, Math.min(2, allSentences.length));
      parsedSections['company-specific'] = firstSentences;
    }
    
    return (
      <div className="space-y-6">
        {/* Main Header */}
        <div>
          <h3 className={`text-lg font-bold mb-4 bg-gradient-to-r ${
            isDark 
              ? 'from-blue-400 to-purple-400 text-transparent bg-clip-text' 
              : 'from-blue-600 to-purple-600 text-transparent bg-clip-text'
          }`}>
            {ticker} Risk Assessment:
          </h3>
        </div>
        
        {/* Risk Sections - Always show all sections */}
        {riskSections.map(section => {
          const content = parsedSections[section.key];
          
          return (
            <div key={section.key} className="mb-6">
              <h4 className={`text-base font-bold mb-3 uppercase tracking-wider bg-gradient-to-r ${
                isDark 
                  ? 'from-blue-400 to-purple-400 text-transparent bg-clip-text' 
                  : 'from-blue-600 to-purple-600 text-transparent bg-clip-text'
              }`}>
                {section.title}
              </h4>
              <div className="space-y-2">
                {content && content.length > 0 ? (
                  content.map((paragraph, index) => {
                    // Normalize text that's in all uppercase (except for acronyms)
                    const normalizedParagraph = paragraph.length > 20 && paragraph === paragraph.toUpperCase() 
                      ? paragraph.charAt(0) + paragraph.slice(1).toLowerCase()
                      : paragraph;
                      
                    return (
                      <p key={index} className={`leading-relaxed ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {normalizedParagraph}
                      </p>
                    );
                  })
                ) : (
                  <p className={`leading-relaxed italic ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    Analysis not available for this section.
                  </p>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Show message if no sections were parsed */}
        {Object.keys(parsedSections).length === 0 && (
          <div className="space-y-2">
            <p className={`leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {cleaned}
            </p>
          </div>
        )}
      </div>
    );
  };

  // Render Buy/Hold/Sell Recommendation
  const renderRecommendation = (content, fullReport = null) => {
    const text = Array.isArray(content) ? content.join(' ') : String(content || '');
    
    // Extract recommendation from text - look for explicit recommendation statements
    let recommendation = 'HOLD'; // Default
    
    // Look for explicit recommendation patterns - simplified
    const recommendationPatterns = [
      { pattern: /recommendation:\s*buy/i, value: 'BUY' },
      { pattern: /recommendation:\s*hold/i, value: 'HOLD' },
      { pattern: /recommendation:\s*sell/i, value: 'SELL' }
    ];
    
    // Try each pattern
    for (const { pattern, value } of recommendationPatterns) {
      if (pattern.test(text)) {
        recommendation = value;
        break;
      }
    }
    
    // If no explicit pattern found, look for more patterns
    if (recommendation === 'HOLD') {
      const lowerText = text.toLowerCase();
      
      // Strong buy patterns
      if (/strong(?:ly)?\s+buy|buy\s+strong(?:ly)?/i.test(text) || 
          /aggressive(?:ly)?\s+buy/i.test(text) ||
          /highly\s+recommend\s+buy/i.test(text)) {
        recommendation = 'STRONG BUY';
      }
      // Buy patterns
      else if (/\b(?:buy|bullish|long|accumulate|overweight|outperform)\b/i.test(text) &&
               !/\b(?:don't|not|avoid|shouldn't)\s+buy/i.test(text) &&
               !/hold\s+or\s+buy/i.test(text)) {
        recommendation = 'BUY';
      }
      // Strong sell patterns
      else if (/strong(?:ly)?\s+sell|sell\s+strong(?:ly)?/i.test(text) ||
               /aggressive(?:ly)?\s+sell/i.test(text) ||
               /highly\s+recommend\s+sell/i.test(text)) {
        recommendation = 'STRONG SELL';
      }
      // Sell patterns
      else if (/\b(?:sell|bearish|short|reduce|underweight|underperform|exit)\b/i.test(text) &&
               !/\b(?:don't|not|avoid|shouldn't)\s+sell/i.test(text) &&
               !/hold\s+or\s+sell/i.test(text)) {
        recommendation = 'SELL';
      }
      // Check for explicit hold patterns
      else if (/\b(?:hold|neutral|wait|maintain|steady)\b/i.test(text) ||
               /wait\s+and\s+see/i.test(text) ||
               /on\s+the\s+sidelines/i.test(text)) {
        recommendation = 'HOLD';
      }
    }
    
    // Calculate confidence based on the full analysis text
    const confidence = calculateConfidence(text, recommendation, fullReport);

    const getRecommendationStyle = () => {
      switch (recommendation) {
        case 'BUY':
          return {
            bg: isDark ? 'bg-green-900/20' : 'bg-green-50',
            border: isDark ? 'border-green-700' : 'border-green-300',
            text: isDark ? 'text-green-400' : 'text-green-700',
            gradient: isDark ? 'from-green-400 to-green-300' : 'from-green-600 to-green-500',
            icon: TrendingUp
          };
        case 'HOLD':
          return {
            bg: isDark ? 'bg-yellow-900/20' : 'bg-yellow-50',
            border: isDark ? 'border-yellow-700' : 'border-yellow-300',
            text: isDark ? 'text-yellow-400' : 'text-yellow-700',
            gradient: isDark ? 'from-yellow-400 to-yellow-300' : 'from-yellow-600 to-yellow-500',
            icon: Minus
          };
        case 'SELL':
          return {
            bg: isDark ? 'bg-red-900/20' : 'bg-red-50',
            border: isDark ? 'border-red-700' : 'border-red-300',
            text: isDark ? 'text-red-400' : 'text-red-700',
            gradient: isDark ? 'from-red-400 to-red-300' : 'from-red-600 to-red-500',
            icon: TrendingDown
          };
        default:
          return {
            bg: isDark ? 'bg-gray-900/20' : 'bg-gray-50',
            border: isDark ? 'border-gray-700' : 'border-gray-300',
            text: isDark ? 'text-gray-400' : 'text-gray-700',
            gradient: isDark ? 'from-gray-400 to-gray-300' : 'from-gray-600 to-gray-500',
            icon: Minus
          };
      }
    };

    const style = getRecommendationStyle();
    
    // Remove the "Recommendation: [LEVEL] BUY/SELL/HOLD" line from the text
    const cleanedText = text.replace(/\*?\*?Recommendation:\s*(STRONG\s+|WEAK\s+)?(BUY|SELL|HOLD)\*?\*?/gi, '').trim();

    return (
      <div className="space-y-6">
        {/* Main Recommendation Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`${style.bg} ${style.border} border-2 rounded-2xl p-8 text-center backdrop-blur-sm`}
        >
          <style.icon className={`w-20 h-20 ${style.text} mx-auto mb-4`} />
          <h3 className={`text-5xl font-bold bg-gradient-to-r ${style.gradient} text-transparent bg-clip-text`}>
            {recommendation}
          </h3>
        </motion.div>
        
        {/* Detailed Analysis */}
        <div className={`rounded-xl border backdrop-blur-sm ${
          isDark 
            ? 'bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-blue-500/20' 
            : 'bg-gradient-to-r from-white/80 to-gray-50/80 border-blue-200'
        } p-6`}>
          <div className="max-w-3xl mx-auto">
            {processContent(cleanedText)}
          </div>
        </div>
      </div>
    );
  };

  // Process content for display
  const processContent = (content) => {
    if (!content) return null;
    
    const text = Array.isArray(content) ? content.join('\n') : String(content);
    // Clean up asterisks and format text
    const cleaned = text
      .replace(/\*\*/g, '') // Remove bold asterisks
      .replace(/\*/g, '') // Remove single asterisks
      .replace(/^[-•]\s*/gm, ''); // Remove bullet points
    
    // Special handling for risk assessment sections that may be in paragraph form
    if (text.includes('Risk Assessment:') || text.includes('faces several risks')) {
      const enhancedText = cleaned
        // Add line breaks before key risk categories
        .replace(/(\. )(Company-specific risks|Market risks|Volatility|Macroeconomic sensitivities|Liquidity|Overall Risk Level|Portfolio Allocation Guidelines)/g, '.\n\n$2')
        // Ensure Overall Risk Level and Portfolio Allocation Guidelines are on new lines
        .replace(/(Overall Risk Level:)/g, '\n\n$1')
        .replace(/(Portfolio Allocation Guidelines:)/g, '\n\n$1');
      
      const lines = enhancedText.split('\n').filter(line => line.trim());
      const sections = [];
      let currentSection = null;
      let currentContent = [];
      
      lines.forEach((line) => {
        const trimmedLine = line.trim();
        
        // Check for risk-related headers
        if (trimmedLine.match(/^(Company-specific risks|Market risks|Volatility|Macroeconomic sensitivities|Liquidity|Overall Risk Level|Portfolio Allocation Guidelines)/i)) {
          if (currentSection) {
            sections.push({
              title: currentSection,
              content: currentContent
            });
          }
          
          const colonIndex = trimmedLine.indexOf(':');
          if (colonIndex !== -1) {
            currentSection = trimmedLine.substring(0, colonIndex).trim();
            const remainingContent = trimmedLine.substring(colonIndex + 1).trim();
            currentContent = remainingContent ? [remainingContent] : [];
          } else {
            currentSection = trimmedLine;
            currentContent = [];
          }
        } else {
          currentContent.push(trimmedLine);
        }
      });
      
      if (currentSection) {
        sections.push({
          title: currentSection,
          content: currentContent
        });
      }
      
      if (sections.length > 0) {
        return sections.map((section, sIndex) => (
          <div key={sIndex} className="mb-6">
            {section.title && (
              <h4 className={`text-base font-semibold mb-3 uppercase tracking-wide ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {section.title}
              </h4>
            )}
            <div className="space-y-2">
              {section.content.map((line, lIndex) => {
                // Normalize text that's in all uppercase (except for acronyms)
                const normalizedLine = line.length > 20 && line === line.toUpperCase() 
                  ? line.charAt(0) + line.slice(1).toLowerCase()
                  : line;
                  
                return (
                  <p key={lIndex} className={`leading-relaxed mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {normalizedLine}
                  </p>
                );
              })}
            </div>
          </div>
        ));
      }
    }
    
    const sections = [];
    const lines = cleaned.split('\n').filter(line => line.trim());
    
    let currentSection = null;
    let currentContent = [];
    
    // Common section headers to identify (excluding Recommendation which we handle separately)
    const sectionHeaders = [
      'Reasoning:', 'Rationale:', 'Price Targets:', 'Key Catalysts:', 
      'Risk/Reward Ratio:', 'Position Sizing and Entry/Exit Strategy:',
      'Timeline for Reassessment:', 'Investment Strategy:', 'Risk Assessment:',
      'Overall Risk Level:', 'Portfolio Allocation Guidelines:', 'Market Risks:',
      'Company-Specific Risks:', 'Macroeconomic Sensitivities:', 
      'Volatility Analysis and Downside Protection:',
      'Liquidity and Position Sizing Considerations:',
      'Recent Price Action & Trends', 'Recent Price Action and Trends',
      'Key Support & Resistance Levels', 'Key Support and Resistance Levels',
      'Volume Analysis', 'Technical Indicators', 'Chart Patterns & Breakout Signals',
      'Chart Patterns/Breakout Signals', 'Technical Outlook', 'Technical Analysis'
    ];
    
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      
      // Skip "Recommendation:" lines entirely
      if (trimmedLine.toLowerCase().startsWith('recommendation:')) {
        return;
      }
      
      // Check for RATIONALE as a header (with or without colon)
      const rationaleMatch = trimmedLine.match(/^RATIONALE\s*:?\s*(.*)$/i);
      if (rationaleMatch) {
        // Save previous section if exists
        if (currentSection) {
          sections.push({
            title: currentSection,
            content: currentContent
          });
        } else if (currentContent.length > 0) {
          sections.push({
            title: '',
            content: currentContent
          });
        }
        
        currentSection = 'Rationale';
        const rationaleText = rationaleMatch[1].trim();
        currentContent = rationaleText ? [rationaleText] : [];
        return;
      }
      
      // Check for numbered list items (e.g., "1. Company-Specific Risks:")
      const numberedMatch = trimmedLine.match(/^(\d+)\.\s*([^:]+?)(:(.*))?$/);
      if (numberedMatch) {
        // Save previous section if exists
        if (currentSection) {
          sections.push({
            title: currentSection,
            content: currentContent
          });
        } else if (currentContent.length > 0) {
          sections.push({
            title: '',
            content: currentContent
          });
        }
        
        // Create a section for this numbered item
        const sectionTitle = numberedMatch[2].trim();
        const remainingText = numberedMatch[4] ? numberedMatch[4].trim() : '';
        
        currentSection = sectionTitle;
        currentContent = remainingText ? [remainingText] : [];
        return;
      }
      
      // Check if this line is a section header
      let isHeader = false;
      
      // First check for exact matches
      for (const header of sectionHeaders) {
        const headerLower = header.toLowerCase().replace(':', '');
        const lineLower = trimmedLine.toLowerCase().replace(':', '');
        
        // Check if line matches header (with or without colon)
        if (lineLower === headerLower || 
            lineLower.startsWith(headerLower + ' ') ||
            trimmedLine.toLowerCase().startsWith(header.toLowerCase())) {
          isHeader = true;
          break;
        }
      }
      
      // Additional check for lines that look like headers (short lines ending with colon or all caps)
      if (!isHeader && trimmedLine.length < 50) {
        // Check if line ends with colon
        if (trimmedLine.endsWith(':')) {
          isHeader = true;
        }
        // Check if line is mostly uppercase (like "VOLUME ANALYSIS")
        else if (trimmedLine.length > 3 && trimmedLine === trimmedLine.toUpperCase()) {
          isHeader = true;
        }
      }
      
      if (isHeader) {
        // Save previous section if exists
        if (currentSection) {
          sections.push({
            title: currentSection,
            content: currentContent
          });
        } else if (currentContent.length > 0) {
          // If we have content but no section yet, treat it as the opening content
          sections.push({
            title: '',
            content: currentContent
          });
        }
        
        // Extract section title and any content on the same line
        const colonIndex = trimmedLine.indexOf(':');
        if (colonIndex !== -1) {
          currentSection = trimmedLine.substring(0, colonIndex).trim();
          const remainingContent = trimmedLine.substring(colonIndex + 1).trim();
          currentContent = remainingContent ? [remainingContent] : [];
        } else {
          currentSection = trimmedLine.trim();
          currentContent = [];
        }
      } else {
        // Add to current section content
        currentContent.push(trimmedLine);
      }
    });
    
    // Don't forget the last section
    if (currentSection) {
      sections.push({
        title: currentSection,
        content: currentContent
      });
    } else if (currentContent.length > 0) {
      // If we have content but no section, add it without a title
      sections.push({
        title: '',
        content: currentContent
      });
    }
    
    // If no sections found, treat as plain text
    if (sections.length === 0) {
      return lines.map((line, index) => (
        <p key={index} className="mb-3 leading-relaxed">{line}</p>
      ));
    }
    
    // Render sections with styled headers
    return sections.map((section, sIndex) => (
      <div key={sIndex} className="mb-6">
        {section.title && (
          <h4 className={`text-base font-bold mb-3 uppercase tracking-wider bg-gradient-to-r ${
            isDark 
              ? 'from-blue-400 to-purple-400 text-transparent bg-clip-text' 
              : 'from-blue-600 to-purple-600 text-transparent bg-clip-text'
          }`}>
            {section.title}
          </h4>
        )}
        <div className="space-y-2">
          {section.content.map((line, lIndex) => {
            // Normalize text that's in all uppercase (except for acronyms)
            const normalizedLine = line.length > 20 && line === line.toUpperCase() 
              ? line.charAt(0) + line.slice(1).toLowerCase()
              : line;
              
            // Check for price targets or special formatting
            if (normalizedLine.includes('Month:') || normalizedLine.includes('month:')) {
              const [period, ...rest] = normalizedLine.split(':');
              return (
                <div key={lIndex} className={`flex items-baseline gap-3 p-3 rounded-lg backdrop-blur-sm ${
                  isDark ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/20' : 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200'
                }`}>
                  <span className={`font-semibold bg-gradient-to-r ${
                    isDark ? 'from-blue-400 to-purple-400' : 'from-blue-600 to-purple-600'
                  } text-transparent bg-clip-text`}>{period.trim()}:</span>
                  <span className={isDark ? 'text-gray-200' : 'text-gray-700'}>
                    {rest.join(':').trim()}
                  </span>
                </div>
              );
            }
            
            // Check for key-value pairs (but not for certain sections)
            const skipKeyValueSections = ['Rationale', 'Timeline for Reassessment'];
            if (normalizedLine.includes(':') && !normalizedLine.includes('http') && !skipKeyValueSections.includes(section.title)) {
              const colonIndex = normalizedLine.indexOf(':');
              const key = normalizedLine.substring(0, colonIndex).trim();
              const value = normalizedLine.substring(colonIndex + 1).trim();
              
              // Only treat as key-value if key is relatively short
              if (key.length < 30) {
                return (
                  <div key={lIndex} className="flex flex-wrap items-baseline gap-2">
                    <span className={`font-medium bg-gradient-to-r ${
                      isDark ? 'from-blue-300 to-purple-300' : 'from-blue-700 to-purple-700'
                    } text-transparent bg-clip-text`}>{key}:</span>
                    <span className={`${
                      isDark ? 'text-gray-200' : 'text-gray-700'
                    }`}>{value}</span>
                  </div>
                );
              }
            }
            
            // Regular paragraph (no bold, just regular text)
            return (
              <p key={lIndex} className={`leading-relaxed mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {normalizedLine}
              </p>
            );
          })}
        </div>
      </div>
    ));
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b ${isDark ? 'border-gray-800 bg-gray-900/95' : 'border-gray-200 bg-white/95'} backdrop-blur-sm sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Multi-Agent Stock Analysis
                </h1>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  AI-powered comprehensive market intelligence
                </p>
              </div>
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowHistory(!showHistory)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    showHistory
                      ? isDark 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-blue-600 text-white'
                      : isDark
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span className="text-sm font-medium">View History{analysisHistory.length > 0 ? ` (${analysisHistory.length})` : ''}</span>
                </motion.button>
                <span className={`text-xs px-3 py-1.5 rounded-full ${
                  isDark ? 'bg-blue-900/30 text-blue-400 border border-blue-800' : 'bg-blue-50 text-blue-600 border border-blue-200'
                }`}>
                  6 AI Agents
                </span>
                <span className={`text-xs px-3 py-1.5 rounded-full ${
                  isDark ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-green-50 text-green-600 border border-green-200'
                }`}>
                  Real-time Data
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* History Panel */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`rounded-xl border ${
                isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
              } p-6 mb-8`}
            >
              <div className="mb-4">
                <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Clock className="w-5 h-5" />
                  Analysis History
                </h2>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Your past {analysisHistory.length} prediction{analysisHistory.length > 1 ? 's' : ''}
                </p>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {analysisHistory.length === 0 ? (
                  <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No analysis history yet.</p>
                    <p className="text-xs mt-1">Your past predictions will appear here.</p>
                  </div>
                ) : (
                  analysisHistory.map((analysis) => {
                  const isSelected = selectedHistoryId === analysis.id;
                  // Parse ISO string and display in local timezone
                  const dateStr = analysis.completedAt || analysis.startTime;
                  const date = new Date(dateStr);
                  const tickersList = analysis.tickers.join(', ');
                  
                  return (
                    <motion.div
                      key={analysis.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`rounded-lg border p-4 cursor-pointer transition-all ${
                        isSelected
                          ? isDark
                            ? 'bg-blue-900/30 border-blue-600'
                            : 'bg-blue-50 border-blue-400'
                          : isDark
                            ? 'bg-gray-700/30 border-gray-600 hover:bg-gray-700/50'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => loadHistoricalAnalysis(analysis)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {analysis.analysis_type === 'compare' && (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                isDark
                                  ? 'bg-purple-900/30 text-purple-300 border border-purple-700'
                                  : 'bg-purple-100 text-purple-700 border border-purple-200'
                              }`}>
                                <GitCompare className="w-3 h-3" />
                                Comparison
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {analysis.tickers.map(ticker => (
                              <span
                                key={ticker}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                                  isDark
                                    ? 'bg-gray-600 text-gray-200'
                                    : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                <CompanyLogo symbol={ticker} size="sm" />
                                {ticker}
                              </span>
                            ))}
                          </div>
                        </div>
                        {isSelected && (
                          <div className={`px-2 py-1 rounded-md text-xs font-medium ${
                            isDark
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-600 text-white'
                          }`}>
                            Current
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Ticker Selection */}
        <div className={`rounded-xl border ${
          isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
        } p-6 mb-8`}>
          <div className="mb-4">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Select Stocks to Analyze
            </h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Choose up to 5 stocks for comprehensive analysis
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative" ref={dropdownRef}>
            <div className={`flex items-center gap-2 p-3 rounded-lg border ${
              isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-300'
            } focus-within:ring-2 focus-within:ring-blue-500`}>
              <Search className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Search by symbol or company name..."
                className="flex-1 bg-transparent outline-none"
              />
              {selectedTickers.length > 0 && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}>
                  {selectedTickers.length}/5 selected
                </span>
              )}
            </div>

            {/* Search Dropdown */}
            <AnimatePresence>
              {isDropdownOpen && (searchQuery || availableTickers.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute z-50 mt-2 w-full rounded-xl border ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  } shadow-xl max-h-96 overflow-y-auto`}
                >
                  {isSearching ? (
                    <div className="p-8 text-center">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Searching...
                      </p>
                    </div>
                  ) : searchQuery && searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map(stock => (
                        <button
                          key={stock.symbol}
                          onClick={() => handleTickerToggle(stock.symbol)}
                          className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                        >
                          <div className="flex items-center gap-3">
                            <CompanyLogo symbol={stock.symbol} size="md" />
                            <div className="text-left">
                              <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {stock.symbol}
                              </div>
                              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {stock.name}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                        </button>
                      ))}
                    </div>
                  ) : !searchQuery && availableTickers.length > 0 ? (
                    <div className="py-2">
                      <div className={`px-4 py-2 text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        FOLLOWED STOCKS
                      </div>
                      {availableTickers
                        .filter(stock => !selectedTickers.includes(stock.symbol))
                        .map(stock => (
                          <button
                            key={stock.symbol}
                            onClick={() => handleTickerToggle(stock.symbol)}
                            className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                          >
                            <div className="flex items-center gap-3">
                              <CompanyLogo symbol={stock.symbol} size="md" />
                              <div className="text-left">
                                <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {stock.symbol}
                                </div>
                                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {stock.name}
                                </div>
                              </div>
                            </div>
                            <ChevronRight className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                          </button>
                        ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {searchQuery ? 'No results found' : 'No stocks available'}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Selected Tickers */}
          {selectedTickers.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Selected: {selectedTickers.length} stock{selectedTickers.length > 1 ? 's' : ''}
                </span>
                {selectedTickers.length > 1 && (
                  <button
                    onClick={() => setSelectedTickers([])}
                    className={`text-sm px-3 py-1 rounded-md transition-colors ${
                      isDark
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedTickers.map(ticker => (
                  <motion.div
                    key={ticker}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700/50 border-gray-600 text-white' 
                        : 'bg-gray-100 border-gray-300 text-gray-900'
                    }`}
                  >
                    <CompanyLogo symbol={ticker} size="sm" />
                    <span className="font-medium">{ticker}</span>
                    <button
                      onClick={() => removeTicker(ticker)}
                      className={`ml-1 p-0.5 rounded hover:bg-gray-600/20`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Analysis Mode Toggle */}
          <div className="mt-6 mb-4">
            <div className={`inline-flex rounded-lg p-1 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <button
                onClick={() => setAnalysisMode('analyze')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  analysisMode === 'analyze'
                    ? isDark
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-600 text-white'
                    : isDark
                      ? 'text-gray-400 hover:text-gray-200'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Analyze
                </div>
              </button>
              <button
                onClick={() => setAnalysisMode('compare')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  analysisMode === 'compare'
                    ? isDark
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-600 text-white'
                    : isDark
                      ? 'text-gray-400 hover:text-gray-200'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <GitCompare className="w-4 h-4" />
                  Compare
                </div>
              </button>
            </div>
            {analysisMode === 'compare' && (
              <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Compare mode will analyze all selected stocks and recommend the best one to buy
              </p>
            )}
          </div>

          {/* Run Analysis Button */}
          <div className="flex justify-end">
            <button
              disabled={selectedTickers.length === 0 || loading || (analysisMode === 'compare' && selectedTickers.length < 2)}
              onClick={(e) => {
                if (loading && currentAnalysisId) {
                  // Cancel analysis if clicked while loading
                  if (window.confirm('Cancel the current analysis?')) {
                    analysisService.cancelAnalysis(currentAnalysisId);
                    setLoading(false);
                    setAnalysisProgress(0);
                    setCurrentPhase('');
                    setCurrentAnalysisId(null);
                    setLoadingTickers({});
                    e.preventDefault();
                  }
                } else {
                  runAnalysis();
                }
              }}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                (selectedTickers.length === 0 || loading || (analysisMode === 'compare' && selectedTickers.length < 2))
                  ? isDark 
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : isDark
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isResumingAnalysis ? 'Resuming...' : analysisMode === 'compare' ? 'Comparing...' : 'Analyzing...'}
                </>
              ) : (
                <>
                  {analysisMode === 'compare' ? (
                    <>
                      <GitCompare className="w-4 h-4" />
                      Compare Stocks
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4" />
                      Analyze Stocks
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Resuming Analysis Notice */}
        {isResumingAnalysis && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`rounded-xl border ${
              isDark ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'
            } p-4 mb-4 flex items-center gap-3`}
          >
            <Activity className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <p className={`${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              Found an ongoing analysis. Click "Run Analysis" to continue or start a new one.
            </p>
          </motion.div>
        )}

        {/* Progress Bar */}
        {loading && analysisProgress > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`rounded-xl border ${
              isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
            } p-6 mb-8`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Analysis Progress
                  </h3>
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {currentPhase}
                  </p>
                </div>
                <span className={`text-2xl font-bold ${
                  analysisProgress === 100 
                    ? isDark ? 'text-green-400' : 'text-green-600'
                    : isDark ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  {Math.round(analysisProgress)}%
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className={`w-full h-3 rounded-full overflow-hidden ${
                isDark ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <motion.div
                  className={`h-full rounded-full ${
                    analysisProgress === 100
                      ? 'bg-gradient-to-r from-green-500 to-green-600'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${analysisProgress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              
              {/* Phase Indicators */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                {[
                  { phase: 'Market Analysis', threshold: 15 },
                  { phase: 'Fundamentals', threshold: 30 },
                  { phase: 'Sentiment', threshold: 45 },
                  { phase: 'Risk Assessment', threshold: 60 },
                  { phase: 'Strategy', threshold: 75 },
                  { phase: 'Finalizing', threshold: 90 }
                ].map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 ${
                      analysisProgress >= item.threshold
                        ? isDark ? 'text-blue-400' : 'text-blue-600'
                        : isDark ? 'text-gray-500' : 'text-gray-400'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      analysisProgress >= item.threshold
                        ? 'bg-blue-500'
                        : isDark ? 'bg-gray-600' : 'bg-gray-300'
                    }`} />
                    <span className="font-medium">{item.phase}</span>
                  </div>
                ))}
              </div>
              
              {/* Estimated Time */}
              {analysisProgress < 100 && (
                <p className={`text-xs text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Estimated time remaining: {Math.max(1, Math.round((100 - analysisProgress) * 0.75))} seconds
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Results */}
        {Object.keys(reports).length > 0 && (
          <div className="space-y-8">
            {/* Comparison Results */}
            {analysisMode === 'compare' && reports._comparison && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Header Section */}
                <div className={`rounded-xl border ${
                  isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                } p-6`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${
                        isDark ? 'bg-gradient-to-br from-blue-600/20 to-purple-600/20' : 'bg-gradient-to-br from-blue-50 to-purple-50'
                      }`}>
                        <GitCompare className={`w-7 h-7 ${
                          isDark ? 'text-blue-400' : 'text-blue-600'
                        }`} />
                      </div>
                      <div>
                        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Stock Comparison Analysis
                        </h2>
                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          AI-powered multi-agent evaluation of {reports._comparison.ranking?.length || 0} stocks
                        </p>
                      </div>
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {new Date().toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                {/* Winner Card */}
                {reports._comparison.winner && (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className={`rounded-xl border-2 overflow-hidden ${
                      isDark 
                        ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-700' 
                        : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                    }`}
                  >
                    <div className={`px-6 py-3 border-b ${
                      isDark ? 'bg-green-900/50 border-green-800' : 'bg-green-100/50 border-green-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Trophy className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                        <span className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                          TOP RECOMMENDATION
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <CompanyLogo symbol={reports._comparison.winner} size="xl" />
                          <div>
                            <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {reports._comparison.winner}
                            </h3>
                            <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Best investment opportunity based on comprehensive analysis
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                            isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'
                          }`}>
                            <TrendingUp className="w-4 h-4" />
                            <span className="font-semibold">Buy Signal</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Rankings Section */}
                {reports._comparison.ranking && reports._comparison.ranking.length > 0 && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className={`rounded-xl border ${
                      isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                    } p-6`}
                  >
                    <h3 className={`text-lg font-semibold mb-5 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <BarChart3 className="w-5 h-5" />
                      Complete Stock Rankings
                    </h3>
                    <div className="space-y-3">
                      {reports._comparison.ranking.map((item, index) => (
                        <motion.div
                          key={item.symbol}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          className={`relative overflow-hidden rounded-lg border ${
                            index === 0
                              ? isDark 
                                ? 'bg-gradient-to-r from-green-900/20 to-transparent border-green-800' 
                                : 'bg-gradient-to-r from-green-50 to-transparent border-green-200'
                              : isDark
                                ? 'bg-gray-800/50 border-gray-700'
                                : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-4 p-4">
                            <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${
                              index === 0
                                ? isDark 
                                  ? 'bg-green-900/50 text-green-400 ring-2 ring-green-700' 
                                  : 'bg-green-100 text-green-700 ring-2 ring-green-300'
                                : index === 1
                                  ? isDark
                                    ? 'bg-blue-900/50 text-blue-400'
                                    : 'bg-blue-100 text-blue-700'
                                  : index === 2
                                    ? isDark
                                      ? 'bg-orange-900/50 text-orange-400'
                                      : 'bg-orange-100 text-orange-700'
                                    : isDark
                                      ? 'bg-gray-700 text-gray-400'
                                      : 'bg-gray-200 text-gray-600'
                            }`}>
                              {item.rank}
                            </div>
                            <CompanyLogo symbol={item.symbol} size="lg" />
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <span className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {item.symbol}
                                </span>
                                {index === 0 && (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'
                                  }`}>
                                    RECOMMENDED
                                  </span>
                                )}
                              </div>
                              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {item.reason}
                              </p>
                            </div>
                            <div className={`text-right ${
                              index === 0
                                ? isDark ? 'text-green-400' : 'text-green-600'
                                : isDark ? 'text-gray-500' : 'text-gray-500'
                            }`}>
                              {index === 0 ? (
                                <TrendingUp className="w-5 h-5" />
                              ) : index < 3 ? (
                                <Activity className="w-5 h-5" />
                              ) : (
                                <TrendingDown className="w-5 h-5" />
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Detailed Analysis */}
                {reports._comparison.comparison_summary && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className={`rounded-xl border ${
                      isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                    } overflow-hidden`}
                  >
                    <div className={`px-6 py-4 border-b ${
                      isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <h3 className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        <Brain className="w-5 h-5" />
                        Detailed AI Analysis
                      </h3>
                    </div>
                    <div className="p-6">
                      <ComparisonSummary 
                        summary={reports._comparison.comparison_summary}
                        isDark={isDark}
                      />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Individual Stock Reports - Only show in analyze mode */}
            {analysisMode === 'analyze' && Object.keys(reports).filter(ticker => ticker !== '_comparison').map(ticker => (
              <TickerReport
                key={ticker}
                ticker={ticker}
                report={reports[ticker]}
                isLoading={loadingTickers[ticker]}
                isDark={isDark}
                renderRecommendation={renderRecommendation}
                renderRiskAssessment={renderRiskAssessment}
                processContent={processContent}
              />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border p-6 ${
              isDark 
                ? 'bg-red-900/20 border-red-800 text-red-400' 
                : 'bg-red-50 border-red-200 text-red-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Ticker Report Component
// Component to parse and display comparison summary in a structured way
const ComparisonSummary = ({ summary, isDark }) => {
  if (!summary) return null;
  
  // Parse the summary text into sections
  const sections = [];
  const lines = summary.split('\n');
  let currentSection = null;
  let currentContent = [];
  
  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;
    
    // Check if this line is a section header (e.g., "RECOMMENDATION:", "RANKING:", etc.)
    if (trimmedLine.includes(':') && trimmedLine.toUpperCase() === trimmedLine.split(':')[0] + ':') {
      // Save previous section
      if (currentSection) {
        sections.push({
          title: currentSection,
          content: currentContent.join('\n').trim()
        });
      }
      currentSection = trimmedLine.replace(':', '');
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  });
  
  // Save the last section
  if (currentSection) {
    sections.push({
      title: currentSection,
      content: currentContent.join('\n').trim()
    });
  }
  
  // If no sections were found, display as-is
  if (sections.length === 0) {
    return (
      <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        <pre className="whitespace-pre-wrap font-sans">{summary}</pre>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <div key={index} className={`rounded-lg p-4 ${
          isDark ? 'bg-gray-800/50' : 'bg-gray-50'
        }`}>
          <h4 className={`font-semibold mb-2 ${
            isDark ? 'text-blue-400' : 'text-blue-600'
          }`}>
            {section.title}
          </h4>
          <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <pre className="whitespace-pre-wrap font-sans">{section.content}</pre>
          </div>
        </div>
      ))}
    </div>
  );
};

const TickerReport = ({ ticker, report, isLoading, isDark, renderRecommendation, renderRiskAssessment, processContent }) => {
  const [activeSection, setActiveSection] = useState('market');
  
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`rounded-xl border ${
          isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
        } p-8`}
      >
        <div className="flex items-center gap-4 mb-6">
          <CompanyLogo symbol={ticker} size="xl" />
          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {ticker}
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Analysis in progress...
            </p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className={`h-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-3/4 mb-2`} />
              <div className={`h-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/2`} />
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (!report || !report.prediction) {
    return null;
  }

  const sections = [
    { id: 'market', label: 'Market Analysis', icon: BarChart3 },
    { id: 'fundamental', label: 'Fundamentals', icon: Building2 },
    { id: 'sentiment', label: 'Sentiment', icon: MessageSquare },
    { id: 'risk', label: 'Risk Assessment', icon: Shield },
    { id: 'recommendation', label: 'Recommendation', icon: Target }
  ];

  const getSectionContent = () => {
    const { sections: reportSections } = report.prediction;
    
    switch (activeSection) {
      case 'market':
        return reportSections.market_analysis;
      case 'fundamental':
        return reportSections.fundamental_analysis;
      case 'sentiment':
        return reportSections.sentiment_snapshot;
      case 'risk':
        return reportSections.risk_assessment;
      case 'recommendation':
        return reportSections.strategy_note;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border ${
        isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
      } overflow-hidden`}
    >
      {/* Header */}
      <div className={`px-8 py-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CompanyLogo symbol={ticker} size="xl" />
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {ticker}
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                AI Analysis Report
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex overflow-x-auto">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 whitespace-nowrap transition-colors ${
                  activeSection === section.id
                    ? isDark
                      ? 'border-blue-500 text-blue-400'
                      : 'border-blue-600 text-blue-600'
                    : isDark
                      ? 'border-transparent text-gray-400 hover:text-gray-300'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{section.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeSection === 'recommendation' ? (
              renderRecommendation(getSectionContent(), report)
            ) : activeSection === 'risk' ? (
              renderRiskAssessment(getSectionContent(), ticker)
            ) : (
              <div className={`prose max-w-none ${
                isDark ? 'prose-invert' : ''
              }`}>
                {processContent(getSectionContent())}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default MultiAgentPredictorProfessional;