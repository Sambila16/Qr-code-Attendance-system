import { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('presence_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) localStorage.setItem('presence_user', JSON.stringify(user));
    else localStorage.removeItem('presence_user');
  }, [user]);

  async function login(registration_number, password) {
    setLoading(true);
    try {
      const { data } = await client.post('/auth/login', { registration_number, password });
      localStorage.setItem('presence_token', data.token);
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('presence_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
