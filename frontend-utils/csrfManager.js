/**
 * CSRF Token Manager
 * Handles fetching and caching CSRF tokens for API requests
 */

class CSRFTokenManager {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
    this.tokenLifetime = 3600000; // 1 hour in milliseconds
  }

  /**
   * Fetch a new CSRF token from the server
   */
  async fetchToken() {
    try {
      const response = await fetch("/api/csrf-token", {
        credentials: "include", // Important for cookies
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.statusText}`);
      }

      const data = await response.json();
      this.token = data.csrfToken;
      this.tokenExpiry = Date.now() + this.tokenLifetime;

      return this.token;
    } catch (error) {
      console.error("Error fetching CSRF token:", error);
      throw error;
    }
  }

  /**
   * Get the current token, fetching a new one if needed
   */
  async getToken() {
    // If token doesn't exist or is expired, fetch a new one
    if (!this.token || Date.now() >= this.tokenExpiry) {
      await this.fetchToken();
    }

    return this.token;
  }

  /**
   * Clear the cached token (useful for logout)
   */
  clearToken() {
    this.token = null;
    this.tokenExpiry = null;
  }

  /**
   * Make a secure API request with CSRF token
   * @param {string} url - API endpoint
   * @param {object} options - Fetch options
   */
  async secureRequest(url, options = {}) {
    const method = options.method || "GET";
    const requiresCsrf = ["POST", "PUT", "DELETE", "PATCH"].includes(
      method.toUpperCase()
    );

    // Prepare headers
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Add CSRF token for state-changing requests
    if (requiresCsrf) {
      const token = await this.getToken();
      headers["X-CSRF-Token"] = token;
    }

    // Add Authorization header if token exists in localStorage
    const authToken = localStorage.getItem("authToken");
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: "include", // Important for cookies
      });

      // If CSRF token is invalid, clear it and retry once
      if (response.status === 403 && requiresCsrf) {
        this.clearToken();
        const newToken = await this.getToken();
        headers["X-CSRF-Token"] = newToken;

        return await fetch(url, {
          ...options,
          headers,
          credentials: "include",
        });
      }

      return response;
    } catch (error) {
      console.error("API request error:", error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const csrfManager = new CSRFTokenManager();
export default csrfManager;

// Also export convenience methods
export const getCSRFToken = () => csrfManager.getToken();
export const clearCSRFToken = () => csrfManager.clearToken();
export const secureRequest = (url, options) =>
  csrfManager.secureRequest(url, options);
