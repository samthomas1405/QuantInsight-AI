import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Brain, MessageSquare, Mic, Home, Activity, Sparkles, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import DashboardHome from '../components/DashboardHome';
import MarketDataTable from '../components/MarketDataTable';
import MultiAgentPredictorProfessional from '../components/MultiAgentPredictorProfessional';
import SentimentAnalyzer from '../components/SentimentAnalyzer';
import AudioUploader from '../components/AudioUploader';
import AIFinancialAssistant from '../components/AIFinancialAssistant';
import UserAvatarMenu from '../components/UserAvatarMenu';
import { fetchUserInfo } from '../api/auth';
import QuantInsightLogo from '../components/QuantInsightLogo';

const TABS = [
  { 
    path: "",
    label: "Home", 
    icon: Home, 
    component: <DashboardHome />,
    color: "from-indigo-500 to-purple-600",
    isHome: true
  },
  { 
    path: "market-data",
    label: "Live Market Data", 
    icon: Activity, 
    component: <MarketDataTable />,
    color: "from-cyan-500 to-blue-600"
  },
  { 
    path: "predictor",
    label: "Multi-Agent Predictor", 
    icon: Brain, 
    component: <MultiAgentPredictorProfessional />,
    color: "from-emerald-500 to-green-600"
  },
  { 
    path: "ai-assistant",
    label: "AI Assistant", 
    icon: Sparkles, 
    component: <AIFinancialAssistant />,
    color: "from-amber-500 to-orange-600"
  },
  { 
    path: "sentiment",
    label: "Sentiment Analyzer", 
    icon: MessageSquare, 
    component: <SentimentAnalyzer />,
    color: "from-purple-500 to-indigo-600"
  },
  { 
    path: "transcriber",
    label: "Transcriber", 
    icon: Mic, 
    component: <AudioUploader />,
    color: "from-pink-500 to-rose-600"
  },
];

const Dashboard = () => {
  const [user, setUser] = useState(null);
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
            <div className="w-8 h-8 text-blue-600 animate-spin">⚡</div>
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
    <div className={`app-background ${isDark ? 'dark' : ''} min-h-screen`}>
      {/* Top Navigation Bar */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`sticky top-0 z-50 ${isDark ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-lg ${isDark ? 'border-gray-800' : 'border-gray-200'} border-b shadow-sm`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <QuantInsightLogo size="small" />
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {TABS.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <NavLink
                    key={tab.path}
                    to={`/dashboard/${tab.path}`}
                    className={({ isActive }) => `
                      flex items-center gap-2 ${tab.isHome ? 'px-3' : 'px-4'} py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActive 
                        ? isDark 
                          ? 'bg-gray-800 text-white' 
                          : 'bg-gray-100 text-gray-900'
                        : isDark
                          ? 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                    title={tab.isHome ? 'Home' : tab.label}
                  >
                    <IconComponent className={tab.isHome ? "w-5 h-5" : "w-4 h-4"} />
                    {!tab.isHome && <span>{tab.label}</span>}
                  </NavLink>
                );
              })}
            </div>

            {/* Right Side - Theme Toggle & User Menu */}
            <div className="flex items-center gap-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>

              {/* User Menu */}
              <UserAvatarMenu
                firstName={user.first_name}
                lastName={user.last_name}
                email={user.email}
              />
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden pb-3">
            <div className="flex gap-2 overflow-x-auto custom-scrollbar">
              {TABS.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <NavLink
                    key={tab.path}
                    to={`/dashboard/${tab.path}`}
                    className={({ isActive }) => `
                      flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200
                      ${isActive 
                        ? isDark 
                          ? 'bg-gray-800 text-white' 
                          : 'bg-gray-100 text-gray-900'
                        : isDark
                          ? 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                    title={tab.isHome ? 'Home' : tab.label}
                  >
                    <IconComponent className={tab.isHome ? "w-5 h-5" : "w-4 h-4"} />
                    {!tab.isHome && <span>{tab.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className="content-area">
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/market-data" element={<MarketDataTable />} />
          <Route path="/predictor" element={<MultiAgentPredictorProfessional />} />
          <Route path="/ai-assistant" element={<AIFinancialAssistant />} />
          <Route path="/sentiment" element={<SentimentAnalyzer />} />
          <Route path="/transcriber" element={<AudioUploader />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default Dashboard;