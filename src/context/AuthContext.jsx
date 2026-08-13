/**
 * context/AuthContext.jsx — Node.js Authentication State Provider
 *
 * Provides { user, loading, login, logout } to the entire app.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { normalizeRole } from '../utils/db';

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
    const baseApiUrl = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? (window.location.port === '5199' ? 'http://localhost:5001/api' : `${window.location.origin}/api`)
      : '/api';

    try {
      response = await fetch(`${baseApiUrl}/auth/login`, {
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

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new Error('Server returned an invalid response. Please try again.');
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
