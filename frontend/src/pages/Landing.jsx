// src/pages/Landing.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, MessageSquare, Mic, ArrowRight, Sparkles, Zap, Shield } from 'lucide-react';

const Landing = () => {
  const features = [
    {
      icon: TrendingUp,
      title: "Live Market Data",
      description: "Real-time stock prices and market analytics"
    },
    {
      icon: Brain,
      title: "AI Predictions",
      description: "Multi-agent stock analysis and predictions"
    },
    {
      icon: MessageSquare,
      title: "Sentiment Analysis",
      description: "Advanced text sentiment and emotion detection"
    },
    {
      icon: Mic,
      title: "Audio Transcription",
      description: "Convert audio to text with AI precision"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100/50 to-slate-200/50"></div>

      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex justify-between items-center px-8 py-6"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center space-x-3"
        >
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            QuantInsight AI
          </h1>
        </motion.div>

        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex space-x-4"
        >
          <Link to="/login">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 text-slate-700 hover:text-slate-900 font-medium transition-colors duration-200"
            >
              Sign In
            </motion.button>
          </Link>
          <Link to="/register">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Get Started
            </motion.button>
          </Link>
        </motion.div>
      </motion.header>

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="relative z-10 flex flex-col items-center justify-center min-h-[70vh] px-8 text-center"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-8"
        >
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Powered by Advanced AI</span>
          </div>
        </motion.div>

        <h1 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6 leading-tight">
          The Future of
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Quantitative Trading</span>
        </h1>

        <p className="text-xl text-slate-600 mb-8 max-w-2xl leading-relaxed">
          Leverage the power of artificial intelligence to make informed investment decisions. 
          Our multi-agent system analyzes market data, sentiment, and technical indicators to provide you with actionable insights.
        </p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 mb-12"
        >
          <Link to="/register">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
          <Link to="/login">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 border-2 border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 font-semibold rounded-xl transition-all duration-300 flex items-center space-x-2"
            >
              <span>Sign In</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="flex items-center space-x-6 text-slate-500"
        >
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span className="text-sm">Secure & Reliable</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span className="text-sm">Real-time Data</span>
          </div>
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span className="text-sm">AI-Powered</span>
          </div>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="relative z-10 px-8 pb-16"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-slate-800 mb-4">
              Everything You Need for Smart Trading
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Our comprehensive suite of AI-powered tools helps you make better investment decisions
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.6 + index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 2.0 }}
        className="relative z-10 bg-white border-t border-slate-200 px-8 py-16"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-4">
            Ready to Transform Your Trading?
          </h2>
          <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
            Join thousands of traders who are already using AI to make smarter investment decisions
          </p>
          <Link to="/register">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2 mx-auto"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </div>
      </motion.section>
    </div>
  );
};

export default Landing;
