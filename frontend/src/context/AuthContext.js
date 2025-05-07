import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    token: null,
    isAuthenticated: false,
    user: null,
    loading: true
  });
  
  useEffect(() => {
    // Check for token in localStorage on initial load
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setAuthState({
          token,
          isAuthenticated: true,
          user,
          loading: false
        });
      } catch (error) {
        logout();
      }
    } else {
      setAuthState(prev => ({...prev, loading: false}));
    }
  }, []);
  
  const login = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    setAuthState({
      token,
      isAuthenticated: true,
      user,
      loading: false
    });
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('username');
    
    setAuthState({
      token: null,
      isAuthenticated: false,
      user: null,
      loading: false
    });
  };
  
  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};