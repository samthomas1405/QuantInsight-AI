import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Landing from './pages/Landing';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './pages/Dashboard';
import StockSelection from './pages/StockSelection';
import UIPreview from './components/UIPreview';

function App() {
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for token in localStorage
    const storedToken = localStorage.getItem('token');
    setToken(storedToken);
    setIsLoading(false);
  }, []);

  const isAuthenticated = !!token;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Public Routes - Always accessible */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login setToken={setToken} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/ui-preview" element={<UIPreview />} />

          {/* Protected Routes - Only accessible when authenticated */}
          {isAuthenticated ? (
            <>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/select-stocks" element={<StockSelection />} />
            </>
          ) : (
            <>
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/select-stocks" element={<Navigate to="/" replace />} />
            </>
          )}

          {/* Catch-All - Redirect to landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;

