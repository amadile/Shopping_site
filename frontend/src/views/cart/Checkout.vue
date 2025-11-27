<template>
  <DefaultLayout>
    <div class="max-w-7xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-8">Checkout</h1>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div
          class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"
        ></div>
        <p class="mt-4 text-gray-600">Loading...</p>
      </div>

      <!-- Empty Cart -->
      <div
        v-else-if="!cart || cart.items.length === 0"
        class="text-center py-12"
      >
        <p class="text-gray-600 mb-4">Your cart is empty</p>
        <button @click="$router.push('/products')" class="btn btn-primary">
          Browse Products
        </button>
      </div>

      <!-- Checkout Form -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Form Section -->
        <div class="lg:col-span-2">
          <form @submit.prevent="placeOrder" class="space-y-6">
            <!-- Shipping Address -->
            <div class="card">
              <h2 class="text-xl font-bold mb-4">Delivery Address</h2>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block font-medium mb-2">Full Name *</label>
                  <input
                    v-model="checkoutForm.shippingAddress.fullName"
                    type="text"
                    required
                    class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label class="block font-medium mb-2">Phone Number *</label>
                  <input
                    v-model="checkoutForm.shippingAddress.phone"
                    type="tel"
                    placeholder="+256..."
                    required
                    class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <div class="mt-2 flex items-center">
                    <input
                      type="checkbox"
                      id="sms-opt-in"
                      v-model="checkoutForm.smsNotifications"
                      class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label for="sms-opt-in" class="ml-2 block text-sm text-gray-900">
                      Receive order updates via SMS
                    </label>
                  </div>
                  <p class="text-sm text-gray-500 mt-1">Format: +256XXXXXXXXX</p>
                </div>

                <!-- Uganda-specific fields -->
                <div class="md:col-span-2">
                  <DeliveryZoneSelector
                    v-model="checkoutForm.shippingAddress"
                    @fee-change="handleDeliveryFeeChange"
                  />
                </div>

                <div class="md:col-span-2">
                  <label class="block font-medium mb-2">Landmark *</label>
                  <input
                    v-model="checkoutForm.shippingAddress.landmark"
                    type="text"
                    placeholder="e.g., Near City Square Mall, Opposite Shell Station"
                    required
                    class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p class="text-sm text-gray-500 mt-1">Help delivery find you easily</p>
                </div>

                <div class="md:col-span-2">
                  <label class="block font-medium mb-2">Street Address (Optional)</label>
                  <input
                    v-model="checkoutForm.shippingAddress.addressLine1"
                    type="text"
                    placeholder="Plot number, street name"
                    class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            <!-- Payment Method -->
            <div class="card">
              <h2 class="text-xl font-bold mb-4">Payment Method</h2>

              <div class="space-y-3">
                <!-- Cash on Delivery -->
                <label class="flex items-start cursor-pointer border rounded-lg p-4 hover:bg-gray-50">
                  <input
                    v-model="checkoutForm.paymentMethod"
                    type="radio"
                    value="cod"
                    class="mr-3 mt-1"
                  />
                  <div class="flex-1">
                    <div class="flex items-center">
                      <span class="font-medium text-lg">💵 Cash on Delivery</span>
                      <span class="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Recommended</span>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">Pay with cash when your order is delivered</p>
                  </div>
                </label>

                <!-- Mobile Money (MTN & Airtel) -->
                <label class="flex items-start cursor-pointer border rounded-lg p-4 hover:bg-gray-50">
                  <input
                    v-model="checkoutForm.paymentMethod"
                    type="radio"
                    value="mobile_money"
                    class="mr-3 mt-1"
                  />
                  <div class="flex-1">
                    <div class="flex items-center">
                      <span class="font-medium text-lg">📱 Mobile Money</span>
                      <span class="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">MTN & Airtel</span>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">Pay instantly with MTN MoMo or Airtel Money</p>
                    
                    <!-- Mobile Money Component -->
                    <div v-if="checkoutForm.paymentMethod === 'mobile_money'" class="mt-4 border-t pt-4">
                      <MobileMoneyPayment 
                        v-model="checkoutForm.mobileMoney" 
                        @valid="handleMobileMoneyValidation"
                      />
                    </div>
                  </div>
                </label>

                <!-- Card Payment -->
                <label class="flex items-start cursor-pointer border rounded-lg p-4 hover:bg-gray-50">
                  <input
                    v-model="checkoutForm.paymentMethod"
                    type="radio"
                    value="card"
                    class="mr-3 mt-1"
                  />
                  <div class="flex-1">
                    <span class="font-medium text-lg">💳 Credit/Debit Card</span>
                    <p class="text-sm text-gray-600 mt-1">Pay with Visa, Mastercard</p>
                  </div>
                </label>

                <!-- Pesapal -->
                <label class="flex items-start cursor-pointer border rounded-lg p-4 hover:bg-gray-50">
                  <input
                    v-model="checkoutForm.paymentMethod"
                    type="radio"
                    value="pesapal"
                    class="mr-3 mt-1"
                  />
                  <div class="flex-1">
                    <span class="font-medium text-lg">💳 Pay with Pesapal</span>
                    <p class="text-sm text-gray-600 mt-1">Mobile Money (MTN/Airtel) & Cards</p>
                  </div>
                </label>

                <!-- Manual Mobile Money -->
                <label class="flex items-start cursor-pointer border rounded-lg p-4 hover:bg-gray-50 bg-green-50">
                  <input
                    v-model="checkoutForm.paymentMethod"
                    type="radio"
                    value="manual_momo"
                    class="mr-3 mt-1"
                  />
                  <div class="flex-1">
                    <div class="flex items-center">
                      <span class="font-medium text-lg">📱 Manual Mobile Money</span>
                      <span class="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded">No API Needed</span>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">Send money to our number & submit Transaction ID</p>
                  </div>
                </label>

                <!-- PayPal -->
                <label class="flex items-start cursor-pointer border rounded-lg p-4 hover:bg-gray-50">
                  <input
                    v-model="checkoutForm.paymentMethod"
                    type="radio"
                    value="paypal"
                    class="mr-3 mt-1"
                  />
                  <div class="flex-1">
                    <span class="font-medium text-lg">🅿️ Pay with PayPal</span>
                    <p class="text-sm text-gray-600 mt-1">Fast, safe payment with your PayPal account</p>
                  </div>
                </label>
              </div>

              <!-- Legacy Mobile Money Input Removed -->

              <!-- Card Details (if card selected) -->
              <div
                v-if="checkoutForm.paymentMethod === 'card'"
                class="mt-4 space-y-4"
              >
                <div>
                  <label class="block font-medium mb-2">Card Number *</label>
                  <input
                    v-model="checkoutForm.cardDetails.number"
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    required
                    class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block font-medium mb-2">Expiry Date *</label>
                    <input
                      v-model="checkoutForm.cardDetails.expiry"
                      type="text"
                      placeholder="MM/YY"
                      required
                      class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label class="block font-medium mb-2">CVV *</label>
                    <input
                      v-model="checkoutForm.cardDetails.cvv"
                      type="text"
                      placeholder="123"
                      required
                      class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Order Notes -->
            <div class="card">
              <h2 class="text-xl font-bold mb-4">Delivery Instructions (Optional)</h2>
              <textarea
                v-model="checkoutForm.notes"
                rows="4"
                placeholder="Any special instructions for delivery... e.g., 'Please call before delivery', 'Leave at gate'"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              ></textarea>
            </div>
          </form>
        </div>

        <!-- Order Summary -->
        <div class="lg:col-span-1">
          <div class="card sticky top-4">
            <h2 class="text-xl font-bold mb-4">Order Summary</h2>

            <!-- Cart Items -->
            <div class="space-y-3 mb-4 max-h-64 overflow-y-auto">
              <div
                v-for="item in cart.items"
                :key="item._id"
                class="flex justify-between text-sm"
              >
                <div class="flex-1">
                  <p class="font-medium">{{ item.product?.name || 'Product' }}</p>
                  <p class="text-gray-600">Qty: {{ item.quantity }}</p>
                </div>
                <p class="font-semibold">
                  {{ formatCurrency((item.variantDetails?.price || item.product?.price || 0) * item.quantity) }}
                </p>
              </div>
            </div>

            <!-- Totals -->
            <div class="border-t pt-4 space-y-2 mb-6">
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
                <span class="text-gray-600">Delivery:</span>
                <span class="font-semibold">{{ deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee) }}</span>
              </div>

              <div class="flex justify-between text-xl font-bold border-t pt-2">
                <span>Total:</span>
                <span class="text-primary">{{
                  formatCurrency(cartStore.total + deliveryFee)
                }}</span>
              </div>
            </div>

            <!-- Estimated Delivery -->
            <div v-if="estimatedDelivery" class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p class="text-sm text-blue-800">
                <strong>Estimated Delivery:</strong><br>
                {{ estimatedDelivery }}
              </p>
            </div>

            <!-- Place Order Button -->
            <button
              @click="placeOrder"
              :disabled="placingOrder"
              class="btn btn-primary w-full"
            >
              {{ placingOrder ? "Placing Order..." : "Place Order" }}
            </button>

            <!-- Payment Method Info -->
            <div v-if="checkoutForm.paymentMethod === 'cod'" class="mt-4 text-sm text-gray-600">
              <p>✓ Pay cash when you receive your order</p>
              <p>✓ No prepayment required</p>
            </div>
            <div v-else-if="checkoutForm.paymentMethod === 'mobile_money'" class="mt-4 text-sm text-gray-600">
              <p>✓ You'll receive a payment prompt on your phone</p>
              <p>✓ Enter your PIN to complete payment</p>
            </div>
            <div v-else-if="checkoutForm.paymentMethod === 'pesapal'" class="mt-4 text-sm text-gray-600">
              <p>✓ You will be redirected to Pesapal to complete payment</p>
              <p>✓ Supports MTN/Airtel Mobile Money and Cards</p>
            </div>
            <div v-else-if="checkoutForm.paymentMethod === 'manual_momo'" class="mt-4 text-sm text-gray-600">
              <p>✓ Send money to our MTN/Airtel number</p>
              <p>✓ Submit your Transaction ID to confirm</p>
              <p>✓ No API setup required - works immediately!</p>
            </div>
            <div v-else-if="checkoutForm.paymentMethod === 'paypal'" class="mt-4 text-sm text-gray-600">
              <p>✓ You will be redirected to PayPal to complete payment</p>
              <p>✓ Buyer Protection included</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import DefaultLayout from "@/components/layouts/DefaultLayout.vue";
