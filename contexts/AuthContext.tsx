import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import api from "@/lib/api";

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_premium: boolean;
  has_active_premium: boolean;
  premium_expires_at?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, password2: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "auth_token";
const USER_KEY = "user_data";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      const storedUser = await AsyncStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        // Set token in API instance
        api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
        // Refresh user data from backend
        await refreshUser();
      }
    } catch (error) {
      console.error("Error loading stored auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post("/auth/login/", {
        username,
        password,
      });

      const { access, refresh, user: userData } = response.data;
      
      // If user data not in login response, fetch it
      let finalUserData = userData;
      if (!finalUserData && access) {
        api.defaults.headers.common["Authorization"] = `Bearer ${access}`;
        const profileResponse = await api.get("/auth/profile/");
        finalUserData = profileResponse.data;
      }
      
      // Store tokens and user
      await AsyncStorage.setItem(TOKEN_KEY, access);
      if (refresh) {
        await AsyncStorage.setItem("auth_refresh_token", refresh);
      }
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(finalUserData));
      
      // Set token in API instance (interceptor will handle this, but set it here too)
      api.defaults.headers.common["Authorization"] = `Bearer ${access}`;
      
      setToken(access);
      setUser(finalUserData);
    } catch (error: any) {
      console.error("Login error:", error);
      throw new Error(
        error.response?.data?.detail || "Login failed. Please check your credentials."
      );
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    password2: string
  ) => {
    try {
      const response = await api.post("/auth/register/", {
        username,
        email,
        password,
        password2,
        platform: Platform.OS,
      });

      const { user: userData, message } = response.data;
      
      // After registration, automatically log in
      await login(username, password);
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorMessage =
        error.response?.data?.password?.[0] ||
        error.response?.data?.email?.[0] ||
        error.response?.data?.username?.[0] ||
        error.response?.data?.detail ||
        "Registration failed. Please try again.";
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      delete api.defaults.headers.common["Authorization"];
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const refreshUser = async () => {
    if (!token) return;

    try {
      const response = await api.get("/auth/profile/");
      const userData = response.data;
      setUser(userData);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error("Error refreshing user:", error);
      // If token is invalid, logout
      if (error.response?.status === 401) {
        await logout();
      }
    }
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user && !!token,
    isLoading,
    token,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

