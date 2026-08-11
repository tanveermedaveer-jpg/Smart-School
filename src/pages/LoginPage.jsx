import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { logSystemAction } from '../utils/logger';
import PasswordInput from '../components/PasswordInput';
import { useAuth } from '../context/AuthContext';
import { normalizeRole } from '../utils/db';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginView, setIsLoginView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const profile = await login(email.trim(), password);
      const role = normalizeRole(profile.role);
      
      if (role === 'superAdmin' || role === 'super_admin') {
        toast.error('Access Denied: Super Admin must log in through the secure portal.');
        await logout();
        setIsLoading(false);
        return;
      }
      
      if (profile.status && profile.status !== 'Active') {
        if (role === 'schoolAdmin') {
          toast.error('Your School Admin account is inactive. Please contact the Super Admin.');
        } else {
          toast.error('Your account is inactive.');
        }
        setIsLoading(false);
        return;
      }

      toast.success(`Welcome back, ${profile.name || 'User'}!`);
      logSystemAction('School Login', profile.name, role, profile.schoolName || 'System');
      
      let redirectRoute = '';
      switch (role) {
        case 'schoolAdmin':
          redirectRoute = '/school-admin/dashboard';
          break;
        case 'teacher':
          redirectRoute = '/teacher/dashboard';
          break;
        case 'student':
          redirectRoute = '/student/dashboard';
          break;
        case 'parent':
          redirectRoute = '/parent/dashboard';
          break;
        case 'superAdmin':
        case 'super_admin':
          redirectRoute = '/super-admin/dashboard';
          break;
        default:
          toast.error('Invalid role assignment.');
          setIsLoading(false);
          return;
      }
      window.location.href = redirectRoute;
    } catch (err) {
      console.error('[LoginPage] Login error:', err);
      const code = err?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        toast.error('Account not found or incorrect password.');
      } else if (code === 'auth/wrong-password') {
        toast.error('Incorrect password.');
      } else if (code === 'auth/too-many-requests') {
        toast.error('Too many attempts. Please try again later.');
      } else {
        const msg = err.message || '';
        if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('fetch')) {
          toast.error('Connection Error: Please run start-project.bat to start the backend server!', { duration: 6000 });
        } else {
          toast.error(msg || 'Login failed. Please try again.');
        }
      }
      setIsLoading(false);
    }
  };

  const renderForm = () => (
    <form className="space-y-6" onSubmit={handleLogin}>
      <div>
        <label htmlFor="email" className="block text-xs font-bold text-gray-500 uppercase mb-1">
          Email Address
        </label>
        <div className="mt-1">
          <input 
            id="email" 
            name="email" 
            type="email" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-greenAccent focus:border-transparent text-xs bg-gray-50 transition-colors" 
            placeholder="Enter your email address" 
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-xs font-bold text-gray-500 uppercase mb-1">
          Password
        </label>
        <div className="mt-1">
          <PasswordInput 
            id="password" 
            name="password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-greenAccent focus:border-transparent text-xs bg-gray-50 transition-colors" 
            placeholder="Enter your password" 
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 text-greenAccent focus:ring-greenAccent border-gray-300 rounded"
          />
          <label htmlFor="remember-me" className="ml-2 block text-xs text-gray-700">
            Remember me
          </label>
        </div>

        <div className="text-xs font-bold">
          <button type="button" className="text-greenAccent hover:text-green-600 transition-colors">
            Forgot Password?
          </button>
        </div>
      </div>

      <div className="pt-2">
        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-xs font-bold text-white bg-darkBlue hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-darkBlue transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              Signing in...
            </span>
          ) : (
            'Sign in'
          )}
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden bg-white flex flex-col md:block font-sans">
      
      {/* MOBILE LAYOUT */}
      <div className="md:hidden flex flex-col w-full min-h-screen">
        <div className="bg-gradient-to-br from-darkBlue to-blue-900 text-white p-8 flex flex-col items-center justify-center text-center rounded-b-[3rem] shadow-xl z-20 relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
          <BookOpen className="w-12 h-12 mb-4 z-10" />
          <h1 className="text-3xl font-extrabold mb-2 z-10">Welcome Back!</h1>
          <p className="text-xs text-blue-100 z-10">Smart School Management System</p>
        </div>

        <div className="flex-1 px-6 py-12 flex flex-col bg-gray-50 z-10 -mt-8 pt-16">
          <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Login Portal</h2>
            <p className="text-xs text-gray-500 mb-8">Sign in securely to continue.</p>
            {renderForm()}
            
            <p className="mt-6 text-center text-[10px] text-gray-400">
              Use the email address registered with your account.
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link to="/" className="text-xs font-bold text-gray-500 hover:text-darkBlue transition-colors">
              ← Back to Home
            </Link>
          </div>

          <div className="mt-auto pt-8 text-center text-[10px] text-gray-400">
             <p>© 2026 Smart School Management System</p>
             <p>Secure • Smart • Connected Education</p>
             <p className="mt-1">Version 1.0.0</p>
          </div>
        </div>
      </div>

      {/* DESKTOP LAYOUT */}
      <div 
        className={`hidden md:flex absolute top-0 left-0 h-full w-[55%] flex-col justify-center items-center z-10 transition-all duration-1000 ease-in-out bg-gray-50
          ${!isLoginView ? 'opacity-100 translate-x-0 delay-300' : 'opacity-0 -translate-x-20 pointer-events-none'}
        `}
      >
        <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-greenAccent/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-darkBlue/10 rounded-full blur-3xl"></div>
          <BookOpen className="w-48 h-48 text-gray-200/50 mb-8 z-10" />
          <h2 className="text-4xl font-extrabold text-gray-800 z-10 tracking-tight">Smart Education</h2>
          <p className="text-gray-500 mt-4 text-base z-10 max-w-md text-center">Empowering Schools with Smart Digital Management.</p>
        </div>
      </div>

      <div 
        className={`hidden md:flex absolute top-0 right-0 h-full w-[55%] flex-col justify-center items-center bg-gray-50 z-10 transition-all duration-1000 ease-in-out
          ${isLoginView ? 'opacity-100 translate-x-0 delay-300' : 'opacity-0 translate-x-20 pointer-events-none'}
        `}
      >
        <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-xl border border-gray-100 relative">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Login Portal</h2>
          <p className="text-xs text-gray-500 mb-8">Sign in securely to continue.</p>

          {renderForm()}
          
          <p className="mt-6 text-center text-[10px] text-gray-400">
            Use the email address registered with your account.
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="text-xs font-bold text-gray-500 hover:text-darkBlue transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>

      <div 
        className={`hidden md:flex absolute top-0 h-full w-[45%] flex-col justify-center items-center bg-gradient-to-br from-darkBlue to-blue-900 text-white z-30 transition-all duration-1000 ease-in-out shadow-2xl overflow-hidden
          ${isLoginView ? 'left-0 rounded-r-[3rem]' : 'left-[55%] rounded-l-[3rem]'}
        `}
      >
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-greenAccent opacity-10 rounded-full blur-2xl"></div>

        <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-sm mb-8 shadow-lg ring-1 ring-white/20 z-10">
          <BookOpen className="w-16 h-16 text-white" strokeWidth={1.5} />
        </div>

        <h1 className="text-4xl font-extrabold mb-4 tracking-tight z-10 text-center">Welcome Back!</h1>
        <h2 className="text-xl font-medium text-blue-100 mb-6 z-10 text-center px-4">Smart School Management System</h2>
        
        <p className="text-sm text-blue-200 mb-12 max-w-sm leading-relaxed text-center z-10 px-6">
          One Complete Platform for Schools, School Administrators, Teachers, Students & Parents.
          <br/><br/>
          <span className="italic text-white opacity-90">"Empowering Schools with Smart Digital Management."</span>
        </p>

        <div className="z-10">
          {!isLoginView ? (
            <button 
              type="button"
              onClick={() => setIsLoginView(true)}
              className="px-10 py-3.5 bg-white text-darkBlue font-bold rounded-xl shadow-xl hover:bg-gray-50 hover:shadow-2xl transition-all transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-white/30 text-xs uppercase tracking-wider"
            >
              Sign In
            </button>
          ) : (
            <button 
              type="button"
              onClick={() => setIsLoginView(false)}
              className="px-10 py-3.5 bg-white/10 text-white font-bold rounded-xl shadow-lg border border-white/20 hover:bg-white/20 hover:shadow-xl transition-all transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-white/30 text-xs uppercase tracking-wider"
            >
              ← Back
            </button>
          )}
        </div>

        <div className="absolute bottom-8 w-full text-center text-xs text-blue-300/60 px-6 z-10">
          <div className="flex justify-center space-x-4 mb-3 opacity-80">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer transition-colors">Contact Support</span>
          </div>
          <p>© 2026 Smart School Management System | Version 1.0.0</p>
        </div>
      </div>

    </div>
  );
};

export default LoginPage;
