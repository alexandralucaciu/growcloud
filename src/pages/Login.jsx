// Login.jsx — standalone login page, outside AppLayout.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const success = login(username.trim(), password);
    if (success) {
      navigate('/', { replace: true });
    } else {
      setError('Incorrect username or password. Please try again.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f0] px-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <span className="text-5xl mb-3">🌱</span>
          <h1 className="text-2xl font-bold text-green-900 tracking-tight">GrowCloud</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to monitor your plant</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-base
                  focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400
                  transition-colors"
                placeholder="Enter your username"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-base
                  focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400
                  transition-colors"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-700
                text-white text-sm font-semibold transition-colors shadow-sm mt-1"
            >
              Sign in
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          GrowCloud · License Project 2026
        </p>
      </div>
    </div>
  );
}
