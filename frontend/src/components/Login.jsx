import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { motion } from 'framer-motion';
import { LogIn, Eye, EyeOff, Sparkles, Brain } from 'lucide-react';
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, duration: 0.6 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
    },
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-4 overflow-hidden">
      {/* Glowing blobs */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl animate-ping" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-10 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '4s' }} />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md"
      >
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-md shadow-xl border border-white/10">
            <CardContent className="relative p-8 space-y-6">
              <motion.div variants={itemVariants} className="text-center space-y-2">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                  QuantInsight AI
                </h1>
                <p className="text-slate-300">
                  Welcome back! Sign in to continue your journey.
                </p>
              </motion.div>

              <motion.form variants={itemVariants} onSubmit={handleLogin} className="space-y-4">
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="h-12 rounded-xl bg-white/10 border border-white/20 placeholder:text-slate-400 text-white"
                    required
                  />
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="h-12 rounded-xl bg-white/10 border border-white/20 pr-12 placeholder:text-slate-400 text-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>

                {error && (
                  <motion.p className="text-red-500 text-sm text-center bg-red-500/10 border border-red-500/30 p-2 rounded-lg">
                    {error}
                  </motion.p>
                )}

                <motion.div variants={itemVariants}>
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Signing in...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <LogIn className="w-4 h-4" /> Sign In
                      </div>
                    )}
                  </Button>
                </motion.div>

                <div className="text-xs text-slate-400 text-center bg-white/5 border border-white/10 p-3 rounded-lg">
                  <p className="font-medium mb-1">Demo Credentials:</p>
                  <p>Email: demo@example.com</p>
                  <p>Password: password</p>
                </div>
              </motion.form>

              <div className="text-center pt-4 border-t border-white/10">
                <p className="text-sm text-slate-400">
                  Don’t have an account?{' '}
                  <a
                    href="/register"
                    className="text-blue-400 hover:text-blue-300 underline transition-colors"
                  >
                    Create one here
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
