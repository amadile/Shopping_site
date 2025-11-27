import api from "@/utils/api";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useToast } from "vue-toastification";
import { useSocketStore } from "./socket";

const toast = useToast();

export const useAuthStore = defineStore("auth", () => {
  // State
  const user = ref(null);
  const token = ref(null);
  const refreshToken = ref(null);
  const loading = ref(false);

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isAdmin = computed(() => user.value?.role === "admin");
  const isVendor = computed(() => user.value?.role === "vendor");
  const isCustomer = computed(() => user.value?.role === "customer");

  // Actions
  function initializeAuth() {
    const storedToken = localStorage.getItem("authToken");
    const storedRefreshToken = localStorage.getItem("refreshToken");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      token.value = storedToken;
      refreshToken.value = storedRefreshToken;
      user.value = JSON.parse(storedUser);
    }
  }

  async function register(userData) {
    loading.value = true;
    try {
      const response = await api.post("/auth/register", userData);
      toast.success(
        "Registration successful! Please check your email to verify your account."
      );
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function login(credentials) {
    loading.value = true;
    try {
      const response = await api.post("/auth/login", credentials);
      const {
        token: authToken,
        refreshToken: refToken,
        user: userData,
      } = response.data;

      // Save to state
      token.value = authToken;
      refreshToken.value = refToken;
      user.value = userData;

      // Save to localStorage
      localStorage.setItem("authToken", authToken);
      localStorage.setItem("refreshToken", refToken);
      localStorage.setItem("user", JSON.stringify(userData));

      // Connect socket
      const socketStore = useSocketStore();
      socketStore.connect();

      toast.success(`Welcome back, ${userData.name}!`);
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    loading.value = true;
    try {
      if (refreshToken.value) {
        await api.post("/auth/logout", { refreshToken: refreshToken.value });
      }

      // Clear state
      token.value = null;
      refreshToken.value = null;
      user.value = null;

      // Clear localStorage
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      // Disconnect socket
      const socketStore = useSocketStore();
      socketStore.disconnect();

      toast.info("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      loading.value = false;
    }
  }

  async function fetchProfile() {
    loading.value = true;
    try {
      const response = await api.get("/user/profile");
      user.value = response.data;
      localStorage.setItem("user", JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function updateProfile(profileData) {
    loading.value = true;
    try {
      const response = await api.put("/user/profile", profileData);
      user.value = response.data;
      localStorage.setItem("user", JSON.stringify(response.data));
      toast.success("Profile updated successfully");
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function changePassword(passwordData) {
    loading.value = true;
    try {
      await api.post("/user/change-password", passwordData);
      toast.success("Password changed successfully");
    } catch (error) {
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function forgotPassword(email) {
    loading.value = true;
    try {
      await api.post("/auth/forgot-password", { email });
      toast.success("Password reset link sent to your email");
    } catch (error) {
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function resetPassword(token, password) {
    loading.value = true;
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      toast.success("Password reset successful! You can now login.");
    } catch (error) {
      throw error;
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    user,
    token,
    loading,
    // Getters
    isAuthenticated,
    isAdmin,
    isVendor,
    isCustomer,
    // Actions
    initializeAuth,
    register,
    login,
    logout,
    fetchProfile,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
  };
});
