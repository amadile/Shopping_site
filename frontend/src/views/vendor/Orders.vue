<template>
  <VendorLayout>
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-6">
        <!-- Status Filter -->
        <div class="flex items-center">
          <label
            for="status-filter"
            class="mr-2 text-sm font-medium text-gray-700"
            >Filter by Status:</label
          >
          <select
            id="status-filter"
            v-model="statusFilter"
            class="border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <!-- Orders Table -->
      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Order ID
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Customer
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Date
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Total
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Payment
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="order in filteredOrders" :key="order._id">
              <td
                class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
              >
                {{ order._id.substring(0, 8).toUpperCase() }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ order.user?.name || "Guest" }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(order.createdAt) }}
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium"
              >
                {{ formatCurrency(order.total) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatPaymentMethod(order.paymentMethod) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  :class="getStatusClass(order.status)"
                >
                  {{ order.status }}
                </span>
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
              >
                <button
                  @click="openOrderModal(order)"
                  class="text-green-600 hover:text-green-900"
                >
                  Manage
                </button>
              </td>
            </tr>
            <tr v-if="filteredOrders.length === 0">
              <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                No orders found matching your criteria.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        class="mt-4 flex justify-between items-center"
        v-if="pagination.pages > 1"
      >
        <button
          @click="changePage(pagination.page - 1)"
          :disabled="pagination.page === 1"
          class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          Previous
        </button>
        <span class="text-sm text-gray-700">
          Page {{ pagination.page }} of {{ pagination.pages }}
        </span>
        <button
          @click="changePage(pagination.page + 1)"
          :disabled="pagination.page === pagination.pages"
          class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          Next
        </button>
      </div>

      <!-- Order Details Modal -->
      <div
        v-if="showOrderModal"
        class="fixed z-10 inset-0 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div
          class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
        >
          <div
            class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            aria-hidden="true"
            @click="closeOrderModal"
          ></div>

          <span
            class="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
            >&#8203;</span
          >

          <div
            class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full"
          >
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div class="sm:flex sm:items-start">
                <div
                  class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full"
                >
                  <h3
                    class="text-lg leading-6 font-medium text-gray-900"
                    id="modal-title"
                  >
                    Order Details #{{
                      selectedOrder._id.substring(0, 8).toUpperCase()
                    }}
                  </h3>

                  <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 class="text-sm font-medium text-gray-500">
                        Customer Information
                      </h4>
                      <p class="mt-1 text-sm text-gray-900">
                        {{ selectedOrder.user?.name }}
                      </p>
                      <p class="text-sm text-gray-500">
                        {{ selectedOrder.user?.email }}
                      </p>
                      <p class="text-sm text-gray-500">
                        {{ selectedOrder.user?.phone }}
                      </p>
                    </div>
                    <div>
                      <h4 class="text-sm font-medium text-gray-500">
                        Shipping Address
                      </h4>
                      <p class="mt-1 text-sm text-gray-900">
                        {{ selectedOrder.shippingAddress?.addressLine1 }}
                      </p>
                      <p class="text-sm text-gray-900">
                        {{ selectedOrder.shippingAddress?.city }},
                        {{ selectedOrder.shippingAddress?.state }}
                      </p>
                      <p class="text-sm text-gray-900">
                        {{ selectedOrder.shippingAddress?.country }}
                      </p>
                    </div>
                  </div>

                  <div class="mt-6">
                    <h4 class="text-sm font-medium text-gray-500 mb-2">
                      Order Items
                    </h4>
                    <div class="border rounded-md overflow-hidden">
                      <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                          <tr>
                            <th
                              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                            >
                              Product
                            </th>
                            <th
                              class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase"
                            >
                              Price
                            </th>
                            <th
                              class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase"
                            >
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                          <tr
                            v-for="item in selectedOrder.items"
                            :key="item._id"
                          >
                            <td class="px-4 py-3 whitespace-nowrap">
                              <div class="flex items-center">
                                <div class="h-10 w-10 flex-shrink-0">
                                  <img
                                    class="h-10 w-10 rounded object-cover"
                                    :src="getProductImage(item.product)"
                                    alt=""
                                  />
                                </div>
                                <div class="ml-4">
                                  <div
                                    class="text-sm font-medium text-gray-900"
                                  >
                                    {{
                                      item.product?.name || "Product Deleted"
                                    }}
                                  </div>
                                  <div class="text-sm text-gray-500">
                                    Qty: {{ item.quantity }}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td
                              class="px-4 py-3 text-right text-sm text-gray-500"
                            >
                              {{ formatCurrency(item.price) }}
                            </td>
                            <td
                              class="px-4 py-3 text-right text-sm text-gray-900"
                            >
                              {{ formatCurrency(item.price * item.quantity) }}
                            </td>
                          </tr>
                        </tbody>
                        <tfoot class="bg-gray-50">
                          <tr>
                            <td
                              class="px-4 py-3 text-right text-sm font-medium text-gray-900"
                            >
                              Total
                            </td>
                            <td
                              class="px-4 py-3 text-right text-sm font-bold text-gray-900"
                            >
                              {{ formatCurrency(selectedOrder.total) }}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  <div class="mt-6">
                    <h4 class="text-sm font-medium text-gray-500 mb-2">
                      Update Status
                    </h4>
                    <div class="flex gap-4 items-end">
                      <div class="flex-1">
                        <label
                          class="block text-xs font-medium text-gray-700 mb-1"
                          >Order Status</label
                        >
                        <select
                          v-model="selectedOrder.status"
                          class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div class="flex-1">
                        <label
                          class="block text-xs font-medium text-gray-700 mb-1"
                          >Tracking Number</label
                        >
                        <input
                          type="text"
                          v-model="selectedOrder.trackingNumber"
                          placeholder="Enter tracking number"
                          class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        />
                      </div>
                      <button
                        @click="updateOrderStatus"
                        class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div
              class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse"
            >
              <button
                type="button"
                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                @click="closeOrderModal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </VendorLayout>
