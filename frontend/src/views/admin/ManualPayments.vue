<template>
  <AdminLayout>
    <div class="space-y-6">
      <h1 class="text-2xl font-bold">Manual Payment Verification</h1>

      <div v-if="loading" class="text-center py-12">
        <div
          class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"
        ></div>
        <p class="mt-4 text-gray-600">Loading pending payments...</p>
      </div>

      <div v-else-if="error" class="card text-center py-12">
        <div class="text-red-500 text-5xl mb-4">⚠️</div>
        <p class="text-gray-600 mb-4">Failed to load pending payments</p>
        <button
          @click="fetchPendingPayments"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>

      <div
        v-else-if="pendingOrders.length === 0"
        class="card text-center py-12"
      >
        <p class="text-gray-600">No pending manual payments</p>
      </div>

      <div v-else class="space-y-4">
        <div v-for="order in pendingOrders" :key="order._id" class="card">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="font-semibold text-lg">
                Order #{{ order._id.slice(-6).toUpperCase() }}
              </h3>
              <p class="text-sm text-gray-600">
                {{ new Date(order.createdAt).toLocaleString() }}
              </p>
            </div>
            <span class="text-xl font-bold text-primary">{{
              formatCurrency(order.total)
            }}</span>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p class="text-sm text-gray-600">Customer</p>
              <p class="font-medium">{{ order.user?.name || "N/A" }}</p>
              <p class="text-sm text-gray-500">{{ order.user?.email }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Phone Number</p>
              <p class="font-medium">{{ order.mobileMoneyNumber }}</p>
            </div>
          </div>

          <div
            class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4"
          >
            <p class="text-sm font-medium text-yellow-800">Transaction ID:</p>
            <p class="text-lg font-mono font-bold">
              {{ order.manualTransactionId }}
            </p>
          </div>

          <div class="flex gap-2">
            <button
              @click="verifyPayment(order._id)"
              :disabled="verifying === order._id"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {{
                verifying === order._id
                  ? "Verifying..."
                  : "✓ Verify & Confirm Payment"
              }}
            </button>
            <button
              @click="viewOrder(order._id)"
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              View Order
            </button>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import AdminLayout from "@/components/layouts/AdminLayout.vue";
import api from "@/utils/api";
import { formatCurrency } from "@/utils/helpers";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";

const router = useRouter();
const toast = useToast();

const pendingOrders = ref([]);
const loading = ref(true);
const error = ref(false);
const verifying = ref(null);

const fetchPendingPayments = async () => {
  loading.value = true;
  error.value = false;
  try {
    const response = await api.get("/payment/manual-momo/pending");
    pendingOrders.value = response.data || [];
  } catch (err) {
    console.error("Failed to load pending payments:", err);
    error.value = true;
    toast.error("Failed to load pending payments. Please try again.");
  } finally {
    loading.value = false;
  }
};

const verifyPayment = async (orderId) => {
  verifying.value = orderId;
  try {
    await api.post(`/payment/manual-momo/verify/${orderId}`);
    toast.success("Payment verified successfully!");
    // Remove from list
    pendingOrders.value = pendingOrders.value.filter((o) => o._id !== orderId);
  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to verify payment");
  } finally {
    verifying.value = null;
  }
};

const viewOrder = (orderId) => {
  router.push(`/admin/orders/${orderId}`);
};

onMounted(() => {
  fetchPendingPayments();
});
</script>
