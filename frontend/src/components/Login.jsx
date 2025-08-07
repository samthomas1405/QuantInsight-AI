import { useState } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { motion } from 'framer-motion';
import { LogIn, Eye, EyeOff, TrendingUp, Activity } from 'lucide-react';
import QuantInsightLogo, { QuantInsightLogoMark } from './QuantInsightLogo';
import { loginUser, fetchUserInfo } from '../api/auth';
import { useNavigate } from 'react-router-dom';

export default function LoginPage({ setToken }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await loginUser({ email, password });
      const token = response.data.access_token;
      localStorage.setItem('token', token);
      setToken(token);

      const profileRes = await fetchUserInfo(token);
      const hasCompletedSetup = profileRes.data.has_completed_setup;

      if (hasCompletedSetup) navigate('/dashboard');
      else navigate('/select-stocks');
    } catch {
      setError('Invalid credentials. Try demo@example.com / password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          <div className="mb-16">
            <QuantInsightLogo size="large" className="filter brightness-0 invert" animate={false} />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
              AI-Powered Trading Intelligence
            </h2>
            <p className="text-xl text-blue-100 leading-relaxed">
              Make smarter investment decisions with real-time market analysis and predictive insights powered by artificial intelligence.
            </p>
          </div>
        </div>

        {/* Animated Chart Graphic */}
        <div className="relative z-10 mt-12">
          <svg viewBox="0 0 400 200" className="w-full max-w-md mx-auto">
            {/* Grid Lines */}
            <g className="opacity-20">
              {[0, 1, 2, 3, 4].map(i => (
                <line
                  key={`h-${i}`}
                  x1="0"
                  y1={i * 40}
                  x2="400"
                  y2={i * 40}
                  stroke="white"
                  strokeWidth="1"
                />
              ))}
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <line
                  key={`v-${i}`}
                  x1={i * 50}
                  y1="0"
                  x2={i * 50}
                  y2="160"
                  stroke="white"
                  strokeWidth="1"
                />
              ))}
            </g>
            
            {/* Animated Line Chart */}
            <motion.path
              d="M 0 120 Q 50 100 100 90 T 200 70 Q 250 50 300 40 T 400 20"
              fill="none"
              stroke="white"
              strokeWidth="3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
            
            {/* Gradient Fill */}
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="white" stopOpacity="0.3" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            <motion.path
              d="M 0 120 Q 50 100 100 90 T 200 70 Q 250 50 300 40 T 400 20 L 400 160 L 0 160 Z"
              fill="url(#gradient)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
            />
            
            {/* Data Points */}
            {[
              { x: 0, y: 120 },
              { x: 100, y: 90 },
              { x: 200, y: 70 },
              { x: 300, y: 40 },
              { x: 400, y: 20 }
            ].map((point, index) => (
              <motion.circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="5"
                fill="white"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              />
            ))}
          </svg>
        </div>

        {/* Features */}
        <div className="relative z-10 grid grid-cols-3 gap-6 mt-16">
          <div className="text-center">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-lg flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm text-blue-100">Real-time Analysis</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-lg flex items-center justify-center mx-auto mb-2">
              <QuantInsightLogoMark size={24} className="filter brightness-0 invert" />
            </div>
            <p className="text-sm text-blue-100">AI Predictions</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-lg flex items-center justify-center mx-auto mb-2">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm text-blue-100">Live Market Data</p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <QuantInsightLogo size="default" className="mx-auto" />
          </div>

          <div className="space-y-4 bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-gray-200/50">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
              <p className="text-gray-600 mt-2">Please enter your details to sign in</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-gray-700 font-medium text-sm">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="mt-1 block w-full px-3 py-2 bg-gray-50/50 backdrop-blur border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-white/50"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-gray-700 font-medium text-sm">
                  Password
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="block w-full px-3 py-2 pr-12 bg-gray-50/50 backdrop-blur border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-white/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50/80 backdrop-blur border border-red-200/50 text-red-700 px-4 py-3 rounded-lg text-sm shadow-sm"
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Sign In</span>
                  </>
                )}
              </motion.button>

              {/* Demo Credentials */}
              <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur border border-blue-200/50 rounded-lg p-4 shadow-sm">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Demo Credentials
                </p>
                <p className="text-xs text-blue-700">
                  Email: demo@example.com<br />
                  Password: password
                </p>
              </div>
            </form>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-gray-600 text-sm">
                Don't have an account?{' '}
                <a
                  href="/register"
                  className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  Create Account
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}