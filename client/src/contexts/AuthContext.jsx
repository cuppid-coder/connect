import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { AuthContext } from "./authContextDef";

export function AuthProvider({ children }) {
  const auth = useAuth();
  const [loading, setLoading] = useState(true);

  const initializeAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");
      if (token && savedUser) {
        const userData = JSON.parse(savedUser);
        if (userData && userData.email) {
          await auth.login({ email: userData.email, token });
        }
      }
    } catch (error) {
      console.error("Auth initialization failed:", error);
      // Clear potentially corrupted auth data
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  }, [auth]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <AuthContext.Provider
      value={{
        ...auth,
        loading,
        isAuthenticated: !!auth.user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
