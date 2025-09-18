import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, refreshToken as refreshTokenAPI } from '../api/auth';

const AuthContext = createContext({});

// Token expiry times
const WARNING_BEFORE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const navigate = useNavigate();

  // Parse JWT token to get expiry
  const getTokenExpiry = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000; // Convert to milliseconds
    } catch (error) {
      return null;
    }
  };

  // Check if token is expired
  const isTokenExpired = (token) => {
    const expiry = getTokenExpiry(token);
    return expiry ? Date.now() > expiry : true;
  };

  // Activity tracking
  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(Date.now());
    };

    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, []);

  // Load token from storage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('userEmail');
    
    if (storedToken && !isTokenExpired(storedToken)) {
      setToken(storedToken);
      setUser({ email: storedUser });
    } else {
      // Clear expired tokens
      localStorage.removeItem('token');
      localStorage.removeItem('userEmail');
    }
    
    setIsLoading(false);
  }, []);

  // Logout function
  const logout = useCallback((message = null) => {
    // Clear all storage
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('hasCompletedSetup');
    
    // Clear state
    setToken(null);
    setUser(null);
    setShowExpiryWarning(false);
    
    // Navigate to login with message
    navigate('/login', { state: { message } });
  }, [navigate]);

  // Session monitoring
  useEffect(() => {
    if (!token) return;

    const checkSession = setInterval(() => {
      const now = Date.now();
      const expiry = getTokenExpiry(token);
      
      if (!expiry) return;

      // Check if token is expired
      if (now > expiry) {
        logout('Your session has expired. Please log in again.');
        return;
      }

      // Check for idle timeout
      if (now - lastActivity > IDLE_TIMEOUT) {
        logout('You have been logged out due to inactivity.');
        return;
      }

      // Show warning before expiry
      const timeUntilExpiry = expiry - now;
      if (timeUntilExpiry < WARNING_BEFORE_EXPIRY && timeUntilExpiry > 0) {
        setShowExpiryWarning(true);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkSession);
  }, [token, lastActivity, logout]);

  // Login function
  const login = async (credentials) => {
    try {
      const response = await loginUser(credentials);
      const { access_token, token_type } = response.data;
      
      // Store token in localStorage
      localStorage.setItem('token', access_token);
      localStorage.setItem('userEmail', credentials.email);
      
      setToken(access_token);
      setUser({ email: credentials.email });
      setShowExpiryWarning(false);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  // Extend session
  const extendSession = async () => {
    try {
      const response = await refreshTokenAPI(token);
      const { access_token } = response.data;
      
      // Update token in localStorage
      localStorage.setItem('token', access_token);
      
      setToken(access_token);
      setShowExpiryWarning(false);
      setLastActivity(Date.now());
    } catch (error) {
      console.error('Failed to extend session:', error);
      logout('Session could not be extended. Please log in again.');
    }
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token,
    showExpiryWarning,
    login,
    logout,
    extendSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      
      {/* Session Expiry Warning Modal */}
      {showExpiryWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
              Session Expiring Soon
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Your session will expire in less than 5 minutes. Would you like to stay logged in?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => logout()}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
              >
                Log Out
              </button>
              <button
                onClick={extendSession}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Stay Logged In
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};