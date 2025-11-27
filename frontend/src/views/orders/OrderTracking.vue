<template>
  <DefaultLayout>
    <div class="max-w-3xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-8 text-center">Track Your Order</h1>

      <!-- Search Form -->
      <div class="bg-white p-6 rounded-lg shadow-md mb-8">
        <form @submit.prevent="searchOrder" class="flex flex-col md:flex-row gap-4">
          <div class="flex-1">
            <label for="orderId" class="sr-only">Order ID</label>
            <input
              id="orderId"
              v-model="searchOrderId"
              type="text"
              placeholder="Enter Order ID (e.g., 65f...)"
              class="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
          <button
            type="submit"
            class="bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            :disabled="loading"
          >
            {{ loading ? 'Searching...' : 'Track Order' }}
          </button>
        </form>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-700">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Order Tracking Details -->
      <div v-else-if="order" class="bg-white shadow-lg rounded-lg overflow-hidden">
        <!-- Header -->
        <div class="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 class="text-lg font-medium text-gray-900">Order #{{ order.orderNumber || order._id.substring(0, 8).toUpperCase() }}</h2>
            <p class="text-sm text-gray-500">Placed on {{ formatDate(order.createdAt) }}</p>
          </div>
          <span :class="getStatusClass(order.status)" class="px-3 py-1 rounded-full text-sm font-medium">
            {{ capitalize(order.status) }}
          </span>
        </div>

        <!-- Progress Bar -->
        <div class="px-6 py-8">
          <div class="relative">
            <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
              <div
                :style="{ width: getProgressWidth(order.status) }"
                class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 transition-all duration-500"
              ></div>
            </div>
            <div class="flex justify-between text-xs text-gray-600 font-medium">
              <div :class="{ 'text-green-600 font-bold': isStepActive('pending', order.status) }">Pending</div>
              <div :class="{ 'text-green-600 font-bold': isStepActive('processing', order.status) }">Processing</div>
              <div :class="{ 'text-green-600 font-bold': isStepActive('shipped', order.status) }">Shipped</div>
              <div :class="{ 'text-green-600 font-bold': isStepActive('delivered', order.status) }">Delivered</div>
            </div>
          </div>
        </div>

        <!-- Tracking Info (if shipped) -->
        <div v-if="trackingInfo" class="px-6 py-4 border-t border-gray-200 bg-blue-50">
          <h3 class="text-sm font-medium text-blue-800 mb-2">Shipment Details</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500">Carrier:</span>
              <span class="ml-2 font-medium text-gray-900">{{ trackingInfo.carrier || 'N/A' }}</span>
            </div>
            <div>
              <span class="text-gray-500">Tracking Number:</span>
              <span class="ml-2 font-medium text-gray-900">{{ trackingInfo.trackingNumber || 'N/A' }}</span>
            </div>
            <div v-if="trackingInfo.estimatedDelivery">
              <span class="text-gray-500">Est. Delivery:</span>
              <span class="ml-2 font-medium text-gray-900">{{ formatDate(trackingInfo.estimatedDelivery) }}</span>
            </div>
            <div v-if="trackingInfo.currentLocation">
              <span class="text-gray-500">Current Location:</span>
              <span class="ml-2 font-medium text-gray-900">{{ trackingInfo.currentLocation }}</span>
            </div>
          </div>
        </div>

        <!-- Order Items Summary -->
        <div class="px-6 py-4 border-t border-gray-200">
          <h3 class="text-sm font-medium text-gray-900 mb-4">Items in this Order</h3>
          <ul class="divide-y divide-gray-200">
            <li v-for="item in order.items" :key="item._id" class="py-3 flex">
              <div class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                <img :src="item.product?.images?.[0] || 'https://via.placeholder.com/64'" class="h-full w-full object-cover object-center" />
              </div>
              <div class="ml-4 flex flex-1 flex-col">
                <div>
                  <div class="flex justify-between text-base font-medium text-gray-900">
                    <h3>{{ item.product?.name }}</h3>
                    <p class="ml-4">{{ formatCurrency(item.price * item.quantity) }}</p>
                  </div>
                  <p class="mt-1 text-sm text-gray-500">{{ item.product?.category }}</p>
                </div>
                <div class="flex flex-1 items-end justify-between text-sm">
                  <p class="text-gray-500">Qty {{ item.quantity }}</p>
                </div>
              </div>
            </li>
          </ul>
        </div>
        
        <!-- Footer Actions -->
        <div class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
          <router-link :to="`/orders/${order._id}`" class="text-green-600 hover:text-green-800 font-medium text-sm">
            View Full Order Details &rarr;
          </router-link>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/utils/api'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'

const route = useRoute()
const router = useRouter()

const searchOrderId = ref('')
const loading = ref(false)
const error = ref('')
const order = ref(null)
const trackingInfo = ref(null)

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX'
  }).format(amount)
}

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-UG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Capitalize string
const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Get status class
const getStatusClass = (status) => {
  const classes = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

// Get progress width
const getProgressWidth = (status) => {
  const map = {
    pending: '25%',
    processing: '50%',
    shipped: '75%',
    delivered: '100%',
    cancelled: '0%'
  }
  return map[status] || '0%'
}

// Check if step is active
const isStepActive = (step, currentStatus) => {
  const steps = ['pending', 'processing', 'shipped', 'delivered']
  const currentIndex = steps.indexOf(currentStatus)
  const stepIndex = steps.indexOf(step)
  return currentIndex >= stepIndex && currentStatus !== 'cancelled'
}

// Search order
const searchOrder = () => {
  if (searchOrderId.value) {
    router.push({ query: { id: searchOrderId.value } })
  }
}

// Fetch order details
const fetchOrder = async (id) => {
  loading.value = true
  error.value = ''
  order.value = null
  trackingInfo.value = null
  
  try {
    // 1. Fetch Order
    const response = await api.get(`/orders/${id}`)
    order.value = response.data
    
    // 2. Fetch Tracking Info (if shipped)
    if (['shipped', 'delivered'].includes(order.value.status)) {
      try {
        const trackingRes = await api.get(`/orders/${id}/tracking`)
        trackingInfo.value = trackingRes.data
      } catch (e) {
        console.log('No tracking info available or error fetching it')
      }
    }
  } catch (err) {
    console.error('Error fetching order:', err)
    error.value = 'Order not found or you do not have permission to view it.'
  } finally {
    loading.value = false
  }
}

// Watch for route query changes
watch(() => route.query.id, (newId) => {
  if (newId) {
    searchOrderId.value = newId
    fetchOrder(newId)
  }
}, { immediate: true })

onMounted(() => {
  if (route.query.id) {
    searchOrderId.value = route.query.id
  }
})
</script>
