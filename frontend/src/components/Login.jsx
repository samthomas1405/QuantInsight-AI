import React, { useState } from 'react';
import { loginUser } from '../api/auth';
import { useNavigate, Link } from 'react-router-dom';

const Login = ({ setToken }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);  // Optional loading state
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await loginUser({ email, password });
      localStorage.setItem('token', response.data.access_token);
      setToken(response.data.access_token);
      navigate('/dashboard');
    } catch {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center">
      <h2 className="text-3xl font-bold text-cyan-400 mb-4">Sign In</h2>
      <form className="bg-gray-800 p-6 rounded shadow-md w-80 space-y-4" onSubmit={handleLogin}>
        <input
          className="w-full p-2 rounded bg-gray-700"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          className="w-full p-2 rounded bg-gray-700"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button
          type="submit"
          className={`w-full p-2 rounded ${
            loading ? 'bg-cyan-300' : 'bg-cyan-500 hover:bg-cyan-400'
          }`}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        {error && <p className="text-red-500">{error}</p>}
        <p className="text-sm">
          New user? <Link to="/register" className="text-cyan-400">Register here</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