import MobileMoneyPayment from "@/components/checkout/MobileMoneyPayment.vue";
import DeliveryZoneSelector from "@/components/checkout/DeliveryZoneSelector.vue";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import api from "@/utils/api";
import { formatCurrency } from "@/utils/helpers";
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";

const router = useRouter();
const cartStore = useCartStore();
const authStore = useAuthStore();
const toast = useToast();

// State
const loading = ref(false);
const placingOrder = ref(false);
const deliveryFee = ref(0);
const estimatedDelivery = ref('');

const checkoutForm = ref({
  shippingAddress: {
    fullName: "",
    phone: "",
    district: "",
    zone: "",
    landmark: "",
    addressLine1: "",
    country: "Uganda",
  },
  smsNotifications: true, // Default to true
  paymentMethod: "cod", // Default to COD for Uganda
  mobileMoney: {
    provider: 'mtn',
    phoneNumber: ''
  },
  isMobileMoneyValid: false,
  cardDetails: {
    number: "",
    expiry: "",
    cvv: "",
  },
  notes: "",
});

// Computed
const cart = computed(() => cartStore.cart);

// Handle delivery fee update from component
const handleDeliveryFeeChange = (fee) => {
  deliveryFee.value = fee;
  
  // Update estimate based on fee/location logic
  if (checkoutForm.value.shippingAddress.district === 'Kampala' || checkoutForm.value.shippingAddress.district === 'Wakiso') {
    estimatedDelivery.value = '1-2 business days';
  } else {
    estimatedDelivery.value = '3-5 business days';
  }
};

