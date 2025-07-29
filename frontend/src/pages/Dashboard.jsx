import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Brain, MessageSquare, Mic, Home, User } from 'lucide-react';
import MarketDataTable from '../components/MarketDataTable';
import NewsFeed from '../components/NewsFeed';
import SentimentAnalyzer from '../components/SentimentAnalyzer';
import AudioUploader from '../components/AudioUploader';
import UserAvatarMenu from '../components/UserAvatarMenu';
import { fetchUserInfo } from '../api/auth';

const TABS = [
  { 
    label: "Live Market Data", 
    icon: TrendingUp, 
    component: <MarketDataTable />,
    description: "Real-time stock prices and market data"
  },
  { 
    label: "Multi-Agent Predictor", 
    icon: Brain, 
    component: <NewsFeed />,
    description: "AI-powered stock analysis and predictions"
  },
  { 
    label: "Sentiment Analyzer", 
    icon: MessageSquare, 
    component: <SentimentAnalyzer />,
    description: "Analyze text sentiment and emotions"
  },
  { 
    label: "Transcriber", 
    icon: Mic, 
    component: <AudioUploader />,
    description: "Convert audio to text with AI"
  },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchUserInfo(token)
      .then(res => setUser(res.data))
      .catch(() => {
        setUser(null);
        localStorage.removeItem('token');
        navigate('/login');
      });
  }, [token, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100/50 to-slate-200/50"></div>

        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mb-4 mx-auto">
              <Home className="w-8 h-8 text-white" />
            </div>
            <p className="text-xl font-semibold text-slate-700 text-center">
              Loading Dashboard...
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100/50 to-slate-200/50"></div>

      {/* Sidebar */}
      <motion.nav 
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative z-10 w-80 bg-white/80 backdrop-blur-sm border-r border-slate-200 flex flex-col py-8 px-6 space-y-4 shadow-lg"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            QuantInsight AI
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Intelligent Financial Analysis
          </p>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="space-y-2">
          {TABS.map((tab, idx) => {
            const IconComponent = tab.icon;
            return (
              <motion.button
                key={tab.label}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 + idx * 0.1 }}
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center px-6 py-4 rounded-xl text-lg font-medium transition-all duration-300 group ${
                  activeTab === idx
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                    : "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                }`}
                onClick={() => setActiveTab(idx)}
              >
                <div className={`p-2 rounded-lg mr-4 transition-all duration-300 ${
                  activeTab === idx
                    ? "bg-white/20"
                    : "bg-slate-100 group-hover:bg-slate-200"
                }`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold">{tab.label}</div>
                  <div className={`text-sm transition-all duration-300 ${
                    activeTab === idx
                      ? "text-white/80"
                      : "text-slate-500 group-hover:text-slate-600"
                  }`}>
                    {tab.description}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>


      </motion.nav>

      {/* Main Content */}
      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="relative z-10 flex-1 overflow-y-auto bg-transparent"
      >
        {/* User Avatar Menu - Top Right Corner */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="absolute top-6 right-6 z-20"
        >
          <UserAvatarMenu
            firstName={user.first_name}
            lastName={user.last_name}
            email={user.email}
          />
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {TABS[activeTab].component}
          </motion.div>
        </AnimatePresence>
      </motion.main>
    </div>
  );
};

export default Dashboard;