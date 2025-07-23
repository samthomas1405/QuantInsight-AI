import React, { useEffect, useState } from 'react';
import { getReports, testPredictionEndpoints } from '../api/news';

const NewsFeed = () => {
  const [reports, setReports] = useState({});
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [progress, setProgress] = useState(0);
  const [analysisStarted, setAnalysisStarted] = useState(false);

  const fetchReports = async () => {
    setAnalysisStarted(true);
    const token = localStorage.getItem('token');

    if (!token) {
        setError("Please log in to view financial reports.");
        setLoading(false);
        return;
    }

    try {
        setLoading(true);
        setProgress(25);

        const res = await getReports(token);
        setProgress(75);

        if (res && res.reports && typeof res.reports === 'object' && Object.keys(res.reports).length > 0) {
        setReports(res.reports);
        const tickers = Object.keys(res.reports);
        if (tickers.length > 0) {
            setSelectedTicker(tickers[0]);
        }
        if (res.summary) {
            setSummary(res.summary);
        }
        setProgress(100);
        } else {
        console.error('Invalid response structure:', res);
        setError("No stock reports available. Make sure you have stocks in your watchlist.");
        }
    } catch (err) {
        console.error('Error fetching reports:', err);
        let errorMessage = "Failed to fetch reports.";
        if (err.status === 'NETWORK_ERROR') {
        errorMessage = "Network error. Try again later.";
        } else if (err.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
        } else if (err.message) {
        errorMessage = err.message;
        }
        setError(errorMessage);
    } finally {
        setLoading(false);
        setProgress(0);
    }
  };


  const handleSelect = (e) => {
    setSelectedTicker(e.target.value);
  };

  const retryFetch = () => {
    setError(null);
    setReports({});
    setSelectedTicker(null);
    window.location.reload(); // Simple retry
  };

  const testEndpoints = async () => {
    const token = localStorage.getItem('token');
    try {
      const results = await testPredictionEndpoints(token);
      console.log('Test Results:', results);
      alert('Test results logged to console');
    } catch (err) {
      console.error('Test failed:', err);
      alert('Test failed - check console');
    }
  };
  if (!analysisStarted) {
    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>🧠 Run AI Stock Analysis</h2>
        <p>Click below to begin multi-agent analysis for your followed stocks.</p>
        <button 
            onClick={fetchReports}
            style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1.1em',
            cursor: 'pointer'
            }}
        >
            🚀 Run Analysis
        </button>
        </div>
    );
  }


  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>🧠 AI Stock Analysis in Progress</h2>
        <div style={{ 
          width: '100%', 
          backgroundColor: '#f0f0f0', 
          borderRadius: '10px', 
          marginBottom: '1rem' 
        }}>
          <div style={{
            width: `${progress}%`,
            height: '10px',
            backgroundColor: '#4CAF50',
            borderRadius: '10px',
            transition: 'width 0.3s ease'
          }}></div>
        </div>
        <p>🔄 Our AI agents are analyzing market data, news sentiment, and technical indicators...</p>
        <p style={{ color: '#666', fontSize: '0.9em' }}>This may take 1-2 minutes for comprehensive analysis</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>⚠️ Analysis Error</h2>
        <p style={{ color: '#d32f2f', marginBottom: '1rem' }}>{error}</p>
        <div>
          <button 
            onClick={retryFetch}
            style={{
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            🔄 Retry Analysis
          </button>
          <button 
            onClick={testEndpoints}
            style={{
              backgroundColor: '#ff9800',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🔧 Test System
          </button>
        </div>
      </div>
    );
  }

  const formatAnalysisKey = (key) => {
    return key.replace(/_/g, ' ')
             .replace(/\b\w/g, l => l.toUpperCase())
             .replace('Analysis', 'Analysis 📊')
             .replace('Strategy', 'Strategy 🎯')
             .replace('Assessment', 'Assessment ⚠️');
  };

  const getAnalysisIcon = (key) => {
    const icons = {
      'market_analysis': '📈',
      'fundamental_analysis': '💰',
      'sentiment_analysis': '📰',
      'risk_assessment': '⚠️',
      'investment_strategy': '🎯',
      'comprehensive_analysis': '🧠'
    };
    return icons[key] || '📋';
  };

  const getStatusColor = (status) => {
    const colors = {
      'success': '#4CAF50',
      'fallback': '#FF9800',
      'error': '#F44336',
      'timeout': '#9C27B0'
    };
    return colors[status] || '#757575';
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '2rem',
        borderRadius: '15px',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: '0 0 1rem 0', fontSize: '2.5em' }}>🧠 AI Stock Intelligence</h1>
        <p style={{ margin: 0, fontSize: '1.2em', opacity: 0.9 }}>
          Multi-Agent Analysis • Powered by Gemini AI
        </p>
      </div>

      {summary && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '1rem',
          borderRadius: '10px',
          marginBottom: '2rem',
          border: '1px solid #e9ecef'
        }}>
          <h3>📊 Analysis Summary</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <div><strong>Stocks Analyzed:</strong> {summary.total_tickers}</div>
            <div><strong>Success Rate:</strong> {summary.success_rate}</div>
            <div><strong>Model:</strong> {summary.model}</div>
            <div><strong>Completed:</strong> {new Date(summary.timestamp).toLocaleString()}</div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <label htmlFor="ticker-select" style={{ fontSize: '1.1em', fontWeight: 'bold' }}>
          📈 Select Stock for Detailed Analysis:
        </label>
        <select
          id="ticker-select"
          onChange={handleSelect}
          value={selectedTicker || ''}
          style={{ 
            marginLeft: '10px', 
            padding: '8px 12px',
            fontSize: '1em',
            borderRadius: '5px',
            border: '2px solid #ddd'
          }}
        >
          {Object.keys(reports).map((ticker) => (
            <option key={ticker} value={ticker}>
              {ticker} - {reports[ticker]?.status === 'success' ? '✅' : 
                        reports[ticker]?.status === 'fallback' ? '⚠️' : '❌'}
            </option>
          ))}
        </select>
      </div>

      {selectedTicker && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '15px',
          border: '1px solid #e9ecef',
          overflow: 'hidden',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            background: `linear-gradient(135deg, ${getStatusColor(reports[selectedTicker]?.status)} 0%, ${getStatusColor(reports[selectedTicker]?.status)}dd 100%)`,
            color: 'white',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <h2 style={{ margin: '0 0 0.5rem 0' }}>
              📈 {selectedTicker} Analysis Report
            </h2>
            <div style={{ 
              backgroundColor: 'rgba(255,255,255,0.2)', 
              display: 'inline-block', 
              padding: '5px 15px', 
              borderRadius: '20px',
              fontSize: '0.9em'
            }}>
              Status: {reports[selectedTicker]?.status?.toUpperCase()}
            </div>
          </div>

          <div style={{ padding: '2rem' }}>
            {reports[selectedTicker]?.status === 'success' || reports[selectedTicker]?.status === 'fallback' ? (
              <div>
                {Object.entries(reports[selectedTicker].prediction || {}).map(([key, value]) => {
                  // Skip metadata fields
                  if (['ticker', 'timestamp', 'agents_used', 'analysis_type', 'model'].includes(key)) {
                    return null;
                  }

                  return (
                    <div key={key} style={{ 
                      marginBottom: '2rem',
                      padding: '1.5rem',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '10px',
                      borderLeft: '4px solid #667eea'
                    }}>
                      <h3 style={{ 
                        color: '#333',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span style={{ fontSize: '1.5em' }}>{getAnalysisIcon(key)}</span>
                        {formatAnalysisKey(key)}
                      </h3>
                      <div style={{ 
                        lineHeight: '1.6',
                        color: '#444',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                      </div>
                    </div>
                  );
                })}

                {reports[selectedTicker].prediction?.timestamp && (
                  <div style={{ 
                    textAlign: 'center',
                    color: '#666',
                    fontSize: '0.9em',
                    marginTop: '2rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid #eee'
                  }}>
                    🕒 Analysis completed: {new Date(reports[selectedTicker].prediction.timestamp).toLocaleString()}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '3em', marginBottom: '1rem' }}>
                  {reports[selectedTicker]?.status === 'timeout' ? '⏱️' : '❌'}
                </div>
                <h3>Analysis Unavailable</h3>
                <p>Report for {selectedTicker} could not be generated.</p>
                {reports[selectedTicker]?.error && (
                  <p style={{ color: '#d32f2f', fontSize: '0.9em' }}>
                    {reports[selectedTicker].error}
                  </p>
                )}
                <button 
                  onClick={retryFetch}
                  style={{
                    backgroundColor: '#1976d2',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginTop: '1rem'
                  }}
                >
                  🔄 Retry Analysis
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsFeed;