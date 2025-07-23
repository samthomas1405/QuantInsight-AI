import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MarketDataTable from '../components/MarketDataTable';
import NewsFeed from '../components/NewsFeed';
import SentimentAnalyzer from '../components/SentimentAnalyzer';
import AudioUploader from '../components/AudioUploader';
import UserAvatarMenu from '../components/UserAvatarMenu';
import { fetchUserInfo } from '../api/auth';

const TABS = [
  { label: "Live Market Data", icon: "📈", component: <MarketDataTable /> },
  { label: "Multi-Agent Predictor", icon: "🧠", component: <NewsFeed /> },
  { label: "Sentiment Analyzer", icon: "💬", component: <SentimentAnalyzer /> },
  { label: "Transcriber", icon: "🎙️", component: <AudioUploader /> },
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
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-lg font-medium">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <nav className="w-64 bg-gray-800 flex flex-col py-8 px-4 space-y-2 shadow-lg">
        <h1 className="text-2xl font-bold text-cyan-400 mb-8">QuantInsight AI</h1>
        {TABS.map((tab, idx) => (
          <button
            key={tab.label}
            className={`flex items-center px-4 py-3 rounded-lg text-lg font-medium transition ${
              activeTab === idx
                ? "bg-cyan-600 text-white"
                : "hover:bg-gray-700 text-cyan-200"
            }`}
            onClick={() => setActiveTab(idx)}
          >
            <span className="mr-3 text-2xl">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
        <div className="mt-auto">
          <UserAvatarMenu
            firstName={user.first_name}
            lastName={user.last_name}
            email={user.email}
          />
        </div>
      </nav>
      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {TABS[activeTab].component}
      </main>
    </div>
  );
};

export default Dashboard;