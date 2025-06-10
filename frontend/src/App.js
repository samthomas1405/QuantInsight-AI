import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';  // New landing page
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './pages/Dashboard';
import StockSelection from './pages/StockSelection';


function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const isAuthenticated = !!token;

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        {isAuthenticated ? (
          <>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/select-stocks" element={<StockSelection />} />
          </>
        ) : (
          <>
            <Route path="/dashboard" element={<Navigate to="/login" replace />} />
            <Route path="/select-stocks" element={<Navigate to="/login" replace />} />
          </>
        )}


        {/* Catch-All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

