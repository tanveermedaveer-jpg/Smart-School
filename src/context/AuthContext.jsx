/**
 * context/AuthContext.jsx — Node.js Authentication State Provider
 *
 * Provides { user, loading, login, logout } to the entire app.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { normalizeRole, BASE_URL } from '../utils/db';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from sessionStorage on startup
    const token = sessionStorage.getItem('jwtToken');
    const authUser = sessionStorage.getItem('authUser');
    
    if (token && authUser) {
      try {
        setUserProfile(JSON.parse(authUser));
      } catch (e) {
        sessionStorage.removeItem('jwtToken');
        sessionStorage.removeItem('authUser');
        sessionStorage.removeItem('superAdminAuth');
      }
    } else {
      // If one of them is missing, clean up both to avoid half-logged-in states
      sessionStorage.removeItem('jwtToken');
      sessionStorage.removeItem('authUser');
      sessionStorage.removeItem('superAdminAuth');
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    let response;

    try {
      response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email.trim(), password })
      });
    } catch (networkError) {
      const err = new Error('Connection Error: Please run start-project.bat to start the backend server!');
      err.isNetworkError = true;
      throw err;
    }

    // Check if Vercel deployment protection intercepted the request
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      console.error('[Auth] Non-JSON response received. Status:', response.status, 'Content-Type:', contentType);
      throw new Error('Server returned an unexpected response. The API may not be reachable. Please check your deployment settings.');
    }

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new Error('Server returned an invalid response. Please try again.');
    }

    // Detect Vercel deployment protection response
    if (data.protection && data.protection.vercel_auth_enabled) {
      throw new Error('Deployment protection is blocking API access. Please disable Vercel Authentication in your project settings.');
    }

    if (!response.ok) {
      const err = new Error(data.message || 'Login failed. Please check your credentials.');
      err.status = response.status;
      throw err;
    }

    const { token, user } = data;
    const normalizedRoleName = normalizeRole(user.role);
    const normalizedUser = {
      ...user,
      role: normalizedRoleName
    };
    
    // Save credentials to session storage
    sessionStorage.setItem('jwtToken', token);
    sessionStorage.setItem('authUser', JSON.stringify(normalizedUser));
    
    if (normalizedRoleName === 'superAdmin') {
      sessionStorage.setItem('superAdminAuth', 'true');
    }

    setUserProfile(normalizedUser);
    return normalizedUser;
  };

  const logout = async () => {
    sessionStorage.removeItem('jwtToken');
    sessionStorage.removeItem('authUser');
    sessionStorage.removeItem('superAdminAuth');
    setUserProfile(null);
  };

  useEffect(() => {
    if (!userProfile) return;

    const checkAuthStatus = async () => {
      const token = sessionStorage.getItem('jwtToken');
      if (!token) return;

      try {
        const res = await fetch(`${BASE_URL}/users/${userProfile.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            logout();
          }
        }
      } catch (err) {
        console.warn('[Auth Check] Network error during periodic validation:', err);
      }
    };

    checkAuthStatus();
    const interval = setInterval(checkAuthStatus, 5000);
    window.addEventListener('focus', checkAuthStatus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkAuthStatus);
    };
  }, [userProfile?.id]);

  const value = {
    firebaseUser: userProfile, // For compatibility
    user: userProfile,
    loading,
    login,
    logout,
    isAuthenticated: !!userProfile,
    isSuperAdmin: normalizeRole(userProfile?.role) === 'superAdmin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
