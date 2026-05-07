// AuthContext.jsx — lightweight authentication state for GrowCloud.
// Currently uses mock credentials. To add real auth later, replace only
// the credential check inside the `login` function with an API call.

import { createContext, useContext, useState } from 'react';

// ─── TEMPORARY MOCK CREDENTIALS ──────────────────────────────────────────────
// Replace this with a real API call when backend auth is implemented.
const MOCK_USERNAME = 'admin';
const MOCK_PASSWORD = 'growcloud';
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

// Key used to persist login state across page refreshes.
const STORAGE_KEY = 'growcloud_auth';

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true'
  );

  /**
   * Attempt to log in with the given credentials.
   * Returns true on success, false on failure.
   * Replace the body of this function to integrate real auth.
   */
  function login(username, password) {
    if (username === MOCK_USERNAME && password === MOCK_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Consume auth state anywhere in the app. */
export function useAuth() {
  return useContext(AuthContext);
}
