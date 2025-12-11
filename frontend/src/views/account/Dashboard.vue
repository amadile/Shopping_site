<template>
  <CustomerLayout>
    <div class="space-y-6">
      <!-- Page Header -->
      <div
        class="bg-gradient-to-r from-primary via-purple-600 to-pink-600 rounded-xl shadow-lg p-8 text-white"
      >
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-5xl font-bold mb-2">
              Welcome back, {{ authStore.user?.name }}! 👋
            </h1>
            <p class="text-blue-100 text-lg">
              Here's what's happening with your orders today
            </p>
          </div>
          <div class="hidden md:block">
            <div class="bg-white/20 backdrop-blur rounded-full p-6">
              <span class="text-6xl">🛍️</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-blue-100 text-sm font-medium">Total Orders</p>
              <p class="text-4xl font-bold mt-2">{{ stats.totalOrders }}</p>
              <p class="text-blue-100 text-xs mt-1">All time</p>
            </div>
            <div class="text-5xl opacity-75">📦</div>
          </div>
        </div>

        <div
          class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-orange-100 text-sm font-medium">Pending Orders</p>
              <p class="text-4xl font-bold mt-2">{{ stats.pendingOrders }}</p>
              <p class="text-orange-100 text-xs mt-1">Awaiting shipment</p>
            </div>
            <div class="text-5xl opacity-75">⏳</div>
          </div>
        </div>

        <div
          class="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-pink-100 text-sm font-medium">Wishlist Items</p>
              <p class="text-4xl font-bold mt-2">{{ stats.wishlistItems }}</p>
              <p class="text-pink-100 text-xs mt-1">Saved for later</p>
            </div>
            <div class="text-5xl opacity-75">❤️</div>
          </div>
        </div>

        <div
          class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-green-100 text-sm font-medium">Total Spent</p>
              <p class="text-3xl font-bold mt-2">
                {{ formatCurrency(stats.totalSpent) }}
              </p>
              <p class="text-green-100 text-xs mt-1">Lifetime value</p>
            </div>
            <div class="text-5xl opacity-75">💰</div>
          </div>
        </div>
      </div>

      <!-- Recent Orders -->
      <div class="bg-white rounded-lg shadow-sm overflow-hidden">
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-gray-900">Recent Orders</h2>
            <router-link
              to="/account/orders"
              class="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              View All →
            </router-link>
          </div>
        </div>

        <div v-if="loading" class="p-12 text-center">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"
          ></div>
          <p class="text-gray-500 mt-4">Loading orders...</p>
        </div>

        <div v-else-if="recentOrders.length === 0" class="p-12 text-center">
          <svg
            class="mx-auto h-12 w-12 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <p class="text-gray-500 mt-4">No orders yet</p>
          <router-link to="/products" class="btn btn-primary mt-4 inline-block">
            Start Shopping
          </router-link>
        </div>

        <div v-else class="divide-y divide-gray-200">
          <div
            v-for="order in recentOrders"
            :key="order._id"
            class="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
            @click="goToOrder(order._id)"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-3">
                  <p class="font-semibold text-gray-900">
                    Order #{{ order._id.slice(-8).toUpperCase() }}
                  </p>
                  <span
                    class="px-3 py-1 text-xs font-medium rounded-full"
                    :class="getStatusClass(order.status)"
                  >
                    {{ order.status }}
                  </span>
                </div>
                <p class="text-sm text-gray-500 mt-1">
                  {{ formatDate(order.createdAt) }}
                </p>
                <p class="text-sm text-gray-600 mt-1">
                  {{ order.items.length }} item(s)
                </p>
              </div>
              <div class="text-right">
                <p class="text-lg font-bold text-gray-900">
                  {{ formatCurrency(order.total) }}
                </p>
                <button
                  class="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
                >
                  View Details →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <router-link
          to="/account/profile"
          class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
        >
          <div class="flex items-center space-x-4">
            <div
              class="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center"
            >
              <svg
                class="h-6 w-6 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <p class="font-semibold text-gray-900">Update Profile</p>
              <p class="text-sm text-gray-500">Manage your account</p>
            </div>
          </div>
        </router-link>

        <router-link
          to="/account/addresses"
          class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
        >
          <div class="flex items-center space-x-4">
            <div
              class="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center"
            >
              <svg
                class="h-6 w-6 text-green-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
              </svg>
            </div>
            <div>
              <p class="font-semibold text-gray-900">Manage Addresses</p>
              <p class="text-sm text-gray-500">Delivery locations</p>
            </div>
          </div>
        </router-link>

        <router-link
          to="/account/wishlist"
          class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
        >
          <div class="flex items-center space-x-4">
            <div
              class="h-12 w-12 bg-pink-100 rounded-lg flex items-center justify-center"
            >
              <svg
                class="h-6 w-6 text-pink-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <div>
              <p class="font-semibold text-gray-900">My Wishlist</p>
              <p class="text-sm text-gray-500">Saved items</p>
            </div>
          </div>
        </router-link>
      </div>
    </div>
  </CustomerLayout>
</template>

<script setup>
import CustomerLayout from "@/components/layouts/CustomerLayout.vue";
import { useAuthStore } from "@/stores/auth";
import api from "@/utils/api";
import { formatCurrency } from "@/utils/helpers";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(true);
const stats = ref({
  totalOrders: 0,
  pendingOrders: 0,
  wishlistItems: 0,
  totalSpent: 0,
});
const recentOrders = ref([]);

onMounted(async () => {
  await fetchDashboardData();
});

const fetchDashboardData = async () => {
  loading.value = true;
  try {
    // Fetch recent orders
    const ordersRes = await api.get("/orders", { params: { limit: 5 } });
    recentOrders.value = ordersRes.data.orders || [];

    // Calculate stats
    const allOrdersRes = await api.get("/orders", { params: { limit: 1000 } });
    const allOrders = allOrdersRes.data.orders || [];

    stats.value.totalOrders = allOrders.length;
    stats.value.pendingOrders = allOrders.filter(
      (o) => o.status === "pending"
    ).length;
    stats.value.totalSpent = allOrders.reduce(
      (sum, o) => sum + (o.total || 0),
      0
    );
    stats.value.wishlistItems = 0; // TODO: Implement wishlist API
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getStatusClass = (status) => {
  const classes = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return classes[status] || "bg-gray-100 text-gray-800";
};

const goToOrder = (orderId) => {
  router.push(`/orders/${orderId}`);
};
</script>
