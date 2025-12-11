<template>
  <CustomerLayout>
    <div class="space-y-6">
      <h1 class="text-3xl font-bold mb-8">My Orders</h1>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div
          class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"
        ></div>
        <p class="mt-4 text-gray-600">Loading orders...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <p class="text-red-600 mb-4">{{ error }}</p>
        <button @click="fetchOrders" class="btn btn-primary">Try Again</button>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="orders.length === 0"
        class="text-center py-20 bg-white rounded-lg shadow-sm"
      >
        <div class="max-w-md mx-auto">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1"
            stroke="currentColor"
            class="w-32 h-32 mx-auto text-gray-300 mb-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
          </svg>
          <h2 class="text-3xl font-bold mb-3 text-gray-900">No orders yet</h2>
          <p class="text-gray-600 mb-8 text-lg">
            You haven't placed any orders. Start shopping to place your first
            order!
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              @click="$router.push('/products')"
              class="btn btn-primary px-8 py-3"
            >
              🛍️ Browse Products
            </button>
            <button
              @click="$router.push('/products?featured=true')"
              class="btn btn-secondary px-8 py-3"
            >
              ⭐ View Featured Items
            </button>
          </div>

          <!-- Quick Links -->
          <div class="mt-12 grid grid-cols-3 gap-4 text-center">
            <router-link
              to="/account/wishlist"
              class="hover:bg-gray-50 p-3 rounded-lg transition"
            >
              <div class="text-2xl mb-2">❤️</div>
              <p class="text-sm text-gray-600">My Wishlist</p>
            </router-link>
            <router-link
              to="/products?sort=newest"
              class="hover:bg-gray-50 p-3 rounded-lg transition"
            >
              <div class="text-2xl mb-2">✨</div>
              <p class="text-sm text-gray-600">New Arrivals</p>
            </router-link>
            <router-link
              to="/products?sort=rating"
              class="hover:bg-gray-50 p-3 rounded-lg transition"
            >
              <div class="text-2xl mb-2">⭐</div>
              <p class="text-sm text-gray-600">Top Rated</p>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Orders List -->
      <div v-else class="space-y-4">
        <div
          v-for="order in orders"
          :key="order._id"
          class="card hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4"
          :class="getOrderBorderClass(order.status)"
          @click="goToOrder(order._id)"
        >
          <div class="flex flex-col md:flex-row justify-between gap-6">
            <!-- Order Info -->
            <div class="flex-1">
              <div class="flex items-start justify-between mb-4">
                <div>
                  <h3 class="text-xl font-bold text-gray-900 mb-1">
                    Order #{{ order.orderNumber || order._id.slice(-8) }}
                  </h3>
                  <p class="text-sm text-gray-500">
                    Placed on {{ formatDate(order.createdAt) }}
                  </p>
                </div>
                <span
                  class="badge text-xs font-semibold px-3 py-1.5"
                  :class="getStatusBadgeClass(order.status)"
                >
                  {{ getStatusEmoji(order.status) }} {{ order.status }}
                </span>
              </div>

              <div class="bg-gray-50 rounded-lg p-4 mb-4">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p class="text-gray-500 mb-1">Items</p>
                    <p class="font-semibold text-gray-900">
                      {{ order.items?.length || 0 }} item(s)
                    </p>
                  </div>
                  <div>
                    <p class="text-gray-500 mb-1">Payment Method</p>
                    <p class="font-semibold text-gray-900">
                      {{ formatPaymentMethod(order.paymentMethod) }}
                    </p>
                  </div>
                  <div>
                    <p class="text-gray-500 mb-1">Status</p>
                    <p
                      class="font-semibold"
                      :class="getStatusColor(order.status)"
                    >
                      {{ getStatusLabel(order.status) }}
                    </p>
                  </div>
                  <div>
                    <p class="text-gray-500 mb-1">Total Amount</p>
                    <p class="text-lg font-bold text-primary">
                      {{
                        formatCurrency(order.total || order.totalAmount || 0)
                      }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Order Items Preview -->
              <div
                v-if="order.items && order.items.length > 0"
                class="flex items-center gap-3"
              >
                <p class="text-sm font-medium text-gray-700">Items:</p>
                <div class="flex gap-2">
                  <div
                    v-for="(item, index) in order.items.slice(0, 4)"
                    :key="index"
                    class="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden border-2 border-white shadow-sm"
                  >
                    <img
                      v-if="item.product?.images?.[0]"
                      :src="item.product.images[0]"
                      :alt="item.product.name"
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <div
                    v-if="order.items.length > 4"
                    class="w-14 h-14 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-sm"
                  >
                    +{{ order.items.length - 4 }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-col justify-center gap-2 md:min-w-[160px]">
              <button
                @click.stop="goToOrder(order._id)"
                class="btn btn-primary btn-sm w-full"
              >
                📄 View Details
              </button>

              <button
                v-if="canTrackOrder(order)"
                @click.stop="trackOrder(order)"
                class="btn btn-secondary btn-sm w-full"
              >
                📦 Track Order
              </button>

              <button
                v-if="canCancelOrder(order)"
                @click.stop="cancelOrder(order._id)"
                class="btn btn-outline btn-error btn-sm w-full"
              >
                ❌ Cancel Order
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="totalPages > 1"
        class="flex justify-center items-center gap-2 mt-8"
      >
        <button
          @click="changePage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="btn btn-secondary btn-sm"
          :class="{ 'opacity-50 cursor-not-allowed': currentPage === 1 }"
        >
          Previous
        </button>

        <button
          v-for="page in visiblePages"
          :key="page"
          @click="changePage(page)"
          class="btn btn-sm"
          :class="page === currentPage ? 'btn-primary' : 'btn-secondary'"
        >
          {{ page }}
        </button>

        <button
          @click="changePage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="btn btn-secondary btn-sm"
          :class="{
            'opacity-50 cursor-not-allowed': currentPage === totalPages,
          }"
        >
          Next
        </button>
      </div>
    </div>
  </CustomerLayout>
</template>

<script setup>
import CustomerLayout from "@/components/layouts/CustomerLayout.vue";
import api from "@/utils/api";
import { formatCurrency, formatDate } from "@/utils/helpers";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";

const router = useRouter();
const toast = useToast();

// State
const orders = ref([]);
const loading = ref(false);
const error = ref("");
const currentPage = ref(1);
const totalPages = ref(1);
const pageSize = 10;

// Fetch orders
const fetchOrders = async () => {
  loading.value = true;
  error.value = "";

  try {
    const response = await api.get("/orders", {
      params: {
        page: currentPage.value,
        limit: pageSize,
      },
    });

    orders.value = response.data.orders || response.data;
    totalPages.value = response.data.pages || 1;
  } catch (err) {
    error.value = err.response?.data?.message || "Failed to load orders";
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
};

// Get status badge class
const getStatusBadgeClass = (status) => {
  const statusMap = {
    pending: "badge-warning",
    processing: "badge-info",
    shipped: "badge-primary",
    delivered: "badge-success",
    cancelled: "badge-error",
  };
  return statusMap[status?.toLowerCase()] || "badge-secondary";
};

// Get order border class based on status
const getOrderBorderClass = (status) => {
  const borderMap = {
    pending: "border-yellow-400",
    processing: "border-blue-400",
    shipped: "border-purple-400",
    delivered: "border-green-400",
    cancelled: "border-red-400",
  };
  return borderMap[status?.toLowerCase()] || "border-gray-300";
};

// Get status emoji
const getStatusEmoji = (status) => {
  const emojiMap = {
    pending: "⏳",
    processing: "📦",
    shipped: "🚚",
    delivered: "✅",
    cancelled: "❌",
  };
  return emojiMap[status?.toLowerCase()] || "📋";
};

// Get status label
const getStatusLabel = (status) => {
  const labelMap = {
    pending: "Awaiting Processing",
    processing: "Being Prepared",
    shipped: "On The Way",
    delivered: "Successfully Delivered",
    cancelled: "Order Cancelled",
  };
  return labelMap[status?.toLowerCase()] || status;
};

// Get status color
const getStatusColor = (status) => {
  const colorMap = {
    pending: "text-yellow-600",
    processing: "text-blue-600",
    shipped: "text-purple-600",
    delivered: "text-green-600",
    cancelled: "text-red-600",
  };
  return colorMap[status?.toLowerCase()] || "text-gray-600";
};

// Format payment method
const formatPaymentMethod = (method) => {
  const methodMap = {
    stripe: "💳 Credit Card",
    paypal: "💙 PayPal",
    mobileMoney: "📱 Mobile Money",
    cash: "💵 Cash on Delivery",
    card: "💳 Card",
  };
  return methodMap[method?.toLowerCase()] || method || "N/A";
};

// Can cancel order
const canCancelOrder = (order) => {
  const cancellableStatuses = ["pending", "processing"];
  return cancellableStatuses.includes(order.status?.toLowerCase());
};

// Can track order
const canTrackOrder = (order) => {
  const trackableStatuses = ["shipped", "processing"];
  return trackableStatuses.includes(order.status?.toLowerCase());
};

// Cancel order
const cancelOrder = async (orderId) => {
  if (!confirm("Are you sure you want to cancel this order?")) return;

  try {
    await api.post(`/orders/${orderId}/cancel`);
    toast.success("Order cancelled successfully");
    await fetchOrders();
  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to cancel order");
  }
};

// Track order
const trackOrder = (order) => {
  toast.info(`Tracking order #${order.orderNumber || order._id.slice(-8)}`);
  goToOrder(order._id);
};

// Go to order details
const goToOrder = (orderId) => {
  router.push(`/orders/${orderId}`);
};

// Change page
const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchOrders();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
};

// Visible pages for pagination
const visiblePages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages.value, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
});

// Initialize
onMounted(() => {
  fetchOrders();
});
</script>
