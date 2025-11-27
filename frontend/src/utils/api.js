import axios from "axios";
import { useToast } from "vue-toastification";

const toast = useToast();

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for CSRF cookies
});

// CSRF token management
let csrfToken = null;
let csrfTokenExpiry = null;

// Get CSRF token
async function getCSRFToken() {
  try {
    const now = Date.now();

    // Return cached token if still valid
    if (csrfToken && csrfTokenExpiry && now < csrfTokenExpiry) {
      return csrfToken;
    }

    // Fetch new token with full URL to avoid interceptor recursion
    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const response = await axios.get(`${baseURL}/csrf-token`, {
      withCredentials: true,
    });

    csrfToken = response.data.csrfToken;
    csrfTokenExpiry = now + 55 * 60 * 1000; // 55 minutes

    console.log("CSRF token fetched successfully");
    return csrfToken;
  } catch (error) {
    console.error("Failed to get CSRF token:", error);
    // Don't throw error, just return null and let request proceed
    return null;
  }
}

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    // Add auth token if exists
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add CSRF token for non-GET requests
    if (
      ["POST", "PUT", "DELETE", "PATCH"].includes(config.method.toUpperCase())
    ) {
      const token = await getCSRFToken();
      if (token) {
        config.headers["x-csrf-token"] = token;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 403 CSRF errors
    if (
      error.response?.status === 403 &&
      error.response?.data?.error === "Invalid CSRF token" &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      // Clear cached token and retry
      csrfToken = null;
      csrfTokenExpiry = null;

      const token = await getCSRFToken();
      if (token) {
        originalRequest.headers["x-csrf-token"] = token;
        return api(originalRequest);
      }
    }

    // Handle 401 unauthorized - redirect to login
    if (error.response?.status === 401 && !originalRequest._retry) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // Don't show toast here - let individual stores handle their error messages
    // This prevents duplicate error messages

    return Promise.reject(error);
  }
);

export default api;
