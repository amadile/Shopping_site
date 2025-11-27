import api from "@/utils/api";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useToast } from "vue-toastification";

const toast = useToast();

export const useCartStore = defineStore("cart", () => {
  // State
  const cart = ref(null);
  const loading = ref(false);

  // Getters
  const itemCount = computed(() => {
    if (!cart.value?.items) return 0;
    return cart.value.items.reduce((total, item) => total + item.quantity, 0);
  });

  const subtotal = computed(() => cart.value?.subtotal || 0);
  const tax = computed(() => cart.value?.tax || 0);
  const discount = computed(
    () => cart.value?.appliedCoupon?.discountAmount || 0
  );
  const total = computed(() => cart.value?.total || 0);
  const coupon = computed(() => cart.value?.appliedCoupon || null);

  // Actions
  async function fetchCart() {
    loading.value = true;
    try {
      const response = await api.get("/cart");
      cart.value = response.data;
      return response.data;
    } catch (error) {
      console.error("Fetch cart error:", error);
    } finally {
      loading.value = false;
    }
  }

  async function addToCart(productId, quantity = 1, variantId = null) {
    loading.value = true;
    try {
      const payload = { productId, quantity };
      // Only include variantId if it's not null/undefined
      if (variantId) {
        payload.variantId = variantId;
      }

      const response = await api.post("/cart/add", payload);
      cart.value = response.data;
      toast.success("Item added to cart");
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to add item to cart";
      toast.error(errorMessage);
      console.error("Cart add error:", error.response?.data);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function updateQuantity(productId, quantity, variantId = null) {
    loading.value = true;
    try {
      const payload = { productId, quantity };
      // Only include variantId if it's not null/undefined
      if (variantId) {
        payload.variantId = variantId;
      }

      const response = await api.put("/cart/update", payload);
      cart.value = response.data;
      toast.success("Cart updated");
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to update cart";
      toast.error(errorMessage);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function removeFromCart(productId, variantId = null) {
    loading.value = true;
    try {
      console.log("removeFromCart called with:", {
        productId,
        variantId,
        productIdType: typeof productId,
      });

      // Validate productId before sending
      if (!productId || typeof productId !== "string") {
        throw new Error("Invalid product ID provided");
      }

      const payload = variantId ? { variantId } : {};
      const response = await api.delete(`/cart/remove/${productId}`, {
        data: payload,
      });
      cart.value = response.data;
      toast.success("Item removed from cart");
      return response.data;
    } catch (error) {
      console.error("removeFromCart error:", {
        productId,
        variantId,
        error: error.response?.data || error.message,
      });
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to remove item";
      toast.error(errorMessage);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function clearCart() {
    loading.value = true;
    try {
      const response = await api.delete("/cart/clear");
      cart.value = response.data;
      toast.success("Cart cleared");
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to clear cart";
      toast.error(errorMessage);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function applyCoupon(code) {
    loading.value = true;
    try {
      const response = await api.post("/cart/apply-coupon", { code });
      cart.value = response.data;
      toast.success("Coupon applied successfully!");
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to apply coupon";
      toast.error(errorMessage);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function removeCoupon() {
    loading.value = true;
    try {
      const response = await api.delete("/cart/remove-coupon");
      cart.value = response.data;
      toast.info("Coupon removed");
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to remove coupon";
      toast.error(errorMessage);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    cart,
    loading,
    // Getters
    itemCount,
    subtotal,
    tax,
    discount,
    total,
    coupon,
    // Actions
    fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
  };
});
