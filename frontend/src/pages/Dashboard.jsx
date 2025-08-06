import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Brain, MessageSquare, Mic, Home, User, Bot, Menu, X, BarChart3, Activity, Sparkles, Grid3X3, Loader } from 'lucide-react';
import DashboardHome from '../components/DashboardHome';
import MarketDataTable from '../components/MarketDataTable';
import NewsFeed from '../components/NewsFeed';
import SentimentAnalyzer from '../components/SentimentAnalyzer';
import AudioUploader from '../components/AudioUploader';
import AIFinancialAssistant from '../components/AIFinancialAssistant';
import UserAvatarMenu from '../components/UserAvatarMenu';
import { fetchUserInfo } from '../api/auth';
import QuantInsightLogo from '../components/QuantInsightLogo';

const TABS = [
  { 
    label: "Dashboard", 
    icon: Home, 
    component: <DashboardHome />,
    description: "Your followed stocks and latest news",
    color: "accent-blue"
  },
  { 
    label: "Live Market Data", 
    icon: Activity, 
    component: <MarketDataTable />,
    description: "Real-time stock prices and market data",
    color: "accent-purple"
  },
  { 
    label: "Multi-Agent Predictor", 
    icon: Brain, 
    component: <NewsFeed />,
    description: "AI-powered stock analysis and predictions",
    color: "accent-green"
  },
  { 
    label: "AI Financial Assistant", 
    icon: Sparkles, 
    component: <AIFinancialAssistant />,
    description: "Chat with AI about stocks and financial data",
    color: "accent-orange"
  },
  { 
    label: "Sentiment Analyzer", 
    icon: MessageSquare, 
    component: <SentimentAnalyzer />,
    description: "Analyze text sentiment and emotions",
    color: "accent-indigo"
  },
  { 
    label: "Transcriber", 
    icon: Mic, 
    component: <AudioUploader />,
    description: "Convert audio to text with AI",
    color: "accent-rose"
  },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg p-8 shadow-lg border border-[var(--border)]"
        >
          <div className="flex items-center justify-center w-16 h-16 bg-[var(--primary-50)] rounded-full mb-6 mx-auto">
            <Loader className="w-8 h-8 text-[var(--primary-500)] animate-spin" />
          </div>
          <p className="text-[var(--text-primary)] text-lg font-semibold text-center mb-2">
            Loading Dashboard
          </p>
          <p className="text-[var(--text-secondary)] text-sm text-center">
            Please wait while we set up your workspace
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.nav 
        initial={{ x: sidebarOpen ? 0 : -320 }}
        animate={{ x: sidebarOpen ? 0 : -320 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-0 h-full w-80 bg-white flex flex-col py-8 px-6 space-y-4 shadow-xl z-40 border-r border-[var(--border)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <QuantInsightLogo size="default" />
          </motion.div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-all duration-200 border border-[var(--border)] hover:border-[var(--border-strong)]"
          >
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </motion.button>
        </div>

        {/* Navigation Tabs */}
        <div className="space-y-2 flex-1">
          {TABS.map((tab, idx) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === idx;
            
            return (
              <motion.button
                key={tab.label}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 * idx }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-all duration-200 group relative ${
                  isActive
                    ? "bg-[var(--primary-50)] text-[var(--primary-700)] border border-[var(--primary-200)] shadow-sm"
                    : "hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
                onClick={() => setActiveTab(idx)}
              >
                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[var(--primary-500)] rounded-r-full"
                    transition={{ type: "spring", damping: 25 }}
                  />
                )}
                
                <div className={`p-2 rounded-lg mr-3 transition-all duration-200 ${
                  isActive
                    ? `bg-[var(--${tab.color})] text-white`
                    : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] group-hover:bg-[var(--bg-secondary)]"
                }`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                
                <div className="flex-1">
                  <div className="font-medium text-sm">{tab.label}</div>
                  <div className={`text-xs transition-all duration-200 ${
                    isActive
                      ? "text-[var(--primary-600)]"
                      : "text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]"
                  }`}>
                    {tab.description}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="pt-6 border-t border-[var(--border)]"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[var(--primary-100)] flex items-center justify-center">
              <User className="w-5 h-5 text-[var(--primary-600)]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">{user.email}</p>
            </div>
          </div>
        </motion.div>
      </motion.nav>

      {/* Main Content */}
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`min-h-screen transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-80' : 'ml-0'
        }`}
      >
        {/* Header */}
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="sticky top-0 z-20 bg-white border-b border-[var(--border)] px-8 py-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {!sidebarOpen && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-all duration-200 border border-[var(--border)] hover:border-[var(--border-strong)]"
                >
                  <Menu className="w-5 h-5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" />
                </motion.button>
              )}
              
              <div>
                <motion.h2 
                  key={TABS[activeTab].label}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xl font-semibold text-[var(--text-primary)]"
                >
                  {TABS[activeTab].label}
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-[var(--text-secondary)] text-sm mt-0.5"
                >
                  {TABS[activeTab].description}
                </motion.p>
              </div>
            </div>
            
            {/* Stats Display */}
            <div className="hidden lg:flex items-center space-x-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <p className="text-[var(--accent-green)] text-xl font-semibold">
                  +12.5%
                </p>
                <p className="text-xs text-[var(--text-secondary)]">Portfolio Today</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <p className="text-[var(--primary-600)] text-xl font-semibold">
                  $24.5K
                </p>
                <p className="text-xs text-[var(--text-secondary)]">Total Value</p>
              </motion.div>
            </div>
            
            <UserAvatarMenu
              firstName={user.first_name}
              lastName={user.last_name}
              email={user.email}
            />
          </div>
        </motion.header>

        {/* Content Area */}
        <div className="p-6 lg:p-8 bg-[var(--bg-primary)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ 
                duration: 0.3,
                ease: "easeInOut"
              }}
              className="w-full max-w-[1800px] mx-auto"
            >
              {/* Status Badge */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6"
              >
                <div className={`inline-flex items-center px-3 py-1.5 rounded-full bg-[var(--${TABS[activeTab].color})]/10 border border-[var(--${TABS[activeTab].color})]/20`}>
                  <BarChart3 className="w-4 h-4 mr-2 text-[var(--text-secondary)]" />
                  <span className="text-sm font-medium text-[var(--text-primary)]">Live Data</span>
                  <div className="ml-2 w-2 h-2 rounded-full bg-[var(--accent-green)] opacity-75"></div>
                </div>
              </motion.div>
              
              {/* Component Content */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {TABS[activeTab].component}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.main>
    </div>
  );
};

export default Dashboard;