import {
  createContext,
  useContext,
  useState,
} from 'react';

import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored =
        localStorage.getItem('smartops_user');

      return stored
        ? JSON.parse(stored)
        : null;
    } catch {
      localStorage.removeItem('smartops_user');
      return null;
    }
  });

  async function login(email, password) {
    const res = await api.post(
      '/auth/login',
      {
        email,
        password,
      }
    );

    const {
      token,
      user: userData,
    } = res.data;

    localStorage.setItem(
      'smartops_token',
      token
    );

    localStorage.setItem(
      'smartops_user',
      JSON.stringify(userData)
    );

    setUser(userData);

    return userData;
  }

  async function register(
    name,
    email,
    password
  ) {
    const res = await api.post(
      '/auth/register',
      {
        name,
        email,
        password,
      }
    );

    return res.data;
  }

  function logout() {
    localStorage.removeItem(
      'smartops_token'
    );

    localStorage.removeItem(
      'smartops_user'
    );

    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(
    AuthContext
  );

  if (!context) {
    throw new Error(
      'useAuth باید داخل AuthProvider استفاده شود'
    );
  }

  return context;
}