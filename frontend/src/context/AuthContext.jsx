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
        
        // More comprehensive email not found detection
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
        // Check for invalid password
        else if (backendMessage.includes('password') && 
                 (backendMessage.includes('invalid') || 
                  backendMessage.includes('incorrect') ||
                  backendMessage.includes('wrong'))) {
          errorMessage = "Incorrect password. Please try again.";
          errorType = "invalid_password";
        }
        // Generic error
        else {
          errorMessage = error.response.data.message;
        }
      }
      
      // If we can't determine from message, check status code and try to infer
      if (errorType === "generic" && error.response?.status === 401) {
        // For 401 Unauthorized, we need to infer based on email format or other clues
        // This is a fallback - ideally your backend should return different messages
        
        // You can add logic here to test if the email exists in your system
        // For now, we'll use a simple check - if email contains valid format, assume password is wrong
        if (email.includes('@') && email.includes('.')) {
          // If email format is valid, assume password is wrong
          errorMessage = "Incorrect password. Please try again.";
          errorType = "invalid_password";
        } else {
          // If email format is invalid, show email error
          errorMessage = "Email not found. Please check your email or create a new account.";
          errorType = "email_not_found";
        }
      }
      
      // Show appropriate toast with distinct icons
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
        // Get the first error message for toast
        const firstError = Object.values(fieldErrors)[0];
        if (firstError) {
          errorMessage = firstError;
          
          // Check if it's an email already exists error
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
    isAuthenticated,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};