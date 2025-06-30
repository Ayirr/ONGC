import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthUser, LoginCredentials, SignupCredentials, ApiError } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ongc_token');
    const userData = localStorage.getItem('ongc_user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData) as AuthUser;
        setUser({ ...parsedUser, token });
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('ongc_token');
        localStorage.removeItem('ongc_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      const response = await authApi.login(credentials);
      const { token, user: userData } = response.data;
      
      localStorage.setItem('ongc_token', token);
      localStorage.setItem('ongc_user', JSON.stringify(userData));
      
      setUser({ ...userData, token });
      
      // The redirect will be handled by the Login component
    } catch (error) {
      console.error('Login error:', error);
      const apiError = error as ApiError;
      // Extract error message from either 'detail' (FastAPI) or 'message' (mock API)
      const errorMessage = apiError.response?.data?.detail || 
                          apiError.response?.data?.message || 
                          'Login failed. Please try again.';
      throw new Error(errorMessage);
    }
  };

  const signup = async (credentials: SignupCredentials): Promise<void> => {
    try {
      const response = await authApi.signup(credentials);
      const { token, user: userData } = response.data;
      
      localStorage.setItem('ongc_token', token);
      localStorage.setItem('ongc_user', JSON.stringify(userData));
      
      setUser({ ...userData, token });
      
      // The redirect will be handled by the Signup component
    } catch (error) {
      console.error('Signup error:', error);
      const apiError = error as ApiError;
      // Extract error message from either 'detail' (FastAPI) or 'message' (mock API)
      const errorMessage = apiError.response?.data?.detail || 
                          apiError.response?.data?.message || 
                          'Signup failed. Please try again.';
      throw new Error(errorMessage);
    }
  };

  const logout = (): void => {
    localStorage.removeItem('ongc_token');
    localStorage.removeItem('ongc_user');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    signup,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};