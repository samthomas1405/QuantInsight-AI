// src/pages/Landing.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white flex flex-col justify-center items-center">
      <h1 className="text-4xl font-bold mb-4">QuantInsight AI</h1>
      <p className="text-lg mb-8">The Future of Quantitative Trading</p>
      <div className="flex gap-4">
        <Link to="/login" className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 rounded">Sign In</Link>
        <Link to="/register" className="px-6 py-2 border border-cyan-500 hover:bg-cyan-500 rounded">Register</Link>
      </div>
    </div>
  );
};

export default Landing;
