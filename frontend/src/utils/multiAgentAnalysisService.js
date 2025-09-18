// Service to manage multi-agent analysis using Web Workers
import { v4 as uuidv4 } from 'uuid';
import { saveAnalysisToDatabase, fetchAnalysisHistory } from '../api/analysisHistory';

class MultiAgentAnalysisService {
  constructor() {
    this.worker = null;
    this.activeAnalyses = new Map();
    this.listeners = new Map();
    this.initWorker();
    this.setupStorageSync();
    this.setupVisibilityHandling();
    this.setupUnloadHandling();
  }

  initWorker() {
    try {
      // Create worker using webpack's worker-loader syntax
      this.worker = new Worker(new URL('../workers/multiAgentAnalysis.worker.js', import.meta.url));
      
      this.worker.addEventListener('message', this.handleWorkerMessage.bind(this));
      this.worker.addEventListener('error', this.handleWorkerError.bind(this));
      
      // Restore any ongoing analyses from localStorage
      this.restoreAnalyses();
    } catch (error) {
      console.error('Failed to initialize web worker:', error);
    }
  }

  handleWorkerMessage(event) {
    const { type, analysisId, ...data } = event.data;
    
    // Update localStorage with latest state
    if (analysisId && this.activeAnalyses.has(analysisId)) {
      const analysis = this.activeAnalyses.get(analysisId);
      
      switch (type) {
        case 'ANALYSIS_STARTED':
          analysis.status = 'running';
          analysis.startTime = Date.now();
          break;
          
        case 'ANALYSIS_PROGRESS':
          analysis.progress = data.progress;
          analysis.phase = data.phase;
          break;
          
        case 'TICKER_COMPLETED':
          if (!analysis.results) analysis.results = {};
          analysis.results[data.ticker] = data.report;
          break;
          
        case 'TICKER_ERROR':
          if (!analysis.errors) analysis.errors = {};
          analysis.errors[data.ticker] = data.error;
          break;
          
        case 'COMPARISON_COMPLETED':
          analysis.comparison = data.comparison;
          break;
          
        case 'ANALYSIS_COMPLETED':
          analysis.status = 'completed';
          analysis.progress = 100;
          analysis.results = data.results;
          analysis.errors = data.errors;
          analysis.completedAt = Date.now();
          
          // Save to database
          this.saveToDatabase(analysis);
          
          // Don't remove completed analyses - they persist until new analysis or logout
          break;
          
        case 'ANALYSIS_ERROR':
          analysis.status = 'error';
          analysis.error = data.error;
          break;
          
        case 'ANALYSIS_CANCELLED':
          this.removeAnalysis(analysisId);
          break;
      }
      
      this.saveToStorage();
    }
    
    // Notify listeners
    const listeners = this.listeners.get(analysisId) || [];
    listeners.forEach(listener => listener(event.data));
  }

  handleWorkerError(error) {
    console.error('Worker error:', error);
  }

  startAnalysis(tickers, token, onUpdate, mode = 'analyze') {
    const analysisId = uuidv4();
    
    const analysis = {
      id: analysisId,
      tickers,
      mode, // 'analyze' or 'compare'
      status: 'pending',
      progress: 0,
      phase: mode === 'compare' ? 'Initializing comparison...' : 'Initializing...',
      startTime: Date.now(),
      results: {},
      errors: {},
      comparison: mode === 'compare' ? {} : null
    };
    
    this.activeAnalyses.set(analysisId, analysis);
    
    // Keep only the last 10 analyses to prevent storage bloat
    this.cleanupOldAnalyses();
    
    if (onUpdate) {
      this.addListener(analysisId, onUpdate);
    }
    
    // Save to storage immediately
    this.saveToStorage();
    
    // Send to worker
    this.worker.postMessage({
      type: 'START_ANALYSIS',
      data: { tickers, token, analysisId, mode }
    });
    
    return analysisId;
  }

  cancelAnalysis(analysisId) {
    if (this.activeAnalyses.has(analysisId)) {
      this.worker.postMessage({
        type: 'CANCEL_ANALYSIS',
        data: { analysisId }
      });
    }
  }

  getAnalysis(analysisId) {
    return this.activeAnalyses.get(analysisId);
  }

  getAllAnalyses() {
    return Array.from(this.activeAnalyses.values());
  }

  addListener(analysisId, callback) {
    if (!this.listeners.has(analysisId)) {
      this.listeners.set(analysisId, []);
    }
    this.listeners.get(analysisId).push(callback);
  }

