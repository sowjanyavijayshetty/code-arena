import React, { createContext, useContext, useState } from 'react';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(() => !!localStorage.getItem('arena_admin_token'));
  const [token, setToken] = useState(() => localStorage.getItem('arena_admin_token') || '');

  const login = (t) => {
    localStorage.setItem('arena_admin_token', t);
    setToken(t);
    setIsAdmin(true);
  };

  const logout = () => {
    localStorage.removeItem('arena_admin_token');
    setToken('');
    setIsAdmin(false);
  };

  return (
    <AdminContext.Provider value={{ isAdmin, token, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
