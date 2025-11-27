<template>
  <DefaultLayout>
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div
          class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"
        ></div>
        <p class="mt-4 text-gray-600">Loading order details...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <p class="text-red-600 mb-4">{{ error }}</p>
        <button @click="$router.push('/orders')" class="btn btn-primary">
          Back to Orders
        </button>
      </div>

      <!-- Order Details -->
      <div v-else-if="order">
        <!-- Header -->
        <div
          class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
        >
          <div>
            <h1 class="text-3xl font-bold mb-2">
              Order #{{ order.orderNumber || order._id.slice(-8) }}
            </h1>
            <p class="text-gray-600">
              Placed on {{ formatDate(order.createdAt) }}
            </p>
          </div>

          <div class="flex items-center gap-4">
            <span
              class="badge text-lg px-4 py-2"
              :class="getStatusBadgeClass(order.status)"
            >
              {{ order.status }}
            </span>

            <button
              v-if="canCancelOrder(order)"
              @click="cancelOrder"
              :disabled="cancelling"
              class="btn btn-error"
            >
              {{ cancelling ? "Cancelling..." : "Cancel Order" }}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Main Content -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Order Items -->
            <div class="card">
              <h2 class="text-xl font-bold mb-4">Order Items</h2>

              <div class="space-y-4">
                <div
                  v-for="item in order.items"
                  :key="item._id"
                  class="flex gap-4 pb-4 border-b last:border-b-0"
                >
                  <!-- Product Image -->
                  <div
                    @click="item.product?._id && goToProduct(item.product._id)"
                    class="w-24 h-24 bg-gray-200 rounded cursor-pointer overflow-hidden flex-shrink-0"
                  >
                    <img
                      v-if="item.product?.images?.[0]"
                      :src="item.product.images[0]"
                      :alt="item.product?.name || 'Product'"
                      class="w-full h-full object-cover"
                    />
                  </div>

                  <!-- Product Info -->
                  <div class="flex-1">
                    <h3
                      @click="
                        item.product?._id && goToProduct(item.product._id)
                      "
                      class="font-semibold text-lg mb-1 cursor-pointer hover:text-primary"
                    >
                      {{ item.product?.name || "Product" }}
                    </h3>

                    <p
                      v-if="item.variantDetails"
                      class="text-gray-600 text-sm mb-2"
                    >
                      <span v-if="item.variantDetails.size"
                        >Size: {{ item.variantDetails.size }}</span
                      >
                      <span v-if="item.variantDetails.color" class="ml-2"
                        >Color: {{ item.variantDetails.color }}</span
                      >
                    </p>

                    <p class="text-gray-600">Quantity: {{ item.quantity }}</p>

                    <p class="text-primary font-bold mt-2">
                      {{ formatCurrency(item.price || 0) }} each
                    </p>
                  </div>

                  <!-- Item Total -->
                  <div class="text-right">
                    <p class="font-bold text-xl">
                      {{ formatCurrency((item.price || 0) * item.quantity) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Shipping Address -->
            <div
              v-if="
                order.shippingAddress &&
                hasShippingAddress(order.shippingAddress)
              "
              class="card"
            >
              <h2 class="text-xl font-bold mb-4">Shipping Address</h2>
              <div class="text-gray-700">
                <p v-if="order.shippingAddress.fullName" class="font-medium">
                  {{ order.shippingAddress.fullName }}
                </p>
                <p v-if="order.shippingAddress.phone">
                  {{ order.shippingAddress.phone }}
                </p>
                <p v-if="order.shippingAddress.addressLine1">
                  {{ order.shippingAddress.addressLine1 }}
                </p>
                <p v-if="order.shippingAddress.addressLine2">
                  {{ order.shippingAddress.addressLine2 }}
                </p>
                <p
                  v-if="
                    order.shippingAddress.city ||
                    order.shippingAddress.state ||
                    order.shippingAddress.postalCode
                  "
                >
                  <span v-if="order.shippingAddress.city">{{
                    order.shippingAddress.city
                  }}</span>
                  <span v-if="order.shippingAddress.state"
                    >, {{ order.shippingAddress.state }}</span
                  >
                  <span v-if="order.shippingAddress.postalCode">
                    {{ order.shippingAddress.postalCode }}</span
                  >
                </p>
                <p v-if="order.shippingAddress.country">
                  {{ order.shippingAddress.country }}
                </p>
              </div>
            </div>
            <div v-else class="card">
              <h2 class="text-xl font-bold mb-4">Shipping Address</h2>
              <p class="text-gray-500 italic">No shipping address provided</p>
            </div>

            <!-- Tracking Information (Only for shipped/delivered orders) -->
            <div
              v-if="
                ['shipped', 'delivered'].includes(order.status?.toLowerCase())
              "
              class="card"
            >
              <h2 class="text-xl font-bold mb-4">📦 Shipment Tracking</h2>
              <OrderTracking :orderId="order._id" />
            </div>

            <!-- Order Timeline -->
            <div class="card">
              <h2 class="text-xl font-bold mb-4">Order Timeline</h2>

              <div class="space-y-4">
                <div class="flex gap-4">
                  <div class="flex flex-col items-center">
                    <div class="w-3 h-3 bg-primary rounded-full"></div>
                    <div class="flex-1 w-0.5 bg-gray-300 mt-2"></div>
                  </div>
                  <div class="flex-1 pb-4">
                    <p class="font-semibold">Order Placed</p>
                    <p class="text-gray-600 text-sm">
                      {{ formatDate(order.createdAt) }}
                    </p>
                  </div>
                </div>

                <div v-if="order.status !== 'pending'" class="flex gap-4">
                  <div class="flex flex-col items-center">
                    <div class="w-3 h-3 bg-primary rounded-full"></div>
                    <div
                      v-if="order.status !== 'processing'"
                      class="flex-1 w-0.5 bg-gray-300 mt-2"
                    ></div>
                  </div>
                  <div class="flex-1 pb-4">
                    <p class="font-semibold">Processing</p>
                    <p class="text-gray-600 text-sm">
                      {{ formatDate(order.updatedAt) }}
                    </p>
                  </div>
                </div>

                <div
                  v-if="
                    ['shipped', 'delivered'].includes(
                      order.status?.toLowerCase()
                    )
                  "
                  class="flex gap-4"
                >
                  <div class="flex flex-col items-center">
                    <div class="w-3 h-3 bg-primary rounded-full"></div>
                    <div
                      v-if="order.status === 'delivered'"
                      class="flex-1 w-0.5 bg-gray-300 mt-2"
                    ></div>
                  </div>
                  <div class="flex-1 pb-4">
                    <p class="font-semibold">Shipped</p>
                    <p class="text-gray-600 text-sm">
                      {{ formatDate(order.shippedAt || order.updatedAt) }}
                    </p>
                  </div>
                </div>

                <div
                  v-if="order.status?.toLowerCase() === 'delivered'"
                  class="flex gap-4"
                >
                  <div class="flex flex-col items-center">
                    <div class="w-3 h-3 bg-success rounded-full"></div>
                  </div>
                  <div class="flex-1">
                    <p class="font-semibold">Delivered</p>
                    <p class="text-gray-600 text-sm">
                      {{ formatDate(order.deliveredAt || order.updatedAt) }}
                    </p>
                  </div>
                </div>

                <div
                  v-if="order.status?.toLowerCase() === 'cancelled'"
                  class="flex gap-4"
                >
                  <div class="flex flex-col items-center">
                    <div class="w-3 h-3 bg-error rounded-full"></div>
                  </div>
                  <div class="flex-1">
                    <p class="font-semibold text-red-600">Cancelled</p>
                    <p class="text-gray-600 text-sm">
                      {{ formatDate(order.cancelledAt || order.updatedAt) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Order Notes -->
            <div v-if="order.notes" class="card">
              <h2 class="text-xl font-bold mb-4">Order Notes</h2>
              <p class="text-gray-700">{{ order.notes }}</p>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="lg:col-span-1">
            <div class="card sticky top-4 space-y-6">
              <!-- Order Summary -->
              <div>
                <h2 class="text-xl font-bold mb-4">Order Summary</h2>

                <div class="space-y-2">
                  <div class="flex justify-between">
                    <span class="text-gray-600">Subtotal:</span>
                    <span class="font-semibold">{{
                      formatCurrency(order.subtotal || 0)
                    }}</span>
                  </div>

                  <div
                    v-if="
                      order.appliedCoupon?.discountAmount > 0 ||
                      order.discount > 0
                    "
                    class="flex justify-between text-green-600"
                  >
                    <span>Discount:</span>
                    <span
                      >-{{
                        formatCurrency(
                          order.appliedCoupon?.discountAmount ||
                            order.discount ||
                            0
                        )
                      }}</span
                    >
                  </div>

                  <div class="flex justify-between">
                    <span class="text-gray-600">Tax:</span>
                    <span class="font-semibold">{{
                      formatCurrency(order.tax || 0)
                    }}</span>
                  </div>

                  <div v-if="order.shippingFee || order.shippingCost" class="flex justify-between">
                    <span class="text-gray-600">Shipping:</span>
                    <span class="font-semibold">{{
                      formatCurrency(order.shippingFee || order.shippingCost)
                    }}</span>
                  </div>

                  <div
                    class="flex justify-between text-xl font-bold border-t pt-2"
                  >
                    <span>Total:</span>
                    <span class="text-primary">{{
                      formatCurrency(order.total || order.totalAmount || 0)
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- Payment Info -->
              <div class="border-t pt-4">
                <h3 class="font-semibold mb-2">Payment Information</h3>
                <div class="space-y-1 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-600">Method:</span>
                    <span class="font-medium capitalize">{{
                      order.paymentMethod || "N/A"
                    }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Status:</span>
                    <span
                      class="font-medium"
                      :class="
                        order.isPaid ? 'text-green-600' : 'text-yellow-600'
                      "
                    >
                      {{ order.isPaid ? "Paid" : "Pending" }}
                    </span>
                  </div>
                  <div v-if="order.paidAt" class="flex justify-between">
                    <span class="text-gray-600">Paid At:</span>
                    <span class="font-medium">{{
                      formatDate(order.paidAt)
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="border-t pt-4 space-y-2">
                <button
                  @click="downloadInvoice"
                  class="btn btn-secondary w-full"
                >
                  Download Invoice
                </button>
                <button
                  @click="contactSupport"
                  class="btn btn-secondary w-full"
                >
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import DefaultLayout from "@/components/layouts/DefaultLayout.vue";
import OrderTracking from "@/components/OrderTracking.vue";
import api from "@/utils/api";
import { formatCurrency, formatDate } from "@/utils/helpers";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";

const route = useRoute();
const router = useRouter();
const toast = useToast();

// State
const order = ref(null);
const loading = ref(false);
const error = ref("");
const cancelling = ref(false);

// Fetch order
const fetchOrder = async () => {
  loading.value = true;
  error.value = "";

  try {
    const response = await api.get(`/orders/${route.params.id}`);
    order.value = response.data;
  } catch (err) {
    error.value = err.response?.data?.message || "Failed to load order";
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

// Can cancel order
const canCancelOrder = (order) => {
  const cancellableStatuses = ["pending", "processing"];
  return cancellableStatuses.includes(order.status?.toLowerCase());
};

// Check if shipping address has any valid data
const hasShippingAddress = (address) => {
  if (!address) return false;
  return (
    (address.fullName && address.fullName.trim()) ||
    (address.phone && address.phone.trim()) ||
    (address.addressLine1 && address.addressLine1.trim()) ||
    (address.addressLine2 && address.addressLine2.trim()) ||
    (address.city && address.city.trim()) ||
    (address.state && address.state.trim()) ||
    (address.postalCode && address.postalCode.trim()) ||
    (address.country && address.country.trim())
  );
};

// Cancel order
const cancelOrder = async () => {
  const reason = prompt("Please enter the reason for cancellation:");
  if (!reason || !reason.trim()) {
    toast.error("Cancellation reason is required");
    return;
  }

  cancelling.value = true;
  try {
    await api.post(`/orders/${order.value._id}/cancel`, {
      reason: reason.trim(),
    });
    toast.success("Order cancelled successfully");
    await fetchOrder();
  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to cancel order");
  } finally {
    cancelling.value = false;
  }
};

// Go to product
const goToProduct = (productId) => {
  router.push(`/products/${productId}`);
};

// Download invoice
const downloadInvoice = async () => {
  try {
    console.log("Attempting to download invoice for order:", order.value._id);

    const response = await api.get(`/orders/${order.value._id}/invoice`, {
      responseType: "blob",
    });

    console.log("Invoice response received:", {
      status: response.status,
      contentType: response.headers["content-type"],
      dataSize: response.data?.size,
    });

    // Check if response is valid
    if (!response.data || response.data.size === 0) {
      throw new Error("Empty response received");
    }

    // Create a blob from the PDF data
    const blob = new Blob([response.data], { type: "application/pdf" });

    // Create a link element and trigger download
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = `invoice-${order.value._id}.pdf`;
    document.body.appendChild(link); // Required for Firefox
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => {
      window.URL.revokeObjectURL(link.href);
    }, 100);

    toast.success("Invoice downloaded successfully");
  } catch (err) {
    console.error("Invoice download error:", err);
    console.error("Error response:", err.response);

    // Handle blob error responses (axios returns JSON in blob for errors)
    if (err.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        const errorData = JSON.parse(text);
        toast.error(errorData.error || "Failed to download invoice");
        return;
      } catch (parseError) {
        console.error("Could not parse error blob:", parseError);
      }
    }

    const errorMessage =
      err.response?.data?.error ||
      err.message ||
      "Failed to download invoice. Please check your connection.";
    toast.error(errorMessage);
  }
};

// Contact support
const contactSupport = () => {
  const subject = encodeURIComponent(
    `Order Support - Order #${order.value._id}`
  );
  const body = encodeURIComponent(
    `Hello,\n\nI need assistance with my order:\n\nOrder ID: ${
      order.value._id
    }\nOrder Date: ${new Date(
      order.value.createdAt
    ).toLocaleDateString()}\nStatus: ${
      order.value.status
    }\n\nIssue Description:\n[Please describe your issue here]\n\nThank you!`
  );

  window.location.href = `mailto:support@yourstore.com?subject=${subject}&body=${body}`;
};

// Initialize
onMounted(() => {
  fetchOrder();
});
</script>
