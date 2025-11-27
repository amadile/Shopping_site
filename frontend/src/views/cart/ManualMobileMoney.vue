<template>
  <DefaultLayout>
    <div class="max-w-2xl mx-auto px-4 py-8">
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p class="mt-4 text-gray-600">Loading order...</p>
      </div>

      <div v-else-if="order" class="space-y-6">
        <h1 class="text-2xl font-bold">Complete Your Payment</h1>

        <!-- Order Summary -->
        <div class="card">
          <h2 class="text-lg font-semibold mb-4">Order Summary</h2>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-gray-600">Order Number:</span>
              <span class="font-medium">#{{ order._id.slice(-6).toUpperCase() }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Total Amount:</span>
              <span class="font-bold text-primary text-xl">{{ formatCurrency(order.total) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Items:</span>
              <span>{{ order.items.length }}</span>
            </div>
          </div>
        </div>

        <!-- Payment Instructions -->
        <div class="card bg-blue-50 border-blue-200">
          <h2 class="text-lg font-semibold mb-4">📱 Payment Instructions</h2>
          <ol class="space-y-3 text-sm">
            <li class="flex items-start">
              <span class="font-bold mr-2">1.</span>
              <span>Open your <strong>MTN Mobile Money</strong> or <strong>Airtel Money</strong> app</span>
            </li>
            <li class="flex items-start">
              <span class="font-bold mr-2">2.</span>
              <span>Send <strong>{{ formatCurrency(order.total) }}</strong> to:</span>
            </li>
          </ol>

          <!-- Merchant Numbers (Dynamic from API) -->
          <div v-if="paymentConfig" class="mt-4 p-4 bg-white rounded-lg border-2 border-blue-300">
            <div class="space-y-3">
              <div>
                <p class="text-xs text-gray-600 mb-1">MTN Mobile Money</p>
                <p class="text-2xl font-bold text-yellow-600">{{ paymentConfig.mtn.number }}</p>
                <p class="text-xs text-gray-500">Name: {{ paymentConfig.mtn.name }}</p>
              </div>
              <div class="border-t pt-3">
                <p class="text-xs text-gray-600 mb-1">Airtel Money</p>
                <p class="text-2xl font-bold text-red-600">{{ paymentConfig.airtel.number }}</p>
                <p class="text-xs text-gray-500">Name: {{ paymentConfig.airtel.name }}</p>
              </div>
            </div>
          </div>

          <ol class="space-y-3 text-sm mt-4" start="3">
            <li class="flex items-start">
              <span class="font-bold mr-2">3.</span>
              <span>After sending, you will receive an <strong>SMS confirmation</strong> with a Transaction ID</span>
            </li>
            <li class="flex items-start">
              <span class="font-bold mr-2">4.</span>
              <span>Enter the Transaction ID below to complete your order</span>
            </li>
          </ol>
        </div>

        <!-- Transaction ID Form -->
        <div class="card">
          <h2 class="text-lg font-semibold mb-4">Enter Payment Details</h2>
          <form @submit.prevent="submitPayment" class="space-y-4">
            <div>
              <label class="block font-medium mb-2">Phone Number Used *</label>
              <input
                v-model="paymentForm.phoneNumber"
                type="tel"
                placeholder="+256777123456"
                required
                pattern="^\+256\d{9}$"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p class="text-xs text-gray-500 mt-1">The number you sent money from (format: +256XXXXXXXXX)</p>
            </div>

            <div>
              <label class="block font-medium mb-2">Transaction ID *</label>
              <input
                v-model="paymentForm.transactionId"
                type="text"
                placeholder="e.g., MP241126.1234.A12345"
                required
                minlength="10"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p class="text-xs text-gray-500 mt-1">Found in your SMS confirmation message</p>
            </div>

            <button
              type="submit"
              :disabled="submitting"
              class="btn btn-primary w-full"
            >
              {{ submitting ? 'Submitting...' : '✓ Submit Payment' }}
            </button>
          </form>
        </div>

        <!-- Help Section -->
        <div class="card bg-gray-50">
          <h3 class="font-semibold mb-2">📞 Need Help?</h3>
          <p class="text-sm text-gray-600 mb-2">
            If you have any issues with your payment, please contact us:
          </p>
          <div class="text-sm space-y-1">
            <p><strong>Email:</strong> {{ paymentConfig?.businessEmail || 'amadilemajid10@gmail.com' }}</p>
            <p><strong>Phone:</strong> {{ paymentConfig?.mtn.number || '+256777123456' }}</p>
          </div>
          <p class="text-xs text-gray-500 mt-3">
            Your payment will be verified within 1-2 hours during business hours (9 AM - 6 PM EAT)
          </p>
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

const route = useRoute();
const router = useRouter();
const toast = useToast();

const order = ref(null);
const paymentConfig = ref(null);
const loading = ref(true);
const submitting = ref(false);

const paymentForm = ref({
  phoneNumber: '',
  transactionId: ''
});

const fetchPaymentConfig = async () => {
  try {
    // Fetch vendor-specific config based on order ID
    const response = await api.get(`/payment/manual-momo/config/${route.params.id}`);
    paymentConfig.value = response.data;
  } catch (err) {
    console.error('Failed to load payment config:', err);
    // Use defaults if API fails
    paymentConfig.value = {
      mtn: { number: '+256777123456', name: 'Amadile Store' },
      airtel: { number: '+256752123456', name: 'Amadile Store' },
      businessEmail: 'amadilemajid10@gmail.com'
    };
  }
};

const fetchOrder = async () => {
  try {
    const response = await api.get(`/orders/${route.params.id}`);
    order.value = response.data;

    if (order.value.status === 'paid') {
      toast.info("Order is already paid");
      router.push(`/orders/${order.value._id}`);
    }
  } catch (err) {
    toast.error("Failed to load order");
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const submitPayment = async () => {
  // Validate phone number format
  const phoneRegex = /^\+256\d{9}$/;
  if (!phoneRegex.test(paymentForm.value.phoneNumber)) {
    toast.error('Invalid phone number format. Use +256XXXXXXXXX');
    return;
  }

  // Validate transaction ID
  if (paymentForm.value.transactionId.length < 10) {
    toast.error('Transaction ID seems too short. Please check and try again.');
    return;
  }

  submitting.value = true;
  try {
    const response = await api.post('/payment/manual-momo/submit', {
      orderId: order.value._id,
      transactionId: paymentForm.value.transactionId.trim(),
      phoneNumber: paymentForm.value.phoneNumber.trim()
    });

    toast.success(response.data.message || 'Payment details submitted successfully!');
    router.push(`/orders/${order.value._id}`);
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to submit payment';
    toast.error(errorMsg);
    console.error(err);
  } finally {
    submitting.value = false;
  }
};

onMounted(async () => {
  await Promise.all([fetchPaymentConfig(), fetchOrder()]);
});
</script>