  removeListener(analysisId, callback) {
    const listeners = this.listeners.get(analysisId);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
      if (listeners.length === 0) {
        this.listeners.delete(analysisId);
      }
    }
  }

  removeAnalysis(analysisId) {
    this.activeAnalyses.delete(analysisId);
    this.listeners.delete(analysisId);
    this.saveToStorage();
  }

  clearAllAnalyses() {
    // Cancel any running analyses
    this.activeAnalyses.forEach((analysis, id) => {
      if (analysis.status === 'running') {
        this.cancelAnalysis(id);
      }
    });
    
    // Clear all analyses
    this.activeAnalyses.clear();
    this.listeners.clear();
    localStorage.removeItem('multiAgentAnalyses');
  }

  getMostRecentCompletedAnalysis() {
    const analyses = Array.from(this.activeAnalyses.values());
    const completed = analyses.filter(a => a.status === 'completed');
    
    if (completed.length === 0) return null;
    
    // Sort by completion time (most recent first)
    completed.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
    return completed[0];
  }

  getAnalysisHistory() {
    const analyses = Array.from(this.activeAnalyses.values());
    // Return only completed analyses, sorted by most recent first
    return analyses
      .filter(a => a.status === 'completed')
      .sort((a, b) => (b.completedAt || b.startTime || 0) - (a.completedAt || a.startTime || 0));
  }

  cleanupOldAnalyses() {
    const analyses = Array.from(this.activeAnalyses.values());
    const completed = analyses.filter(a => a.status === 'completed');
    
    // Keep only the 10 most recent completed analyses
    if (completed.length > 10) {
      completed
        .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
        .slice(10)
        .forEach(analysis => {
          this.removeAnalysis(analysis.id);
        });
    }
    
    // Remove any running analyses older than 2 hours
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
    analyses
      .filter(a => a.status === 'running' && a.startTime < twoHoursAgo)
      .forEach(analysis => {
        this.removeAnalysis(analysis.id);
      });
  }

  // Storage management - Database based
  async saveToDatabase(analysis) {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const analysisData = {
        analysis_id: analysis.id,
        tickers: analysis.tickers,
        analysis_type: analysis.mode || 'analyze',
        results: analysis.results,
        status: analysis.status,
        startTime: analysis.startTime,
        completedAt: analysis.completedAt
      };
      
      await saveAnalysisToDatabase(analysisData, token);
    } catch (error) {
      console.error('Failed to save analysis to database:', error);
    }
  }
  
  async loadFromDatabase() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return [];
      
      const history = await fetchAnalysisHistory(token);
      return history;
    } catch (error) {
      console.error('Failed to load analysis history from database:', error);
      return [];
    }
  }
  
  // Temporary local storage for running analyses
  saveToStorage() {
    try {
      // Only save running analyses to localStorage
      const runningAnalyses = Array.from(this.activeAnalyses.entries())
        .filter(([id, analysis]) => analysis.status === 'running')
        .map(([id, analysis]) => ({ ...analysis, id }));
      
      if (runningAnalyses.length > 0) {
        localStorage.setItem('multiAgentRunningAnalyses', JSON.stringify(runningAnalyses));
      } else {
        localStorage.removeItem('multiAgentRunningAnalyses');
      }
    } catch (error) {
      console.error('Failed to save running analyses to storage:', error);
    }
  }

  restoreAnalyses() {
    try {
      // Only restore running analyses from localStorage
      const stored = localStorage.getItem('multiAgentRunningAnalyses');
      if (stored) {
        const analyses = JSON.parse(stored);
        analyses.forEach(analysis => {
          if (analysis.status === 'running') {
            this.activeAnalyses.set(analysis.id, analysis);
            // Request status update
            this.worker.postMessage({
              type: 'CHECK_STATUS',
              data: { analysisId: analysis.id }
            });
          }
        });
      }
    } catch (error) {
      console.error('Failed to restore analyses from storage:', error);
    }
  }

  // Cross-tab synchronization
  setupStorageSync() {
    window.addEventListener('storage', (event) => {
      if (event.key === 'multiAgentAnalyses' && event.newValue) {
        try {
          const analyses = JSON.parse(event.newValue);
          // Update our local state with changes from other tabs
          analyses.forEach(analysis => {
            if (!this.activeAnalyses.has(analysis.id)) {
              this.activeAnalyses.set(analysis.id, analysis);
            }
          });
        } catch (error) {
          console.error('Failed to sync analyses from storage:', error);
        }
      }
    });
  }

  // Page visibility handling
  setupVisibilityHandling() {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Page became visible, refresh analysis states
        this.activeAnalyses.forEach((analysis, id) => {
          if (analysis.status === 'running') {
            this.worker.postMessage({
              type: 'CHECK_STATUS',
              data: { analysisId: id }
            });
          }
        });
      }
    });
  }

  // Cleanup on page unload
  setupUnloadHandling() {
    window.addEventListener('beforeunload', () => {
      // Save current state
      this.saveToStorage();
    });
  }

  // Cleanup method
  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.activeAnalyses.clear();
    this.listeners.clear();
  }
}

// Create singleton instance
const analysisService = new MultiAgentAnalysisService();

export default analysisService;