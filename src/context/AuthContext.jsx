/**
 * context/AuthContext.jsx — Node.js Authentication State Provider
 *
 * Provides { user, loading, login, logout } to the entire app.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

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
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email.trim(), password })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Login failed. Please check your credentials.');
    }

    const { token, user } = data;
    
    // Save credentials to session storage
    sessionStorage.setItem('jwtToken', token);
    sessionStorage.setItem('authUser', JSON.stringify(user));
    
    if (user.role === 'superAdmin' || user.role === 'super_admin') {
      sessionStorage.setItem('superAdminAuth', 'true');
    }

    setUserProfile(user);
    return user;
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
    isSuperAdmin: userProfile?.role === 'superAdmin' || userProfile?.role === 'super_admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
