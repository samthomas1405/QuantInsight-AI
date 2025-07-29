import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { motion } from 'framer-motion';
import { UserPlus, Brain } from 'lucide-react';
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

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    try {
      await registerUser(formData);
      setSuccess('Registration successful! You can now log in.');
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-4 text-white overflow-hidden">

      {/* Glowing Blobs */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl animate-ping" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-10 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '4s' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-md shadow-xl border border-white/10">
          <CardContent className="relative p-8 space-y-6">
            <motion.div className="text-center space-y-2">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                QuantInsight AI
              </h1>
              <p className="text-slate-300 text-sm">Create your account and start tracking smarter</p>
            </motion.div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label htmlFor="first_name" className="text-sm">First Name</Label>
                <Input
                  id="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Jane"
                  className="h-11 bg-white/10 border border-white/20 text-white placeholder:text-slate-400"
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name" className="text-sm">Last Name</Label>
                <Input
                  id="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Doe"
                  className="h-11 bg-white/10 border border-white/20 text-white placeholder:text-slate-400"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  className="h-11 bg-white/10 border border-white/20 text-white placeholder:text-slate-400"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-sm">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Create a strong password"
                  className="h-11 bg-white/10 border border-white/20 text-white placeholder:text-slate-400"
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirm_password" className="text-sm">Confirm Password</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  placeholder="Repeat your password"
                  className="h-11 bg-white/10 border border-white/20 text-white placeholder:text-slate-400"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> Register
              </Button>

              {error && <p className="text-red-500 text-sm text-center mt-1">{error}</p>}
              {success && <p className="text-green-500 text-sm text-center mt-1">{success}</p>}

              <p className="text-xs text-slate-400 text-center mt-4">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-400 hover:underline">
                  Login here
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
