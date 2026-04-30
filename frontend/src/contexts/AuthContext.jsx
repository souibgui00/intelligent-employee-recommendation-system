import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize from sessionStorage on mount (guarded and tolerant)
  useEffect(() => {
    try {
      const stored = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('user') : null;
      const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('access_token') : null;
      if (stored && stored !== 'undefined' && stored !== 'null' && token) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed) setUser(parsed);
        } catch (e) {
          // ignore parse errors and clear stored value
          try { sessionStorage.removeItem('user'); } catch (e) {}
        }
      }
    } catch (e) {
      // sessionStorage might be mocked or unavailable; ignore
    }
  }, []);

  const isAuthenticated = !!user;

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (!res || !res.data) throw new Error('Login failed');
      const userData = res.data.user;
      const token = res.data.token;
      setUser(userData);
      try {
        sessionStorage.setItem('access_token', token);
        sessionStorage.setItem('user', JSON.stringify(userData));
      } catch (e) {}
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      setError(msg);
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('user');
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/register', userData);
      if (!res || !res.data) throw new Error('Registration failed');
      const newUser = res.data.user;
      const token = res.data.token;
      if (newUser) {
        setUser(newUser);
        try {
          sessionStorage.setItem('access_token', token);
          sessionStorage.setItem('user', JSON.stringify(newUser));
        } catch (e) {}
      }
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async (token) => {
    try {
      const res = await api.post('/auth/refresh', { refreshToken: token });
      if (!res || !res.data) throw new Error('Refresh failed');
      try {
        sessionStorage.setItem('access_token', res.data.access_token);
        if (res.data.refresh_token) {
          sessionStorage.setItem('refresh_token', res.data.refresh_token);
        }
      } catch (e) {}
      return res.data;
    } catch (err) {
      logout();
      throw err;
    }
  };

  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      if (!res || !res.data) throw new Error('Failed to fetch profile');
      setUser(res.data);
      return res.data;
    } catch (err) {
      setUser(null);
      throw err;
    }
  };

  const updateUserProfile = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  const clearError = () => setError(null);

  const hasRole = (role) => user?.role === role;

  return (
    <AuthContext.Provider value={{
      user, setUser, loading, error, isAuthenticated,
      login, logout, register, refreshToken,
      fetchUserProfile, updateUserProfile, clearError, hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export default AuthContext;
