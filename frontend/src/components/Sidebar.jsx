import React, { useState, useMemo } from 'react';
import MarketDataTable from './MarketDataTable';
import NewsFeed from './NewsFeed';
import SentimentAnalyzer from './SentimentAnalyzer';
import AudioUploader from './AudioUploader';

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState(0);

  const components = useMemo(() => [
    <MarketDataTable />,
    <NewsFeed />,
    <SentimentAnalyzer />,
    <AudioUploader />,
  ], []);

  const TABS = [
    { label: "Live Market Data", icon: "📈" },
    { label: "Multi-Agent Predictor", icon: "🧠" },
    { label: "Sentiment Analyzer", icon: "💬" },
    { label: "Transcriber", icon: "🎙️" },
  ];

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
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {components.map((component, index) => (
          <div
            key={index}
            style={{ display: activeTab === index ? 'block' : 'none' }}
          >
            {component}
          </div>
        ))}
      </main>
    </div>
  );
}
