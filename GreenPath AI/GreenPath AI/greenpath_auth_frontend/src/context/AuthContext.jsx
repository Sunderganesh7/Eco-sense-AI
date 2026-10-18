import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('greenpath_access_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.getMe();
        if (res.success && res.data.user) {
          setUser(res.data.user);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Session validation failed:', err);
        logout();
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, [token]);

  const login = async (credentials) => {
    const res = await api.login(credentials);
    if (res.success && res.data) {
      localStorage.setItem('greenpath_access_token', res.data.access_token);
      setToken(res.data.access_token);
      setUser(res.data.user);
    }
    return res;
  };

  const register = async (data) => {
    return await api.register(data);
  };

  const logout = async () => {
    try {
      if (token) {
        await api.logout();
      }
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('greenpath_access_token');
      setToken(null);
      setUser(null);
    }
  };

  const updateUserData = (newUserObj) => {
    setUser(newUserObj);
  };

  const hasRole = (roleName) => {
    if (!user || !user.roles) return false;
    return user.roles.some((r) => r.toLowerCase() === roleName.toLowerCase());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUserData,
        hasRole,
        isAdmin: hasRole('Admin'),
        isResearcher: hasRole('Researcher'),
        isOfficer: hasRole('Officer'),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
