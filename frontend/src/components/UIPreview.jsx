import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Activity, Brain, BarChart3, ArrowUpRight, ArrowDownRight, Sparkles, Zap, Shield, Globe, Cpu, LineChart } from 'lucide-react';

export default function UIPreview() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-cyan-50 border-b border-gray-200">
        <div className="absolute inset-0 bg-grid-gray-100/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Smart Trading
              </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-gradient-x">
                Powered by AI
              </span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 font-light tracking-wide max-w-3xl mx-auto">
              Experience the future of trading with our advanced analytics platform
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full blur-2xl opacity-50" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-semibold text-emerald-600 tracking-wide">
                  ↑ 12.5%
                </span>
              </div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                $45,231.89
              </h3>
              <p className="text-sm text-gray-500 font-medium tracking-wide uppercase mt-1">
                Portfolio Value
              </p>
              <div className="mt-6 grid grid-cols-7 gap-1">
                {[40, 70, 45, 80, 65, 90, 85].map((height, i) => (
                  <div key={i} className="relative">
                    <div
                      className="bg-gradient-to-t from-indigo-500 to-purple-500 rounded-sm opacity-20"
                      style={{ height: '40px' }}
                    />
                    <div
                      className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-sm"
                      style={{ height: `${height}%`, maxHeight: '40px' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-full blur-2xl opacity-50" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-semibold text-blue-600 tracking-wide">
                  Live
                </span>
              </div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                127
              </h3>
              <p className="text-sm text-gray-500 font-medium tracking-wide uppercase mt-1">
                Active Trades
              </p>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-600">Win Rate:</span>
                <span className="ml-2 font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  78.4%
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full blur-2xl opacity-50" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                94%
              </h3>
              <p className="text-sm text-gray-500 font-medium tracking-wide uppercase mt-1">
                AI Confidence
              </p>
              <div className="mt-4">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full w-[94%] bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Featured Stocks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Trending Stocks
              </span>
            </h2>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 tracking-wide">
              View All →
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-1 divide-y divide-gray-100">
              {[
                { symbol: 'AAPL', name: 'Apple Inc.', price: 175.43, change: 2.34, volume: '52.3M', trending: true },
                { symbol: 'TSLA', name: 'Tesla Inc.', price: 245.67, change: -1.23, volume: '125.3M' },
                { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 467.89, change: 5.67, volume: '89.7M', trending: true },
              ].map((stock, i) => (
                <div key={i} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                        i === 0 ? 'from-gray-700 to-gray-900' :
                        i === 1 ? 'from-red-500 to-red-700' :
                        'from-green-500 to-green-700'
                      } flex items-center justify-center`}>
                        <span className="text-white font-bold text-sm">
                          {stock.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-bold text-gray-900 tracking-tight">
                            {stock.symbol}
                          </h3>
                          {stock.trending && (
                            <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-semibold rounded-full">
                              HOT
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{stock.name}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        ${stock.price}
                      </p>
                      <p className={`text-sm font-semibold flex items-center justify-end ${
                        stock.change > 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {stock.change > 0 ? '↑' : '↓'} {Math.abs(stock.change)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 font-medium uppercase tracking-wider text-xs">Volume</p>
                      <p className="font-semibold text-gray-900 mt-1">{stock.volume}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium uppercase tracking-wider text-xs">Market Cap</p>
                      <p className="font-semibold text-gray-900 mt-1">$2.89T</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium uppercase tracking-wider text-xs">P/E Ratio</p>
                      <p className="font-semibold text-gray-900 mt-1">29.4</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold mb-6">
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Platform Features
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: LineChart,
                title: 'Advanced Analytics',
                description: 'Real-time market analysis with predictive insights',
                gradient: 'from-purple-500 to-indigo-600'
              },
              {
                icon: Cpu,
                title: 'AI-Powered',
                description: 'Machine learning algorithms for smarter trading',
                gradient: 'from-cyan-500 to-blue-600'
              },
              {
                icon: Shield,
                title: 'Secure Platform',
                description: 'Bank-level security for your investments',
                gradient: 'from-amber-500 to-orange-600'
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 text-center"
        >
          <h2 className="text-3xl font-bold mb-4">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Ready to Start Trading?
            </span>
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Join thousands of traders using AI to make smarter investment decisions
          </p>
          <div className="flex items-center justify-center space-x-4">
            <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
              Get Started
            </button>
            <button className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl shadow-sm border border-gray-200 hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200">
              Learn More
            </button>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }
        .bg-grid-gray-100 {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(229 231 235)' stroke-width='1'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e");
        }
      `}</style>
    </div>
  );
}