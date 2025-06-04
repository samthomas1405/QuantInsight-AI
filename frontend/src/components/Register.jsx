import React, { useState } from 'react';
import { registerUser } from '../api/auth';
import { Link } from 'react-router-dom';

const Register = () => {
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
    <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center">
      <h2 className="text-2xl font-semibold mb-4">Register</h2>
      <form onSubmit={handleRegister} className="bg-gray-800 p-6 rounded shadow-md w-80">
        <input className="w-full mb-4 p-2 rounded bg-gray-700" type="text" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} placeholder="First Name" required />
        <input className="w-full mb-4 p-2 rounded bg-gray-700" type="text" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} placeholder="Last Name" required />
        <input className="w-full mb-4 p-2 rounded bg-gray-700" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email" required />
        <input className="w-full mb-4 p-2 rounded bg-gray-700" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Password" required />
        <input className="w-full mb-4 p-2 rounded bg-gray-700" type="password" value={formData.confirm_password} onChange={e => setFormData({...formData, confirm_password: e.target.value})} placeholder="Confirm Password" required />
        <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-400 p-2 rounded">Register</button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        {success && <p className="text-green-500 mt-2">{success}</p>}
        <p className="mt-4">Already have an account? <Link to="/login" className="text-cyan-400">Login here</Link></p>
      </form>
    </div>
  );
};

export default Register;

