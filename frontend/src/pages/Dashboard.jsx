import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Brain, MessageSquare, Mic, Home, User, Menu, X, Activity, Sparkles, Loader, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
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
    color: "from-indigo-500 to-purple-600"
  },
  { 
    label: "Live Market Data", 
    icon: Activity, 
    component: <MarketDataTable />,
    description: "Real-time stock prices and market data",
    color: "from-cyan-500 to-blue-600"
  },
  { 
    label: "Multi-Agent Predictor", 
    icon: Brain, 
    component: <NewsFeed />,
    description: "AI-powered stock analysis and predictions",
    color: "from-emerald-500 to-green-600"
  },
  { 
    label: "AI Financial Assistant", 
    icon: Sparkles, 
    component: <AIFinancialAssistant />,
    description: "Chat with AI about stocks and financial data",
    color: "from-amber-500 to-orange-600"
  },
  { 
    label: "Sentiment Analyzer", 
    icon: MessageSquare, 
    component: <SentimentAnalyzer />,
    description: "Analyze text sentiment and emotions",
    color: "from-purple-500 to-indigo-600"
  },
  { 
    label: "Transcriber", 
    icon: Mic, 
    component: <AudioUploader />,
    description: "Convert audio to text with AI",
    color: "from-pink-500 to-rose-600"
  },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const { isDark, toggleTheme } = useTheme();

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-gray-200/50"
        >
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full mb-6 mx-auto border border-blue-200/30">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <p className="text-gray-900 text-lg font-bold font-['Space_Grotesk'] text-center mb-2">
            Loading Dashboard
          </p>
          <p className="text-gray-600 text-sm text-center font-medium">
            Please wait while we set up your workspace
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`app-background ${isDark ? 'dark' : ''}`}>
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
        className={`fixed left-0 top-0 h-full w-80 sidebar-background ${isDark ? 'dark' : ''} flex flex-col py-8 px-6 space-y-4 shadow-xl z-40`}
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
            className="p-2 hover:bg-gray-100/50 rounded-lg transition-all duration-200 border border-gray-200/50 hover:border-gray-300/50 backdrop-blur"
          >
            <X className="w-5 h-5 text-gray-600" />
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
                className={`w-full flex items-center px-4 py-3 rounded-xl text-left transition-all duration-200 group relative ${
                  isActive
                    ? isDark 
                      ? "bg-gradient-to-r from-gray-800 to-gray-700 text-indigo-300 border border-gray-600 shadow-sm"
                      : "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200 shadow-sm"
                    : isDark
                      ? "hover:bg-gray-800 text-gray-300 hover:text-gray-100"
                      : "hover:bg-gray-50 text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => setActiveTab(idx)}
              >
                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-r-full"
                    transition={{ type: "spring", damping: 25 }}
                  />
                )}
                
                <div className={`p-2 rounded-lg mr-3 transition-all duration-200 ${
                  isActive
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-md`
                    : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                }`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                
                <div className="flex-1">
                  <div className="font-semibold font-['Space_Grotesk'] text-sm">{tab.label}</div>
                  <div className={`text-xs transition-all duration-200 font-medium ${
                    isActive
                      ? isDark ? "text-indigo-400" : "text-indigo-600"
                      : isDark ? "text-gray-400 group-hover:text-gray-300" : "text-gray-500 group-hover:text-gray-700"
                  }`}>
                    {tab.description}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Footer with Theme Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className={`pt-6 border-t ${isDark ? 'border-white/10' : 'border-gray-200/50'} space-y-4`}
        >
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Theme</span>
            <div className={`theme-toggle ${isDark ? 'dark' : ''}`} onClick={toggleTheme}>
              <div className="theme-toggle-thumb flex items-center justify-center">
                {isDark ? <Moon className="w-3 h-3 text-gray-400" /> : <Sun className="w-3 h-3 text-gray-600" />}
              </div>
            </div>
          </div>
          
          {/* User Info */}
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-gradient-to-r from-indigo-600 to-purple-600'} flex items-center justify-center`}>
              <span className="text-white font-bold text-sm">
                {user.first_name?.[0]}{user.last_name?.[0]}
              </span>
            </div>
            <div>
              <p className={`text-sm font-bold font-['Space_Grotesk'] ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                {user.first_name} {user.last_name}
              </p>
              <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{user.email}</p>
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
          className={`sticky top-0 z-20 ${isDark ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-lg ${isDark ? 'border-white/10' : 'border-gray-100'} border-b px-8 py-4 shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {!sidebarOpen && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-gray-100/50 rounded-lg transition-all duration-200 border border-gray-200/50 hover:border-gray-300/50 backdrop-blur"
                >
                  <Menu className="w-5 h-5 text-gray-600 hover:text-gray-900 transition-colors" />
                </motion.button>
              )}
              
              <div>
                <motion.h1 
                  key={TABS[activeTab].label}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-2xl font-bold font-['Space_Grotesk'] ${
                    isDark 
                      ? 'bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-clip-text text-transparent'
                      : 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent'
                  }`}
                >
                  {TABS[activeTab].label}
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mt-0.5 font-medium`}
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
                <p className="text-xl font-bold font-['JetBrains_Mono'] bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  +12.5%
                </p>
                <p className="text-xs text-gray-600 font-medium">Portfolio Today</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <p className="text-xl font-bold font-['JetBrains_Mono'] bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  $24.5K
                </p>
                <p className="text-xs text-gray-600 font-medium">Total Value</p>
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
        <div className="p-6 lg:p-8 content-area">
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
              {/* Component Content - No boxed container */}
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