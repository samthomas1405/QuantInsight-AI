/* eslint-disable no-restricted-globals */
// Web Worker for Multi-Agent Analysis
// This worker handles the analysis requests in the background

self.addEventListener('message', async (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'START_ANALYSIS':
      await runAnalysis(data);
      break;
    case 'CHECK_STATUS':
      checkAnalysisStatus(data);
      break;
    case 'CANCEL_ANALYSIS':
      cancelAnalysis(data);
      break;
    default:
      self.postMessage({ type: 'ERROR', error: 'Unknown message type' });
  }
});

const activeAnalyses = new Map();

async function runAnalysis({ tickers, token, analysisId, mode = 'analyze' }) {
  // Store analysis state
  activeAnalyses.set(analysisId, {
    tickers,
    mode,
    status: 'running',
    startTime: Date.now(),
    progress: 0,
    results: {},
    errors: {},
    comparison: mode === 'compare' ? {} : null
  });

  // Send initial status
  self.postMessage({
    type: 'ANALYSIS_STARTED',
    analysisId,
    tickers
  });

  // Progress simulation
  const progressInterval = setInterval(() => {
    const analysis = activeAnalyses.get(analysisId);
    if (!analysis || analysis.status !== 'running') {
      clearInterval(progressInterval);
      return;
    }

    const elapsed = Date.now() - analysis.startTime;
    const progress = Math.min(95, (elapsed / 80000) * 95); // 80 seconds to reach 95%
    
    analysis.progress = progress;
    
    // Determine phase based on progress
    let phase = 'Initializing analysis...';
    if (progress < 15) phase = 'Initializing AI agents...';
    else if (progress < 30) phase = 'Analyzing market data...';
    else if (progress < 45) phase = 'Evaluating fundamentals...';
    else if (progress < 60) phase = 'Processing sentiment signals...';
    else if (progress < 75) phase = 'Assessing risk factors...';
    else if (progress < 90) phase = 'Synthesizing recommendations...';
    else phase = 'Finalizing analysis...';

    self.postMessage({
      type: 'ANALYSIS_PROGRESS',
      analysisId,
      progress,
      phase
    });
  }, 1000);

  try {
    const analysis = activeAnalyses.get(analysisId);
    
    if (mode === 'compare') {
      // For comparison mode, send all tickers at once
      const url = new URL('http://localhost:8000/news/comparison/compare');
      
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tickers }),
        mode: 'cors',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (analysis) {
        // Store individual analyses
        if (data.analyses) {
          Object.entries(data.analyses).forEach(([ticker, report]) => {
            analysis.results[ticker] = normalizeReportData(report);
            self.postMessage({
              type: 'TICKER_COMPLETED',
              analysisId,
              ticker,
              report: analysis.results[ticker]
            });
          });
        }
        
        // Store comparison result
        analysis.comparison = {
          recommendation: data.recommendation,
          comparison_summary: data.comparison_summary,
          ranking: data.ranking,
          winner: data.recommended_stock
        };
        
        self.postMessage({
          type: 'COMPARISON_COMPLETED',
          analysisId,
          comparison: analysis.comparison
        });
      }
    } else {
      // Original analyze mode - analyze each ticker separately
      const promises = tickers.map(async (ticker) => {
        try {
          const url = new URL('http://localhost:8000/news/custom-summary');
          url.searchParams.append('tickers', ticker);
          
          const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            mode: 'cors',
            credentials: 'include'
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          const reportData = data.reports?.[ticker] || data;
          
          if (analysis) {
            analysis.results[ticker] = normalizeReportData(reportData);
            
            self.postMessage({
              type: 'TICKER_COMPLETED',
              analysisId,
              ticker,
              report: analysis.results[ticker]
            });
          }
        } catch (error) {
          console.error(`Error analyzing ${ticker}:`, error);
          if (analysis) {
            analysis.errors[ticker] = error.message;
            
            self.postMessage({
              type: 'TICKER_ERROR',
              analysisId,
              ticker,
              error: error.message
            });
          }
        }
      });

      await Promise.all(promises);
    }
    
    // Clear progress interval and set to 100%
    clearInterval(progressInterval);
    
    if (analysis) {
      analysis.progress = 100;
      analysis.status = 'completed';
      analysis.completedAt = Date.now();
      
      self.postMessage({
        type: 'ANALYSIS_COMPLETED',
        analysisId,
        results: analysis.results,
        errors: analysis.errors,
        progress: 100,
        phase: 'Analysis complete!'
      });
      
      // Clean up after 5 minutes
      setTimeout(() => {
        activeAnalyses.delete(analysisId);
      }, 5 * 60 * 1000);
    }
  } catch (error) {
    clearInterval(progressInterval);
    console.error('Analysis error:', error);
    
    const analysis = activeAnalyses.get(analysisId);
    if (analysis) {
      analysis.status = 'error';
      analysis.error = error.message;
      
      self.postMessage({
        type: 'ANALYSIS_ERROR',
        analysisId,
        error: error.message
      });
    }
  }
}

function checkAnalysisStatus({ analysisId }) {
  const analysis = activeAnalyses.get(analysisId);
  
  if (!analysis) {
    self.postMessage({
      type: 'STATUS_RESPONSE',
      analysisId,
      status: 'not_found'
    });
    return;
  }

  self.postMessage({
    type: 'STATUS_RESPONSE',
    analysisId,
    status: analysis.status,
    progress: analysis.progress,
    results: analysis.results,
    errors: analysis.errors,
    tickers: analysis.tickers
  });
}

function cancelAnalysis({ analysisId }) {
  const analysis = activeAnalyses.get(analysisId);
  
  if (analysis && analysis.status === 'running') {
    analysis.status = 'cancelled';
    activeAnalyses.delete(analysisId);
    
    self.postMessage({
      type: 'ANALYSIS_CANCELLED',
      analysisId
    });
  }
}

// Normalize report data helper (same as in component)
function normalizeReportData(report) {
  if (!report) return null;

  // Handle the new structure from backend
  if (report.prediction) {
    const pred = report.prediction;
    return {
      prediction: {
        sections: {
          market_analysis: pred.market_analysis || 'Technical analysis not available',
          fundamental_analysis: pred.fundamental_analysis || 'Fundamental analysis not available',
          sentiment_snapshot: pred.sentiment_analysis || pred.sentiment_snapshot || 'Sentiment analysis not available',
          risk_assessment: pred.risk_assessment || 'Risk assessment not available',
          strategy_note: pred.investment_strategy || pred.strategy_note || 'Investment strategy not available'
        },
        meta: {
          generated_at: pred.timestamp || new Date().toISOString(),
          model: pred.model || 'multi-agent',
          agents_used: pred.agents_used || []
        }
      }
    };
  }

  // Handle different report structures
  if (report.sections) {
    return {
      ...report,
      prediction: { sections: report.sections }
    };
  }

  // Create a default structure
  return {
    prediction: {
      sections: {
        market_analysis: report.market_analysis || 'Analysis not available',
        fundamental_analysis: report.fundamental_analysis || '',
        sentiment_snapshot: report.sentiment_snapshot || '',
        risk_assessment: report.risk_assessment || [],
        strategy_note: report.strategy_note || []
      }
    }
  };
}