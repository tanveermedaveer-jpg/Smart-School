import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import PasswordInput from '../../components/PasswordInput';
import { normalizeRole } from '../../utils/db';

const SuperAdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const profile = await login(email.trim(), password);
      const role = normalizeRole(profile.role);
      
      if (role !== 'superAdmin' && role !== 'super_admin') {
        toast.error('Access Denied: Only Super Admin is authorized to log in here.');
        await logout();
        setIsLoading(false);
        return;
      }

      toast.success(`Welcome back, Super Admin!`);
      navigate('/super-admin/dashboard', { replace: true });
    } catch (err) {
      console.error('[SuperAdminLogin] Login error:', err);
      const msg = err.message || '';
      if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('fetch')) {
        toast.error('Connection Error: Please run start-project.bat to start the backend server!', { duration: 6000 });
      } else {
        toast.error(msg || 'Login failed. Please check your credentials.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center font-sans px-4 relative overflow-hidden">
      
      {/* Abstract Background Accents */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-slate-800/80 border border-slate-700/50 p-8 rounded-3xl shadow-2xl backdrop-blur-md relative z-10">
        
        {/* Header Icon */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <BookOpen className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Super Admin Portal</h1>
          <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5 justify-center">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
            Authorized Personnel Access Only
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Secure Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none block w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-xs transition-colors"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Secure Password
            </label>
            <PasswordInput
              id="password"
              name="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none block w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-xs transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-400 transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-950"></span>
                  Authenticating...
                </span>
              ) : (
                'Secure Sign In'
              )}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-[10px] text-slate-500">
          IP addresses and access timestamps are logged for system audit.
        </p>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
