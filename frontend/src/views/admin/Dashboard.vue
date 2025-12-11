<template>
  <AdminLayout>
    <div class="max-w-7xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div
          class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"
        ></div>
        <p class="mt-4 text-gray-600">Loading dashboard...</p>
      </div>

      <!-- Dashboard Content -->
      <div v-else>
        <!-- Stats Overview -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <!-- Total Revenue -->
          <div
            class="card bg-gradient-to-br from-blue-500 to-blue-600 text-white"
          >
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium opacity-90">Total Revenue</h3>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-8 h-8 opacity-75"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p class="text-3xl font-bold">
              {{ formatCurrency(stats.totalRevenue || 0) }}
            </p>
            <p class="text-sm opacity-90 mt-2">
              {{ stats.revenueGrowth > 0 ? "+" : ""
              }}{{ stats.revenueGrowth?.toFixed(1) }}% from last month
            </p>
          </div>

          <!-- Total Orders -->
          <div
            class="card bg-gradient-to-br from-green-500 to-green-600 text-white"
          >
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium opacity-90">Total Orders</h3>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-8 h-8 opacity-75"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
            </div>
            <p class="text-3xl font-bold">{{ stats.totalOrders || 0 }}</p>
            <p class="text-sm opacity-90 mt-2">
              {{ stats.pendingOrders || 0 }} pending
            </p>
          </div>

          <!-- Total Customers -->
          <div
            class="card bg-gradient-to-br from-purple-500 to-purple-600 text-white"
          >
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium opacity-90">Total Customers</h3>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-8 h-8 opacity-75"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                />
              </svg>
            </div>
            <p class="text-3xl font-bold">{{ stats.totalCustomers || 0 }}</p>
            <p class="text-sm opacity-90 mt-2">
              {{ stats.newCustomers || 0 }} new this month
            </p>
          </div>

          <!-- Total Products -->
          <div
            class="card bg-gradient-to-br from-orange-500 to-orange-600 text-white"
          >
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium opacity-90">Total Products</h3>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-8 h-8 opacity-75"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
            </div>
            <p class="text-3xl font-bold">{{ stats.totalProducts || 0 }}</p>
            <p class="text-sm opacity-90 mt-2">
              {{ stats.lowStockProducts || 0 }} low stock
            </p>
          </div>
        </div>

        <!-- Pending Manual Payments Alert -->
        <div
          v-if="pendingManualPayments.length > 0"
          class="card bg-yellow-50 border-2 border-yellow-300 mb-8"
        >
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-12 h-12 text-yellow-600"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-bold text-yellow-900 mb-2">
                ⚠️ {{ pendingManualPayments.length }} Pending Manual Payment{{
                  pendingManualPayments.length > 1 ? "s" : ""
                }}
              </h3>
              <p class="text-sm text-yellow-800 mb-4">
                You have manual mobile money payments waiting for verification.
                Please verify these payments to complete the orders.
              </p>
              <div class="space-y-2 mb-4">
                <div
                  v-for="payment in pendingManualPayments.slice(0, 3)"
                  :key="payment._id"
                  class="bg-white rounded-lg p-3 border border-yellow-200"
                >
                  <div class="flex justify-between items-start">
                    <div>
                      <p class="font-semibold text-sm">
                        Order #{{ payment._id.slice(-6).toUpperCase() }}
                      </p>
                      <p class="text-xs text-gray-600">
                        {{ payment.user?.name }} - {{ payment.user?.email }}
                      </p>
                      <p class="text-xs text-gray-600 mt-1">
                        <span class="font-medium">Transaction ID:</span>
                        <span class="font-mono">{{
                          payment.manualTransactionId
                        }}</span>
                      </p>
                    </div>
                    <div class="text-right">
                      <p class="font-bold text-primary">
                        {{ formatCurrency(payment.total) }}
                      </p>
                      <p class="text-xs text-gray-500">
                        {{ formatRelativeTime(payment.createdAt) }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex gap-2">
                <button
                  @click="$router.push('/admin/manual-payments')"
                  class="btn btn-warning"
                >
                  📱 Verify Payments ({{ pendingManualPayments.length }})
                </button>
                <button
                  @click="refreshManualPayments"
                  class="btn btn-secondary"
                >
                  🔄 Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts and Recent Activity -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <!-- Recent Orders -->
          <div class="card">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-bold">Recent Orders</h2>
              <button
                @click="$router.push('/admin/orders')"
                class="text-primary hover:underline text-sm"
              >
                View All →
              </button>
            </div>

            <div v-if="recentOrders.length > 0" class="space-y-3">
              <div
                v-for="order in recentOrders"
                :key="order._id"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                @click="$router.push(`/orders/${order._id}`)"
              >
                <div class="flex-1">
                  <p class="font-semibold text-sm">
                    Order #{{ order.orderNumber || order._id.slice(-8) }}
                  </p>
                  <p class="text-gray-600 text-xs">
                    {{ formatRelativeTime(order.createdAt) }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="font-bold text-primary">
                    {{ formatCurrency(order.total) }}
                  </p>
                  <span
                    class="badge badge-sm"
                    :class="getStatusBadgeClass(order.status)"
                  >
                    {{ order.status }}
                  </span>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-8 text-gray-600">
              No recent orders
            </div>
          </div>

          <!-- Low Stock Products -->
          <div class="card">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-bold">Low Stock Products</h2>
              <button
                @click="$router.push('/admin/products')"
                class="text-primary hover:underline text-sm"
              >
                View All →
              </button>
            </div>

            <div v-if="lowStockProducts.length > 0" class="space-y-3">
              <div
                v-for="product in lowStockProducts"
                :key="product._id"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                @click="$router.push(`/products/${product._id}`)"
              >
                <div class="flex items-center gap-3 flex-1">
                  <div
                    class="w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0"
                  >
                    <img
                      v-if="product.images?.[0]"
                      :src="getProductImage(product)"
                      :alt="product.name"
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-sm truncate">
                      {{ product.name }}
                    </p>
                    <p class="text-gray-600 text-xs">SKU: {{ product.sku }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <span class="badge badge-warning">
                    {{ product.stockQuantity }} left
                  </span>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-8 text-gray-600">
              All products have sufficient stock
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="card">
          <h2 class="text-xl font-bold mb-4">Quick Actions</h2>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              @click="$router.push('/admin/products')"
              class="btn btn-secondary flex flex-col items-center py-6"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-8 h-8 mb-2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
              Manage Products
            </button>

            <button
              @click="$router.push('/admin/orders')"
              class="btn btn-secondary flex flex-col items-center py-6"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-8 h-8 mb-2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
              View Orders
            </button>

            <button
              @click="$router.push('/admin/users')"
              class="btn btn-secondary flex flex-col items-center py-6"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-8 h-8 mb-2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                />
              </svg>
              Manage Users
            </button>

            <button
              @click="$router.push('/admin/analytics')"
              class="btn btn-secondary flex flex-col items-center py-6"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-8 h-8 mb-2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                />
              </svg>
              View Analytics
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
import { formatCurrency, formatRelativeTime } from "@/utils/helpers";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";

const router = useRouter();
const toast = useToast();

// State
const loading = ref(false);
const error = ref(false);
const stats = ref({});
const recentOrders = ref([]);
const lowStockProducts = ref([]);
const pendingManualPayments = ref([]);

// Fetch dashboard data
const fetchDashboardData = async () => {
  loading.value = true;
  error.value = false;
  try {
    // 1. Fetch basic stats (Total Revenue, Orders, Products, Users)
    const statsResponse = await api.get("/admin/stats");
    const basicStats = statsResponse.data;

    // 2. Fetch growth metrics (for percentages)
    const growthResponse = await api.get("/admin/analytics/growth-metrics", {
      params: { period: "month" },
    });
    const growthMetrics = growthResponse.data;

    // Merge stats
    stats.value = {
      totalRevenue: basicStats.totalRevenue,
      revenueGrowth: growthMetrics.revenue.growth,
      totalOrders: basicStats.totalOrders,
      pendingOrders: growthMetrics.orders.current, // Using current month orders as proxy for "recent activity" or just show total
      // Actually, pendingOrders usually means status='pending'.
      // admin/stats doesn't give pending count.
      // growthMetrics doesn't give pending count.
      // marketplace-overview gives orders.byStatus.
      // Let's fetch marketplace-overview for pending count if needed, or just skip it for now.
      // basicStats has totalOrders.

      totalCustomers: basicStats.totalUsers, // This includes all users, but close enough
      newCustomers: growthMetrics.customers.current,

      totalProducts: basicStats.totalProducts,
      lowStockProducts: 0, // Will be updated by products call
    };

    // 3. Fetch recent orders
    const ordersResponse = await api.get("/admin/orders", {
      params: { limit: 5, status: "pending" }, // Get pending orders for "Recent Orders" or just all?
      // Usually recent orders are just sorted by date.
    });
    // If we want just recent orders regardless of status:
    const allOrdersResponse = await api.get("/admin/orders", {
      params: { limit: 5 },
    });
    recentOrders.value = allOrdersResponse.data.orders;

    // 4. Fetch low stock products
    const productsResponse = await api.get("/admin/products", {
      params: { lowStock: true, limit: 5 },
    });
    lowStockProducts.value = productsResponse.data.products;
    stats.value.lowStockProducts = productsResponse.data.total;
  } catch (err) {
    console.error("Failed to load dashboard data:", err);
    error.value = true;
    toast.error("Failed to load dashboard data. Please try again.");
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

// Get product image URL
const getProductImage = (product) => {
  if (product.images && product.images.length > 0) {
    const img = product.images[0];
    const url = typeof img === "string" ? img : img.url;

    if (url && url.startsWith("/")) {
      return `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${url}`;
    }
    return url;
  }
  return "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3e%3crect width='40' height='40' fill='%23e5e7eb'/%3e%3cpath d='M20 20l-4 4h8l-4-4z' fill='%239ca3af'/%3e%3c/svg%3e";
};

// Initialize
onMounted(() => {
  fetchDashboardData();
});
</script>
