<template>
  <DefaultLayout>
    <div class="max-w-3xl mx-auto px-4 py-8">
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p class="mt-4 text-gray-600">Loading order details...</p>
      </div>

      <div v-else-if="order" class="space-y-6">
        <h1 class="text-2xl font-bold">Complete Your Payment</h1>
        
        <div class="card">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">Order #{{ order._id.slice(-6).toUpperCase() }}</h2>
            <span class="text-primary font-bold text-xl">{{ formatCurrency(order.total) }}</span>
          </div>
          
          <div class="border-t pt-4">
            <p class="text-gray-600 mb-2">Payment Method: <span class="font-medium capitalize">{{ order.paymentMethod }}</span></p>
            <p class="text-gray-600">Items: {{ order.items.length }}</p>
          </div>
        </div>

        <!-- PayPal Container -->
        <div v-if="order.paymentMethod === 'paypal'" class="card">
          <h3 class="text-lg font-semibold mb-4">Pay with PayPal</h3>
          <div id="paypal-button-container"></div>
        </div>

        <!-- Pesapal Fallback -->
        <div v-if="order.paymentMethod === 'pesapal'" class="card text-center">
           <p class="mb-4">Click below to complete your payment with Pesapal</p>
           <button @click="payWithPesapal" class="btn btn-primary">Pay Now</button>
        </div>

      </div>
      
      <div v-else class="text-center py-12">
        <p class="text-red-600">Order not found</p>
        <button @click="$router.push('/orders')" class="btn btn-primary mt-4">View Orders</button>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import DefaultLayout from "@/components/layouts/DefaultLayout.vue";
import api from "@/utils/api";
import { formatCurrency } from "@/utils/helpers";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();

const order = ref(null);
const loading = ref(true);

const fetchOrder = async () => {
  try {
    const response = await api.get(`/orders/${route.params.id}`);
    order.value = response.data;
    
    if (order.value.status === 'paid') {
      toast.info("Order is already paid");
      router.push(`/orders/${order.value._id}`);
      return;
    }

    if (order.value.paymentMethod === 'paypal') {
      loadPayPalScript();
    }
  } catch (err) {
    toast.error("Failed to load order");
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const loadPayPalScript = () => {
  if (window.paypal) {
    renderPayPalButtons();
    return;
  }

  const script = document.createElement("script");
  // Use a placeholder client ID if env var is missing, or better, fetch it from backend config endpoint if possible.
  // For now, we'll assume it's exposed or use a sandbox test ID if needed.
  // Ideally, we should have an endpoint /api/config/paypal to get the client ID.
  // But let's try to use a hardcoded sandbox ID for testing if env is missing.
  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'sb'; // 'sb' is generic sandbox
  
  script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
  script.async = true;
  script.onload = renderPayPalButtons;
  document.body.appendChild(script);
};

const renderPayPalButtons = () => {
  if (!window.paypal) return;

  window.paypal.Buttons({
    createOrder: async (data, actions) => {
      try {
        const response = await api.post('/payment/paypal/create-order', {
          orderId: order.value._id
        });
        return response.data.id;
      } catch (err) {
        toast.error("Failed to create PayPal order");
        console.error(err);
        throw err;
      }
    },
    onApprove: async (data, actions) => {
      try {
        const response = await api.post('/payment/paypal/capture-order', {
          orderID: data.orderID,
          dbOrderId: order.value._id
        });
        
        if (response.data.success) {
          toast.success("Payment successful!");
          router.push(`/orders/${order.value._id}/payment-status`);
        }
      } catch (err) {
        toast.error("Payment capture failed");
        console.error(err);
      }
    },
    onError: (err) => {
      console.error('PayPal error:', err);
      toast.error("An error occurred with PayPal");
    }
  }).render('#paypal-button-container');
};

const payWithPesapal = async () => {
  try {
    const paymentResponse = await api.post("/payment/pesapal/submit-order", {
        orderId: order.value._id
      });

      if (paymentResponse.data && paymentResponse.data.redirect_url) {
        window.location.href = paymentResponse.data.redirect_url;
      }
  } catch (err) {
    toast.error("Failed to initialize Pesapal");
  }
};

onMounted(() => {
  fetchOrder();
});
</script>
