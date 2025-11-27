<template>
  <div class="order-tracking">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <div
        class="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"
      ></div>
      <p class="mt-4 text-gray-600">Loading tracking information...</p>
    </div>

    <!-- No Tracking Available -->
    <div v-else-if="!hasTracking" class="card text-center py-8">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-16 h-16 mx-auto text-gray-400 mb-4"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
        />
      </svg>
      <h3 class="text-xl font-semibold mb-2">No Tracking Information Yet</h3>
      <p class="text-gray-600">
        Tracking information will be available once your order is shipped.
      </p>
    </div>

    <!-- Tracking Information -->
    <div v-else class="space-y-6">
      <!-- Tracking Header -->
      <div class="card">
        <div
          class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h2 class="text-2xl font-bold mb-2">Tracking Information</h2>
            <div class="space-y-1">
              <p class="text-gray-700">
                <span class="font-medium">Tracking Number:</span>
                <span class="ml-2 font-mono text-primary">{{
                  tracking.trackingNumber
                }}</span>
                <button
                  @click="copyTrackingNumber"
                  class="ml-2 text-sm text-blue-600 hover:text-blue-800"
                  title="Copy tracking number"
                >
                  📋
                </button>
              </p>
              <p class="text-gray-700">
                <span class="font-medium">Carrier:</span>
                <span class="ml-2 uppercase font-semibold">{{
                  tracking.carrier
                }}</span>
              </p>
              <p v-if="tracking.estimatedDelivery" class="text-gray-700">
                <span class="font-medium">Estimated Delivery:</span>
                <span class="ml-2 text-green-600 font-semibold">{{
                  formatDate(tracking.estimatedDelivery)
                }}</span>
              </p>
              <p v-if="tracking.actualDelivery" class="text-gray-700">
                <span class="font-medium">Delivered On:</span>
                <span class="ml-2 text-green-600 font-semibold">{{
                  formatDate(tracking.actualDelivery)
                }}</span>
              </p>
              <p class="text-sm text-gray-500 mt-2">
                Last updated: {{ formatDateTime(tracking.lastUpdated) }}
              </p>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <button
              v-if="tracking.trackingUrl"
              @click="openTrackingUrl"
              class="btn btn-primary"
            >
              Track on {{ tracking.carrier.toUpperCase() }}
            </button>
            <button
              @click="refreshTracking"
              :disabled="refreshing"
              class="btn btn-secondary"
            >
              {{ refreshing ? "Refreshing..." : "Refresh Tracking" }}
            </button>
          </div>
        </div>
      </div>

      <!-- Map Placeholder -->
      <div class="card">
        <h3 class="text-xl font-bold mb-4">Shipment Location</h3>
        <div
          class="bg-gray-100 rounded-lg overflow-hidden"
          style="height: 300px"
        >
          <!-- Map placeholder - integrate Google Maps or Mapbox in production -->
          <div
            class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200"
          >
            <div class="text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-16 h-16 mx-auto text-blue-600 mb-2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                />
              </svg>
              <p class="text-gray-700 font-medium">
                {{ currentLocation || "Location tracking in progress" }}
              </p>
              <p class="text-sm text-gray-500 mt-1">
                Live map integration available with premium carrier APIs
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tracking Timeline -->
      <div class="card">
        <h3 class="text-xl font-bold mb-6">Tracking History</h3>

        <div class="relative">
          <!-- Timeline Line -->
          <div
            class="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300"
            aria-hidden="true"
          ></div>

          <!-- Timeline Events -->
          <div class="space-y-6">
            <div
              v-for="(event, index) in sortedHistory"
              :key="index"
              class="relative flex items-start gap-4"
            >
              <!-- Timeline Dot -->
              <div
                class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center z-10"
                :class="getEventClass(index)"
              >
                <svg
                  v-if="index === 0"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                  stroke="currentColor"
                  class="w-6 h-6"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div v-else class="w-3 h-3 rounded-full bg-current"></div>
              </div>

              <!-- Event Content -->
              <div class="flex-1 bg-gray-50 rounded-lg p-4">
                <div
                  class="flex flex-col md:flex-row md:justify-between md:items-start gap-2"
                >
                  <div class="flex-1">
                    <h4 class="font-semibold text-lg">{{ event.status }}</h4>
                    <p class="text-gray-600">{{ event.description }}</p>
                    <p v-if="event.location" class="text-sm text-gray-500 mt-1">
                      📍 {{ event.location }}
                    </p>
                  </div>
                  <div class="text-right text-sm text-gray-500">
                    <p class="font-medium">{{ formatDate(event.timestamp) }}</p>
                    <p>{{ formatTime(event.timestamp) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-if="!tracking.history || tracking.history.length === 0"
            class="text-center py-8"
          >
            <p class="text-gray-600">No tracking events yet</p>
          </div>
        </div>
      </div>

      <!-- Carrier Information -->
      <div class="card bg-blue-50 border border-blue-200">
        <h3 class="text-lg font-bold mb-3 text-blue-900">About Your Carrier</h3>
        <p class="text-gray-700 mb-3">{{ getCarrierInfo(tracking.carrier) }}</p>
        <div class="flex flex-wrap gap-2">
          <span class="badge badge-info">{{
            tracking.carrier.toUpperCase()
          }}</span>
          <span v-if="tracking.estimatedDelivery" class="badge badge-success">
            Estimated: {{ formatDate(tracking.estimatedDelivery) }}
          </span>
          <span v-if="isDelayed" class="badge badge-warning"
            >Possible Delay</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import api from "@/utils/api";
import { computed, onMounted, ref } from "vue";
import { useToast } from "vue-toastification";

const props = defineProps({
  orderId: {
    type: String,
    required: true,
  },
});

const toast = useToast();

// State
const loading = ref(true);
const refreshing = ref(false);
const hasTracking = ref(false);
const tracking = ref(null);

// Computed
const sortedHistory = computed(() => {
  if (!tracking.value?.history) return [];
  return [...tracking.value.history].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );
});

const currentLocation = computed(() => {
  if (!tracking.value?.history || tracking.value.history.length === 0)
    return null;
  const latest = sortedHistory.value[0];
  return latest.location || null;
});

const isDelayed = computed(() => {
  if (!tracking.value?.estimatedDelivery) return false;
  const estimated = new Date(tracking.value.estimatedDelivery);
  const now = new Date();
  // Consider delayed if past estimated delivery
  return now > estimated && !tracking.value.actualDelivery;
});

// Fetch tracking info
const fetchTracking = async () => {
  loading.value = true;
  try {
    const response = await api.get(`/orders/${props.orderId}/tracking`);

    hasTracking.value = response.data.hasTracking;
    if (response.data.hasTracking) {
      tracking.value = response.data.tracking;
    }
  } catch (err) {
    console.error("Fetch tracking error:", err);
    toast.error("Failed to load tracking information");
  } finally {
    loading.value = false;
  }
};

// Refresh tracking
const refreshTracking = async () => {
  refreshing.value = true;
  try {
    await api.post(`/orders/${props.orderId}/tracking/refresh`);
    toast.success("Tracking information updated");
    await fetchTracking();
  } catch (err) {
    console.error("Refresh tracking error:", err);
    toast.error(err.response?.data?.error || "Failed to refresh tracking");
  } finally {
    refreshing.value = false;
  }
};

// Copy tracking number
const copyTrackingNumber = async () => {
  try {
    await navigator.clipboard.writeText(tracking.value.trackingNumber);
    toast.success("Tracking number copied to clipboard");
  } catch (err) {
    toast.error("Failed to copy tracking number");
  }
};

// Open tracking URL
const openTrackingUrl = () => {
  if (tracking.value?.trackingUrl) {
    window.open(tracking.value.trackingUrl, "_blank");
  }
};

// Get event styling
const getEventClass = (index) => {
  if (index === 0) {
    return "bg-green-500 text-white";
  }
  return "bg-gray-300 text-gray-600";
};

// Get carrier info
const getCarrierInfo = (carrier) => {
  const info = {
    fedex: "FedEx provides reliable shipping with real-time tracking updates.",
    ups: "UPS delivers millions of packages worldwide with excellent tracking.",
    dhl: "DHL specializes in international shipping with global tracking coverage.",
    usps: "USPS offers affordable domestic shipping with tracking services.",
    other: "Your package is being shipped with a trusted carrier.",
  };
  return info[carrier] || info.other;
};

// Format date
const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Format time
const formatTime = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Format date and time
const formatDateTime = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Initialize
onMounted(() => {
  fetchTracking();
});
</script>

<style scoped>
.order-tracking {
  max-width: 1200px;
  margin: 0 auto;
}

.card {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background-color: #4b5563;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.badge-info {
  background-color: #dbeafe;
  color: #1e40af;
}

.badge-success {
  background-color: #d1fae5;
  color: #065f46;
}

.badge-warning {
  background-color: #fef3c7;
  color: #92400e;
}
</style>
