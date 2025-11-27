<template>
  <DefaultLayout>
    <div class="max-w-2xl mx-auto px-4 py-12">
      <div class="bg-white shadow-lg rounded-lg p-8 text-center">
        <!-- Loading State -->
        <div v-if="loading" class="py-12">
          <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <h2 class="text-2xl font-semibold text-gray-700">Verifying Payment...</h2>
          <p class="text-gray-500 mt-2">Please wait while we confirm your transaction.</p>
        </div>

        <!-- Success State -->
        <div v-else-if="status === 'success'" class="py-8">
          <div class="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
            <svg class="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p class="text-gray-600 mb-8">Your order has been confirmed and is being processed.</p>
          
          <div class="bg-gray-50 rounded-lg p-6 mb-8 text-left max-w-md mx-auto">
            <div class="flex justify-between mb-2">
              <span class="text-gray-600">Order Number:</span>
              <span class="font-medium text-gray-900">{{ orderNumber }}</span>
            </div>
            <div class="flex justify-between mb-2">
              <span class="text-gray-600">Amount Paid:</span>
              <span class="font-medium text-gray-900">{{ formatCurrency(amount) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Transaction ID:</span>
              <span class="font-medium text-gray-900 text-sm">{{ transactionId }}</span>
            </div>
          </div>

          <div class="space-x-4">
            <router-link 
              :to="`/orders/${orderId}`" 
              class="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-200"
            >
              View Order
            </router-link>
            <router-link 
              to="/" 
              class="inline-block bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition duration-200"
            >
              Continue Shopping
            </router-link>
          </div>
        </div>

        <!-- Failed State -->
        <div v-else class="py-8">
          <div class="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
            <svg class="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-gray-900 mb-2">Payment Failed</h2>
          <p class="text-gray-600 mb-8">{{ errorMessage || 'We were unable to process your payment.' }}</p>

          <div class="space-x-4">
            <button 
              @click="retryPayment"
              class="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-200"
            >
              Try Again
            </button>
            <router-link 
              to="/cart" 
              class="inline-block bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition duration-200"
            >
              Return to Cart
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import DefaultLayout from '@/components/layouts/DefaultLayout.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const loading = ref(true);
const status = ref('pending');
const errorMessage = ref('');
const orderId = ref(route.params.id);
const orderNumber = ref('');
const amount = ref(0);
const transactionId = ref('');

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX'
  }).format(val);
};

const retryPayment = () => {
  router.push(`/checkout/mobile-money?orderId=${orderId.value}`);
};

const verifyPayment = async () => {
  const { status: queryStatus, transaction_id, tx_ref } = route.query;
  
  // Handle cancellation or failure from redirect
  if (queryStatus === 'cancelled' || queryStatus === 'failed') {
    status.value = 'failed';
    errorMessage.value = queryStatus === 'cancelled' ? 'Payment was cancelled.' : 'Payment failed.';
    loading.value = false;
    return;
  }

  // If we have a transaction ID, verify with backend
  if (transaction_id) {
    try {
      const response = await fetch(`http://localhost:5000/api/payment/mobile-money/verify/${transaction_id}`, {
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success && data.data.status === 'successful') {
        status.value = 'success';
        amount.value = data.data.amount;
        transactionId.value = data.data.transactionId;
        // Fetch order details to get order number
        fetchOrderDetails();
      } else {
        status.value = 'failed';
        errorMessage.value = data.message || 'Payment verification failed.';
      }
    } catch (error) {
      status.value = 'failed';
      errorMessage.value = 'Network error during verification.';
    }
  } else {
    // No transaction ID, check if order is already paid (maybe via webhook)
    checkOrderStatus();
  }
  
  loading.value = false;
};

const checkOrderStatus = async () => {
  try {
    const response = await fetch(`http://localhost:5000/api/orders/${orderId.value}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });
    const data = await response.json();
    
    if (response.ok) {
      if (data.status === 'paid') {
        status.value = 'success';
        amount.value = data.total;
        orderNumber.value = data.orderNumber;
      } else {
        status.value = 'failed';
        errorMessage.value = 'Payment not confirmed yet. Please check again later.';
      }
    }
  } catch (error) {
    console.error('Error fetching order:', error);
  }
};

const fetchOrderDetails = async () => {
  try {
    const response = await fetch(`http://localhost:5000/api/orders/${orderId.value}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });
    const data = await response.json();
    if (response.ok) {
      orderNumber.value = data.orderNumber;
    }
  } catch (error) {
    console.error('Error fetching order details:', error);
  }
};

onMounted(() => {
  verifyPayment();
});
</script>
