import { useState } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { motion } from 'framer-motion';
import { UserPlus, Eye, EyeOff, ArrowRight, CheckCircle, BarChart3, Shield, Zap } from 'lucide-react';
import QuantInsightLogo from './QuantInsightLogo';
import { registerUser } from '../api/auth';
import { Link } from 'react-router-dom';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    confirm_password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    try {
      await registerUser(formData);
      setSuccess('Registration successful! You can now log in.');
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 p-8 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          <div className="mb-8">
            <QuantInsightLogo size="default" className="filter brightness-0 invert" animate={false} />
          </div>
          
          <div className="space-y-3">
            <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
              Join the Future of Intelligent Trading
            </h2>
            <p className="text-lg text-indigo-100 leading-relaxed">
              Experience the power of AI-driven market analysis. Get real-time insights, predictive analytics, and smart recommendations.
            </p>
          </div>
        </div>

        {/* Animated Bar Chart */}
        <div className="relative z-10 mt-6">
          <svg viewBox="0 0 400 150" className="w-full max-w-sm mx-auto">
            {/* Grid Lines */}
            <g className="opacity-20">
              {[0, 1, 2, 3].map(i => (
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
            </g>
            
            {/* Animated Bars */}
            {[
              { x: 40, height: 100, delay: 0 },
              { x: 120, height: 70, delay: 0.1 },
              { x: 200, height: 85, delay: 0.2 },
              { x: 280, height: 55, delay: 0.3 },
              { x: 360, height: 95, delay: 0.4 }
            ].map((bar, index) => (
              <motion.rect
                key={index}
                x={bar.x}
                y={120}
                width="40"
                height="0"
                fill="white"
                fillOpacity="0.3"
                initial={{ height: 0, y: 120 }}
                animate={{ height: bar.height, y: 120 - bar.height }}
                transition={{ delay: bar.delay, duration: 0.8, ease: "easeOut" }}
              />
            ))}
            
            {/* Trend Line */}
            <motion.path
              d="M 60 20 L 140 60 L 220 40 L 300 80 L 380 30"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeDasharray="5,5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.5, duration: 1.5, ease: "easeInOut" }}
            />
          </svg>
        </div>

        {/* Benefits */}
        <div className="relative z-10 space-y-4 mt-8">
          <div className="flex items-start space-x-4">
            <div className="w-9 h-9 bg-white/20 backdrop-blur-lg rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Secure & Reliable</h3>
              <p className="text-indigo-100 text-xs">Bank-level security to protect your data and investments</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="w-9 h-9 bg-white/20 backdrop-blur-lg rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Lightning Fast</h3>
              <p className="text-indigo-100 text-xs">Real-time data processing and instant insights</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="w-9 h-9 bg-white/20 backdrop-blur-lg rounded-lg flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Data-Driven</h3>
              <p className="text-indigo-100 text-xs">Advanced analytics powered by machine learning</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
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
              <h2 className="text-3xl font-bold text-gray-900">Create an account</h2>
              <p className="text-gray-600 mt-2">Start your AI-powered trading journey today</p>
            </div>

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur border border-green-200/50 rounded-lg p-6 text-center shadow-sm"
              >
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-green-800 font-medium mb-1">{success}</p>
                <Link 
                  to="/login"
                  className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 font-semibold mt-2"
                >
                  Go to Login <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            )}

            {/* Register Form */}
            {!success && (
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name" className="text-gray-700 font-medium text-sm">
                      First Name
                    </Label>
                    <Input
                      id="first_name"
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="Jane"
                      className="mt-1 block w-full px-3 py-2 bg-gray-50/50 backdrop-blur border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:bg-white/50"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="last_name" className="text-gray-700 font-medium text-sm">
                      Last Name
                    </Label>
                    <Input
                      id="last_name"
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="Doe"
                      className="mt-1 block w-full px-3 py-2 bg-gray-50/50 backdrop-blur border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:bg-white/50"
                      required
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <Label htmlFor="email" className="text-gray-700 font-medium text-sm">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@example.com"
                    className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                {/* Password Fields */}
                <div>
                  <Label htmlFor="password" className="text-gray-700 font-medium text-sm">
                    Password
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Create a strong password"
                      className="block w-full px-3 py-2 pr-12 bg-gray-50/50 backdrop-blur border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:bg-white/50"
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

                <div>
                  <Label htmlFor="confirm_password" className="text-gray-700 font-medium text-sm">
                    Confirm Password
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirm_password}
                      onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                      placeholder="Repeat your password"
                      className="block w-full px-3 py-2 pr-12 bg-gray-50/50 backdrop-blur border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:bg-white/50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50/80 backdrop-blur border border-red-200/50 text-red-700 px-4 py-3 rounded-lg text-sm shadow-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Register Button */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      <span>Create Account</span>
                    </>
                  )}
                </motion.button>
              </form>
            )}

            {/* Login Link */}
            {!success && (
              <div className="text-center">
                <p className="text-gray-600 text-sm">
                  Already have an account?{' '}
                  <a
                    href="/login"
                    className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
                  >
                    Sign In
                  </a>
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}