</template>

<script setup>
import VendorLayout from "@/components/layouts/VendorLayout.vue";
import api from "@/utils/api";
import { computed, onMounted, ref } from "vue";
import { useToast } from "vue-toastification";

const toast = useToast();

const orders = ref([]);
const loading = ref(false);
const statusFilter = ref("");
const searchQuery = ref("");
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  pages: 1,
});

const showOrderModal = ref(false);
const selectedOrder = ref({});

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
  }).format(amount);
};

// Format date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-UG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Capitalize string
const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Get status class
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

// Format payment method
const formatPaymentMethod = (method) => {
  const methods = {
    card: "Credit Card",
    paypal: "PayPal",
    cod: "Cash on Delivery",
    mtn_momo: "MTN Mobile Money",
    airtel_money: "Airtel Money",
  };
  return methods[method] || method;
};

// Get product image
const getProductImage = (product) => {
  if (product && product.images && product.images.length > 0) {
    const img = product.images[0];
    const url = typeof img === "string" ? img : img.url;
    if (url && url.startsWith("/")) {
      return `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${url}`;
    }
    return url;
  }
  return "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3e%3crect width='40' height='40' fill='%23e5e7eb'/%3e%3cpath d='M20 20l-4 4h8l-4-4z' fill='%239ca3af'/%3e%3c/svg%3e";
};

// Load orders
const loadOrders = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      status: statusFilter.value || undefined,
    };

    const response = await api.get("/vendor/orders", { params });
    orders.value = response.data.orders;
    pagination.value = response.data.pagination;
  } catch (error) {
    console.error("Error loading orders:", error);
    toast.error("Failed to load orders");
  } finally {
    loading.value = false;
  }
};

// Change page
const changePage = (page) => {
  if (page >= 1 && page <= pagination.value.pages) {
    pagination.value.page = page;
    loadOrders();
  }
};

// Filtered orders (client-side search for now)
const filteredOrders = computed(() => {
  if (!searchQuery.value) return orders.value;

  const query = searchQuery.value.toLowerCase();
  return orders.value.filter(
    (order) =>
      order._id.toLowerCase().includes(query) ||
      order.user?.name?.toLowerCase().includes(query) ||
      order.user?.email?.toLowerCase().includes(query)
  );
});

// Open order modal
const openOrderModal = (order) => {
  selectedOrder.value = JSON.parse(JSON.stringify(order)); // Deep copy
  showOrderModal.value = true;
};

// Close order modal
const closeOrderModal = () => {
  showOrderModal.value = false;
  selectedOrder.value = {};
};

// Update order status
const updateOrderStatus = async () => {
  try {
    const { _id, status, trackingNumber } = selectedOrder.value;

    await api.put(`/vendor/orders/${_id}/status`, {
      status,
      trackingNumber,
    });

    toast.success("Order status updated");
    loadOrders(); // Reload list
    closeOrderModal();
  } catch (error) {
    console.error("Error updating order status:", error);
    toast.error("Failed to update order status");
  }
};

onMounted(() => {
  loadOrders();
});
</script>
