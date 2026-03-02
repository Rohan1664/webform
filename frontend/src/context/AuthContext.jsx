import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { authAPI } from "../api/auth.api";
import toast from "react-hot-toast";

const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // ================= CHECK AUTH ON LOAD =================
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
      } catch (err) {
        localStorage.clear();
      }
    }

    setLoading(false);
  }, []);

  // ================= LOGIN =================
  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });

      const { user, token, refreshToken } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));

      setUser(user);
      setToken(token);

      toast.success(`Welcome back, ${user.firstName || 'User'}!`);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = "Invalid email or password";
      let errorType = "generic";
      
      // Check the actual error message from backend
      if (error.response?.data?.message) {
        const backendMessage = error.response.data.message.toLowerCase();
        
        if (backendMessage.includes('email') && 
            (backendMessage.includes('not found') || 
             backendMessage.includes('does not exist') || 
             backendMessage.includes('no account') ||
             backendMessage.includes('unregistered') ||
             backendMessage.includes('invalid email') ||
             backendMessage.includes('user not found') ||
             backendMessage.includes('account not found'))) {
          errorMessage = "Email not found. Please check your email or create a new account.";
          errorType = "email_not_found";
        }
        else if (backendMessage.includes('password') && 
                 (backendMessage.includes('invalid') || 
                  backendMessage.includes('incorrect') ||
                  backendMessage.includes('wrong'))) {
          errorMessage = "Incorrect password. Please try again.";
          errorType = "invalid_password";
        }
        else {
          errorMessage = error.response.data.message;
        }
      }
      
      if (errorType === "generic" && error.response?.status === 401) {
        if (email.includes('@') && email.includes('.')) {
          errorMessage = "Incorrect password. Please try again.";
          errorType = "invalid_password";
        } else {
          errorMessage = "Email not found. Please check your email or create a new account.";
          errorType = "email_not_found";
        }
      }
      
      if (errorType === "email_not_found") {
        toast.error(errorMessage, {
          duration: 5000,
          icon: '📧',
        });
      } else if (errorType === "invalid_password") {
        toast.error(errorMessage, {
          duration: 5000,
          icon: '🔑',
        });
      } else {
        toast.error(errorMessage);
      }
      
      return {
        success: false,
        error: errorMessage,
        errorType: errorType,
        fieldErrors: error.response?.data?.errors || {}
      };
    }
  };

  // ================= REGISTER =================
  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);

      const { user, token, refreshToken } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));

      setUser(user);
      setToken(token);

      toast.success(`Account created successfully! Welcome, ${user.firstName || 'User'}!`);
      
      return { success: true };
    } catch (error) {
      let errorMessage = "Registration failed";
      let fieldErrors = {};
      let errorType = "generic";
      
      if (error.response?.data?.errors) {
        fieldErrors = error.response.data.errors;
        const firstError = Object.values(fieldErrors)[0];
        if (firstError) {
          errorMessage = firstError;
          
          if (firstError.toLowerCase().includes('email') && 
              (firstError.toLowerCase().includes('already') || 
               firstError.toLowerCase().includes('exist'))) {
            errorType = "email_already_exists";
          }
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        errorType: errorType,
        fieldErrors
      };
    }
  };

  // ================= LOGOUT =================
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    setUser(null);
    setToken(null);
    
    toast.success("Logged out successfully");
  }, []);

  // ================= OAUTH LOGIN =================
  const oauthLogin = useCallback((userData, token, refreshToken) => {
    console.log('✅ OAuth login successful:', userData);
    
    // Set user and token in state
    setUser(userData);
    setToken(token);
    
    // Tokens are already stored in localStorage by the callback component
    // But we ensure they're also in state
    
    toast.success(`Welcome, ${userData.firstName || userData.email}!`);
  }, []);

  // ================= HELPERS =================
  const isAuthenticated = useCallback(() => {
    return !!user && !!token;
  }, [user, token]);

  const isAdmin = useCallback(() => {
    return user?.role === "admin";
  }, [user]);

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    oauthLogin, // ✅ ADDED THIS
    isAuthenticated,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};