// Fetch cart
const fetchCart = async () => {
  loading.value = true;
  try {
    await cartStore.fetchCart();

    // Pre-fill with user's saved address if available
    if (authStore.user?.shippingAddress) {
      checkoutForm.value.shippingAddress = {
        ...authStore.user.shippingAddress,
        country: "Uganda",
      };
    }
  } catch (err) {
    toast.error("Failed to load cart");
  } finally {
    loading.value = false;
  }
};

const handleMobileMoneyValidation = (isValid) => {
  checkoutForm.value.isMobileMoneyValid = isValid;
};

// Place order
const placeOrder = async () => {
  placingOrder.value = true;
  try {
    // Prepare order data based on payment method
    if (checkoutForm.value.paymentMethod === 'cod') {
      // Use COD endpoint
      const response = await api.post("/payment/cod/place-order", {
        items: cart.value.items.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.variantDetails?.price || item.product.price,
          variantId: item.variantId,
          variantDetails: item.variantDetails,
        })),
        shippingAddress: checkoutForm.value.shippingAddress,
        shippingFee: deliveryFee.value,
        smsNotifications: checkoutForm.value.smsNotifications,
        notes: checkoutForm.value.notes,
      });

      toast.success("Order placed successfully! Pay cash on delivery.");
      await cartStore.clearCart();
      router.push(`/orders/${response.data.order.id}`);
      
    } else if (checkoutForm.value.paymentMethod === 'mobile_money') {
      if (!checkoutForm.value.isMobileMoneyValid) {
        toast.error("Please enter a valid mobile money number");
        placingOrder.value = false;
        return;
      }

      // First create order, then initiate mobile money payment
      const orderResponse = await api.post("/orders/checkout", {
        items: cart.value.items.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.variantDetails?.price || item.product.price,
          variantId: item.variantId,
          variantDetails: item.variantDetails,
        })),
        shippingAddress: checkoutForm.value.shippingAddress,
        shippingFee: deliveryFee.value,
        smsNotifications: checkoutForm.value.smsNotifications,
        paymentMethod: checkoutForm.value.mobileMoney.provider === 'mtn' ? 'mtn_momo' : 'airtel_money',
        notes: checkoutForm.value.notes,
      });

      const orderId = orderResponse.data._id;

      // Initiate mobile money payment (MunoPay)
      const provider = checkoutForm.value.mobileMoney.provider;
      const paymentResponse = await api.post("/payment/munopay/initiate", {
        orderId,
        phoneNumber: checkoutForm.value.mobileMoney.phoneNumber,
        provider,
      });

      toast.success("Payment initiated! Check your phone to complete the transaction.");
      await cartStore.clearCart();
      router.push(`/orders/${orderId}/payment-status`);
      
    } else if (checkoutForm.value.paymentMethod === 'pesapal') {
      // Create order first
      const orderResponse = await api.post("/orders/checkout", {
        items: cart.value.items.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.variantDetails?.price || item.product.price,
          variantId: item.variantId,
          variantDetails: item.variantDetails,
        })),
        shippingAddress: checkoutForm.value.shippingAddress,
        shippingFee: deliveryFee.value,
        smsNotifications: checkoutForm.value.smsNotifications,
        paymentMethod: checkoutForm.value.paymentMethod,
        notes: checkoutForm.value.notes,
      });

      const orderId = orderResponse.data._id;

      // Initialize Pesapal payment
      const paymentResponse = await api.post("/payment/pesapal/submit-order", {
        orderId
      });

      if (paymentResponse.data && paymentResponse.data.redirect_url) {
        // Redirect to Pesapal
        window.location.href = paymentResponse.data.redirect_url;
      } else {
        throw new Error("Failed to initialize Pesapal payment");
      }

    } else if (checkoutForm.value.paymentMethod === 'manual_momo') {
      // Create order first
      const orderResponse = await api.post("/orders/checkout", {
        items: cart.value.items.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.variantDetails?.price || item.product.price,
          variantId: item.variantId,
          variantDetails: item.variantDetails,
        })),
        shippingAddress: checkoutForm.value.shippingAddress,
        shippingFee: deliveryFee.value,
        smsNotifications: checkoutForm.value.smsNotifications,
        paymentMethod: checkoutForm.value.paymentMethod,
        notes: checkoutForm.value.notes,
      });

      const orderId = orderResponse.data._id;
      toast.success("Order created! Please complete payment.");
      await cartStore.clearCart();
      router.push(`/cart/manual-momo/${orderId}`);

    } else if (checkoutForm.value.paymentMethod === 'paypal') {
      // Create order first
      const orderResponse = await api.post("/orders/checkout", {
        items: cart.value.items.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.variantDetails?.price || item.product.price,
          variantId: item.variantId,
          variantDetails: item.variantDetails,
        })),
        shippingAddress: checkoutForm.value.shippingAddress,
        shippingFee: deliveryFee.value,
        smsNotifications: checkoutForm.value.smsNotifications,
        paymentMethod: checkoutForm.value.paymentMethod,
        notes: checkoutForm.value.notes,
      });

      const orderId = orderResponse.data._id;

      // For PayPal, we'll redirect to a payment page or handle it here.
      // Since we don't have the SDK loaded here easily without setup, 
      // let's redirect to a dedicated payment page for this order
      // where we can load the PayPal SDK properly.
      router.push(`/orders/${orderId}/pay`);

    } else {
      // Card or other payment methods
      const response = await api.post("/orders/checkout", {
        items: cart.value.items.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.variantDetails?.price || item.product.price,
          variantId: item.variantId,
          variantDetails: item.variantDetails,
        })),
        shippingAddress: checkoutForm.value.shippingAddress,
        shippingFee: deliveryFee.value,
        smsNotifications: checkoutForm.value.smsNotifications,
        paymentMethod: checkoutForm.value.paymentMethod,
        cardDetails: checkoutForm.value.cardDetails,
        notes: checkoutForm.value.notes,
      });

      toast.success("Order placed successfully!");
      await cartStore.clearCart();
      router.push(`/orders/${response.data._id}`);
    }
  } catch (err) {
    console.error('Place order error:', err.response?.data);
    toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to place order");
  } finally {
    placingOrder.value = false;
  }
};

// Initialize
onMounted(() => {
  if (!authStore.isAuthenticated) {
    toast.warning("Please login to checkout");
    router.push("/login");
    return;
  }

  fetchCart();
});
</script>
