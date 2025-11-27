<template>
  <DefaultLayout>
    <div class="max-w-7xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-8">Shopping Cart</h1>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div
          class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"
        ></div>
        <p class="mt-4 text-gray-600">Loading cart...</p>
      </div>

      <!-- Empty Cart -->
      <div
        v-else-if="!cart || cart.items.length === 0"
        class="text-center py-12"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-24 h-24 mx-auto text-gray-400 mb-4"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
          />
        </svg>
        <h2 class="text-2xl font-semibold mb-4">Your cart is empty</h2>
        <p class="text-gray-600 mb-6">Add some products to get started!</p>
        <button @click="$router.push('/products')" class="btn btn-primary">
          Browse Products
        </button>
      </div>

      <!-- Cart Content -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Cart Items -->
        <div class="lg:col-span-2 space-y-4">
          <div
            v-for="item in cart.items"
            :key="item._id"
            class="card flex flex-col md:flex-row gap-4"
          >
            <!-- Product Image -->
            <div
              @click="goToProduct(item.product)"
              class="relative w-full md:w-32 h-32 bg-gray-200 rounded cursor-pointer overflow-hidden flex-shrink-0"
            >
              <img
                v-if="item.product?.images && item.product.images.length > 0"
                :src="getProductImage(item.product)"
                :alt="item.product?.name || 'Product'"
                class="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            <!-- Product Info -->
            <div class="flex-1">
              <h3
                @click="goToProduct(item.product)"
                class="font-semibold text-lg mb-2 cursor-pointer hover:text-primary"
              >
                {{ item.product?.name || 'Product' }}
              </h3>

              <p v-if="item.variantDetails" class="text-gray-600 text-sm mb-2">
                Variant: {{ item.variantDetails.size || item.variantDetails.color || item.variantDetails.style || 'Custom' }}
              </p>

              <p class="text-primary font-bold mb-4">
                {{ formatCurrency(item.variantDetails?.price || item.product?.price || 0) }}
              </p>

              <!-- Quantity Controls -->
              <div class="flex items-center gap-4">
                <div class="flex items-center border rounded-lg">
                  <button
                    @click="updateQuantity(item, item.quantity - 1)"
                    :disabled="updatingItem === item._id"
                    class="px-3 py-1 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <input
                    :value="item.quantity"
                    @change="updateQuantity(item, $event.target.value)"
                    type="number"
                    min="1"
                    class="w-16 text-center py-1 border-x"
                  />
                  <button
                    @click="updateQuantity(item, item.quantity + 1)"
                    :disabled="updatingItem === item._id"
                    class="px-3 py-1 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>

                <button
                  @click="removeItem(item)"
                  :disabled="removingItem === item._id"
                  class="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            </div>

            <!-- Item Total -->
            <div class="text-right">
              <p class="font-bold text-xl">
                {{ formatCurrency((item.variantDetails?.price || item.product.price) * item.quantity) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="lg:col-span-1">
          <div class="card sticky top-4">
            <h2 class="text-xl font-bold mb-4">Order Summary</h2>

            <!-- Coupon Code -->
            <div class="mb-4">
              <label class="block font-medium mb-2">Coupon Code:</label>
              <div class="flex gap-2">
                <input
                  v-model="couponCode"
                  type="text"
                  placeholder="Enter code"
                  class="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  @click="applyCoupon"
                  :disabled="applyingCoupon || !couponCode"
                  class="btn btn-secondary"
                >
                  Apply
                </button>
              </div>

              <!-- Applied Coupon -->
              <div
                v-if="cart.coupon"
                class="mt-2 flex items-center justify-between"
              >
                <span class="text-green-600">
                  ✓ {{ cart.coupon.code }} applied
                </span>
                <button
                  @click="removeCoupon"
                  class="text-red-600 text-sm hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>

            <div class="border-t pt-4 space-y-2 mb-4">
              <div class="flex justify-between">
                <span class="text-gray-600">Subtotal:</span>
                <span class="font-semibold">{{
                  formatCurrency(cartStore.subtotal)
                }}</span>
              </div>

              <div
                v-if="cartStore.discount > 0"
                class="flex justify-between text-green-600"
              >
                <span>Discount:</span>
                <span>-{{ formatCurrency(cartStore.discount) }}</span>
              </div>

              <div class="flex justify-between">
                <span class="text-gray-600">Tax:</span>
                <span class="font-semibold">{{
                  formatCurrency(cartStore.tax)
                }}</span>
              </div>

              <div class="flex justify-between text-xl font-bold border-t pt-2">
                <span>Total:</span>
                <span class="text-primary">{{
                  formatCurrency(cartStore.total)
                }}</span>
              </div>
            </div>

            <button
              @click="proceedToCheckout"
              class="btn btn-primary w-full mb-4"
            >
              Proceed to Checkout
            </button>

            <button @click="continueShopping" class="btn btn-secondary w-full">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import DefaultLayout from "@/components/layouts/DefaultLayout.vue";
import { useCartStore } from "@/stores/cart";
import { formatCurrency } from "@/utils/helpers";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";

const router = useRouter();
const cartStore = useCartStore();
const toast = useToast();

// State
const loading = ref(false);
const couponCode = ref("");
const applyingCoupon = ref(false);
const updatingItem = ref(null);
const removingItem = ref(null);

// Computed
const cart = computed(() => cartStore.cart);

// Fetch cart
const fetchCart = async () => {
  loading.value = true;
  try {
    await cartStore.fetchCart();
  } catch (err) {
    toast.error("Failed to load cart");
  } finally {
    loading.value = false;
  }
};

// Update quantity
const updateQuantity = async (item, newQuantity) => {
  const qty = parseInt(newQuantity);

  if (qty < 1) {
    removeItem(item);
    return;
  }

  updatingItem.value = item._id;
  try {
    // Handle both populated (object) and unpopulated (string ID) product references
    const productId = typeof item.product === 'string' ? item.product : item.product._id;
    
    await cartStore.updateQuantity(
      productId,
      qty,
      item.variantId || null
    );
    toast.success("Cart updated");
  } catch (err) {
    console.error('Update quantity error:', err.response?.data);
    toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to update cart");
  } finally {
    updatingItem.value = null;
  }
};

// Remove item
const removeItem = async (item) => {
  if (!confirm("Remove this item from cart?")) return;

  removingItem.value = item._id;
  try {
    // Handle both populated (object) and unpopulated (string ID) product references
    const productId = typeof item.product === 'string' ? item.product : item.product._id;
    
    console.log('Removing item:', { productId, variantId: item.variantId });
    
    await cartStore.removeFromCart(productId, item.variantId || null);
    toast.success("Item removed from cart");
  } catch (err) {
    console.error('Remove item error:', err.response?.data);
    toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to remove item");
  } finally {
    removingItem.value = null;
  }
};

// Apply coupon
const applyCoupon = async () => {
  if (!couponCode.value.trim()) return;

  applyingCoupon.value = true;
  try {
    await cartStore.applyCoupon(couponCode.value);
    toast.success("Coupon applied successfully");
    couponCode.value = "";
  } catch (err) {
    toast.error(err.response?.data?.message || "Invalid coupon code");
  } finally {
    applyingCoupon.value = false;
  }
};

// Remove coupon
const removeCoupon = async () => {
  try {
    await cartStore.removeCoupon();
    toast.success("Coupon removed");
  } catch (err) {
    toast.error("Failed to remove coupon");
  }
};

// Go to product
const goToProduct = (productOrId) => {
  // Handle both object and string ID
  const id = typeof productOrId === 'string' ? productOrId : productOrId?._id;
  if (id) {
    router.push(`/products/${id}`);
  }
};

// Continue shopping
const continueShopping = () => {
  router.push("/products");
};

// Proceed to checkout
const proceedToCheckout = () => {
  router.push("/checkout");
};

// Get product image with proper URL
const getProductImage = (product) => {
  if (product?.images && product.images.length > 0) {
    const img = product.images[0];
    const url = typeof img === 'string' ? img : img.url;
    
    if (url && url.startsWith('/')) {
      return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`;
    }
    return url;
  }
  return 'data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'128\' height=\'128\' viewBox=\'0 0 128 128\'%3e%3crect width=\'128\' height=\'128\' fill=\'%23e5e7eb\'/%3e%3ctext x=\'50%\' y=\'50%\' dominant-baseline=\'middle\' text-anchor=\'middle\' font-family=\'sans-serif\' font-size=\'14\' fill=\'%236b7280\'>No Image</text>%3c/svg%3e';
};

// Initialize
onMounted(() => {
  fetchCart();
});
</script>
