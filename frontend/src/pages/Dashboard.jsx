import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserInfo } from '../api/auth';

import MarketDataTable from '../components/MarketDataTable';
import NewsFeed from '../components/NewsFeed';
import SentimentAnalyzer from '../components/SentimentAnalyzer';
import AudioUploader from '../components/AudioUploader';
import UserAvatarMenu from '../components/UserAvatarMenu';

const Dashboard = () => {
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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Top Navigation Bar */}
      <header className="flex justify-between items-center bg-gray-800 px-6 py-4 shadow">
        <h1 className="text-2xl font-bold text-cyan-400">QuantInsight AI</h1>
        <UserAvatarMenu
          firstName={user.first_name}
          lastName={user.last_name}
          email={user.email}
        />
      </header>

      {/* Main Dashboard */}
      <main className="px-6 py-8 max-w-7xl mx-auto space-y-8">
        <h2 className="text-3xl font-semibold text-cyan-400">Welcome back, {user.first_name}!</h2>

        {/* Grid Layout for Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
          {/* Market Data Section */}
          <section className="bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-700">
            <h3 className="text-xl font-semibold text-cyan-300 mb-4">📈 Market Data</h3>
            <MarketDataTable />
          </section>

          {/* News Feed Section */}
          <section className="bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-700">
            <h3 className="text-xl font-semibold text-cyan-300 mb-4">📰 Financial News</h3>
            <NewsFeed />
          </section>

          {/* Sentiment Analyzer Section */}
          <section className="bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-700">
            <h3 className="text-xl font-semibold text-cyan-300 mb-4">🧠 Sentiment Analyzer</h3>
            <SentimentAnalyzer />
          </section>

          {/* Audio Uploader Section */}
          <section className="bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-700">
            <h3 className="text-xl font-semibold text-cyan-300 mb-4">🎙️ Upload Audio Commentary</h3>
            <AudioUploader />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
