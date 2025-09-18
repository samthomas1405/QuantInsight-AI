import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Landing from './pages/Landing';
import Login from './components/Login';
import Register from './components/Register';
import VerifyEmail from './components/VerifyEmail';
import Dashboard from './pages/Dashboard';
import StockSelection from './pages/StockSelection';
import UIPreview from './components/UIPreview';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// App Routes Component
function AppRoutes() {
  const { token } = useAuth();
  const [legacyToken, setLegacyToken] = React.useState(token);
  
  return (
    <Routes>
      {/* Public Routes - Always accessible */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login setToken={setLegacyToken} />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/ui-preview" element={<UIPreview />} />

      {/* Protected Routes - Only accessible when authenticated */}
      <Route path="/dashboard/*" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/select-stocks" element={
        <ProtectedRoute>
          <StockSelection />
        </ProtectedRoute>
      } />

      {/* Catch-All - Redirect to landing page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;

