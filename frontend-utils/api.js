/**
 * API Client with CSRF Protection
 * Ready-to-use API methods for common operations
 */

import csrfManager from "./csrfManager.js";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Helper to handle API responses
   */
  async handleResponse(response) {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error || data.message || `HTTP error! status: ${response.status}`
      );
    }

    return data;
  }

  /**
   * GET request
   */
  async get(endpoint) {
    const response = await csrfManager.secureRequest(
      `${this.baseURL}${endpoint}`,
      {
        method: "GET",
      }
    );
    return this.handleResponse(response);
  }

  /**
   * POST request (automatically includes CSRF token)
   */
  async post(endpoint, data) {
    const response = await csrfManager.secureRequest(
      `${this.baseURL}${endpoint}`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse(response);
  }

  /**
   * PUT request (automatically includes CSRF token)
   */
  async put(endpoint, data) {
    const response = await csrfManager.secureRequest(
      `${this.baseURL}${endpoint}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse(response);
  }

  /**
   * DELETE request (automatically includes CSRF token)
   */
  async delete(endpoint) {
    const response = await csrfManager.secureRequest(
      `${this.baseURL}${endpoint}`,
      {
        method: "DELETE",
      }
    );
    return this.handleResponse(response);
  }

  // ============================================
  // Authentication APIs
  // ============================================

  async register(userData) {
    return this.post("/api/auth/register", userData);
  }

  async login(credentials) {
    const data = await this.post("/api/auth/login", credentials);
    if (data.token) {
      localStorage.setItem("authToken", data.token);
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }
    }
    return data;
  }

  async logout() {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      await this.post("/api/auth/logout", { refreshToken });
    }
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    csrfManager.clearToken();
  }

  async forgotPassword(email) {
    return this.post("/api/auth/forgot-password", { email });
  }

  async resetPassword(token, password) {
    return this.post(`/api/auth/reset-password/${token}`, { password });
  }

  // ============================================
  // Product APIs
  // ============================================

  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/api/products${queryString ? "?" + queryString : ""}`);
  }

  async getProduct(id) {
    return this.get(`/api/products/${id}`);
  }

  async createProduct(productData) {
    return this.post("/api/products", productData);
  }

  async updateProduct(id, productData) {
    return this.put(`/api/products/${id}`, productData);
  }

  async deleteProduct(id) {
    return this.delete(`/api/products/${id}`);
  }

  // Variant management
  async addVariant(productId, variantData) {
    return this.post(`/api/products/${productId}/variants`, variantData);
  }

  async updateVariant(productId, variantId, variantData) {
    return this.put(
      `/api/products/${productId}/variants/${variantId}`,
      variantData
    );
  }

  async deleteVariant(productId, variantId) {
    return this.delete(`/api/products/${productId}/variants/${variantId}`);
  }

  // ============================================
  // Cart APIs
  // ============================================

  async getCart() {
    return this.get("/api/cart");
  }

  async addToCart(productId, quantity = 1, variantId = null) {
    return this.post("/api/cart/add", { productId, quantity, variantId });
  }

  async updateCartItem(productId, quantity, variantId = null) {
    return this.put("/api/cart/update", { productId, quantity, variantId });
  }

  async removeFromCart(productId, variantId = null) {
    return this.delete(`/api/cart/remove/${productId}`, { variantId });
  }

  async clearCart() {
    return this.delete("/api/cart/clear");
  }

  async applyCoupon(code) {
    return this.post("/api/cart/apply-coupon", { code });
  }

  async removeCoupon() {
    return this.delete("/api/cart/remove-coupon");
  }

  // ============================================
  // Coupon APIs
  // ============================================

  // Admin: Get all coupons
  async getCoupons(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/api/coupons${queryString ? "?" + queryString : ""}`);
  }

  // Admin: Get single coupon
  async getCoupon(id) {
    return this.get(`/api/coupons/${id}`);
  }

  // Admin: Create coupon
  async createCoupon(couponData) {
    return this.post("/api/coupons", couponData);
  }

  // Admin: Update coupon
  async updateCoupon(id, couponData) {
    return this.put(`/api/coupons/${id}`, couponData);
  }

  // Admin: Delete coupon
  async deleteCoupon(id) {
    return this.delete(`/api/coupons/${id}`);
  }

  // Public: Validate coupon
  async validateCoupon(code, orderTotal = 0) {
    return this.post("/api/coupons/validate", { code, orderTotal });
  }

  // ============================================
  // Order APIs
  // ============================================

  async checkout() {
    return this.post("/api/orders/checkout");
  }

  async getMyOrders() {
    return this.get("/api/orders/my");
  }

  async getOrder(id) {
    return this.get(`/api/orders/${id}`);
  }

  async updateOrderStatus(id, status) {
    return this.put(`/api/orders/${id}/status`, { status });
  }

  // ============================================
  // Payment APIs
  // ============================================

  async createPaymentIntent(orderId) {
    return this.post("/api/payment/create-payment-intent", { orderId });
  }

  async confirmPayment(paymentIntentId, orderId) {
    return this.post("/api/payment/confirm-payment", {
      paymentIntentId,
      orderId,
    });
  }

  // ============================================
  // Review APIs
  // ============================================

  async addReview(productId, rating, comment) {
    return this.post("/api/reviews", { productId, rating, comment });
  }

  async getReviews(productId) {
    return this.get(`/api/reviews/${productId}`);
  }

  async deleteReview(id) {
    return this.delete(`/api/reviews/${id}`);
  }

  // ============================================
  // User Profile APIs
  // ============================================

  async getProfile() {
    return this.get("/api/user/profile");
  }

  async updateProfile(profileData) {
    return this.put("/api/user/profile", profileData);
  }

  async changePassword(currentPassword, newPassword) {
    return this.post("/api/user/change-password", {
      currentPassword,
      newPassword,
    });
  }

  async getAddresses() {
    return this.get("/api/user/addresses");
  }

  async addAddress(addressData) {
    return this.post("/api/user/addresses", addressData);
  }

  async updateAddress(id, addressData) {
    return this.put(`/api/user/addresses/${id}`, addressData);
  }

  async deleteAddress(id) {
    return this.delete(`/api/user/addresses/${id}`);
  }

  // ============================================
  // Admin APIs
  // ============================================

  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/api/admin/users${queryString ? "?" + queryString : ""}`);
  }

  async getUser(id) {
    return this.get(`/api/admin/users/${id}`);
  }

  async updateUser(id, userData) {
    return this.put(`/api/admin/users/${id}`, userData);
  }

  async deleteUser(id) {
    return this.delete(`/api/admin/users/${id}`);
  }

  async getAdminOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/api/admin/orders${queryString ? "?" + queryString : ""}`);
  }

  async getAdminStats() {
    return this.get("/api/admin/stats");
  }

  // ============================================
  // Analytics APIs
  // ============================================

  async getSalesAnalytics(period = "7d") {
    return this.get(`/api/analytics/sales?period=${period}`);
  }

  async getProductAnalytics(limit = 10) {
    return this.get(`/api/analytics/products?limit=${limit}`);
  }

  async getCustomerAnalytics() {
    return this.get("/api/analytics/customers");
  }
}

// Export singleton instance
const api = new APIClient();
export default api;
