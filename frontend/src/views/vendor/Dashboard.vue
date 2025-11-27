<template>
  <VendorLayout>
    <div class="max-w-7xl mx-auto">
      <!-- Dashboard Stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Total Sales -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-green-100 text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Total Sales</p>
              <p class="text-2xl font-semibold text-gray-900">
                {{ formatCurrency(dashboard.overview?.totalSales || 0) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Total Orders -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Total Orders</p>
              <p class="text-2xl font-semibold text-gray-900">
                {{ dashboard.overview?.totalOrders || 0 }}
              </p>
            </div>
          </div>
        </div>

        <!-- Products -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Products</p>
              <p class="text-2xl font-semibold text-gray-900">
                {{ dashboard.products?.total || 0 }}
              </p>
            </div>
          </div>
        </div>

        <!-- Rating -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Rating</p>
              <p class="text-2xl font-semibold text-gray-900">
                {{ dashboard.overview?.rating || 0 }}
                <span class="text-sm text-gray-400 font-normal">
                  ({{ dashboard.overview?.totalReviews || 0 }} reviews)
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Settings Alert -->
      <div v-if="!hasPaymentConfig" class="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 mb-8">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 text-blue-600">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-bold text-blue-900 mb-2">
              📱 Configure Your Payment Numbers
            </h3>
            <p class="text-sm text-blue-800 mb-4">
              Set up your MTN and Airtel Mobile Money numbers to receive manual payments directly from customers. This allows customers to pay you instantly via mobile money.
            </p>
            <router-link to="/vendor/payment-settings" class="btn btn-primary">
              ⚙️ Configure Payment Settings
            </router-link>
          </div>
        </div>
      </div>

      <!-- Payment Settings Configured -->
      <div v-else class="bg-green-50 border-2 border-green-300 rounded-lg p-4 mb-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-green-600">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p class="font-semibold text-green-900">Payment Settings Configured</p>
              <p class="text-sm text-green-700">MTN: {{ paymentConfig.mtn || 'Not set' }} | Airtel: {{ paymentConfig.airtel || 'Not set' }}</p>
            </div>
          </div>
          <router-link to="/vendor/payment-settings" class="btn btn-secondary btn-sm">
            Edit Settings
          </router-link>
        </div>
      </div>

      <!-- Earnings & Performance -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <!-- Earnings Breakdown -->
        <div class="bg-white rounded-lg shadow lg:col-span-2">
          <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-800">Earnings Overview</h2>
            <router-link to="/vendor/payouts" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View Payouts
            </router-link>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div class="bg-gray-50 p-4 rounded-lg">
                <p class="text-sm text-gray-500 mb-1">Total Revenue</p>
                <p class="text-xl font-bold text-gray-900">{{ formatCurrency(dashboard.overview?.totalRevenue || 0) }}</p>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <p class="text-sm text-gray-500 mb-1">Platform Fees</p>
                <p class="text-xl font-bold text-red-600">-{{ formatCurrency(dashboard.overview?.totalCommission || 0) }}</p>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <p class="text-sm text-gray-500 mb-1">Net Earnings</p>
                <p class="text-xl font-bold text-green-600">{{ formatCurrency(dashboard.overview?.netRevenue || 0) }}</p>
              </div>
            </div>
            
            <div class="bg-blue-50 p-4 rounded-lg flex justify-between items-center">
              <div>
                <p class="text-sm font-medium text-blue-800">Available for Payout</p>
                <p class="text-2xl font-bold text-blue-900">{{ formatCurrency(dashboard.overview?.pendingPayout || 0) }}</p>
              </div>
              <router-link 
                to="/vendor/payouts" 
                class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Request Payout
              </router-link>
            </div>
          </div>
        </div>

        <!-- Performance Metrics -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-800">Performance</h2>
          </div>
          <div class="p-6 space-y-6">
            <div>
              <div class="flex justify-between mb-1">
                <span class="text-sm font-medium text-gray-700">Order Fulfillment</span>
                <span class="text-sm font-medium text-gray-900">{{ dashboard.performance?.orderFulfillmentRate || 0 }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-green-600 h-2 rounded-full" :style="{ width: `${dashboard.performance?.orderFulfillmentRate || 0}%` }"></div>
              </div>
            </div>
            
            <div>
              <div class="flex justify-between mb-1">
                <span class="text-sm font-medium text-gray-700">Response Time</span>
                <span class="text-sm font-medium text-gray-900">{{ dashboard.performance?.averageResponseTime || 0 }} hrs</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-blue-600 h-2 rounded-full" style="width: 85%"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between mb-1">
                <span class="text-sm font-medium text-gray-700">Return Rate</span>
                <span class="text-sm font-medium text-gray-900">{{ dashboard.performance?.returnRate || 0 }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-red-500 h-2 rounded-full" :style="{ width: `${dashboard.performance?.returnRate || 0}%` }"></div>
              </div>
            </div>

            <div class="pt-4 border-t border-gray-100">
              <h3 class="text-sm font-medium text-gray-900 mb-3">Inventory Status</h3>
              <div class="flex justify-between items-center mb-2">
                <div class="text-center">
                  <p class="text-2xl font-bold text-green-600">
                    {{ dashboard.products?.active || 0 }}
                  </p>
                  <p class="text-sm text-gray-500">Active</p>
                </div>
                <div class="text-center">
                  <p class="text-2xl font-bold text-red-600">
                    {{ dashboard.products?.lowStock || 0 }}
                  </p>
                  <p class="text-sm text-gray-500">Low Stock</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Orders -->
      <div class="bg-white rounded-lg shadow mb-8">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-800">Recent Orders</h2>
        </div>
        <div class="p-6">
          <div v-if="dashboard.recentOrders?.length > 0" class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="order in dashboard.recentOrders" :key="order.id">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ order.orderNumber?.substring(0, 8) || order.id?.substring(0, 8) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ order.customer }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatCurrency(order.total) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {{ order.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatDate(order.date) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="text-center py-8 text-gray-500">
            No recent orders found.
          </div>
        </div>
      </div>
    </div>
  </VendorLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/utils/api'
import VendorLayout from '@/components/layouts/VendorLayout.vue'

// Dashboard data
const dashboard = ref({
  overview: {},
  recentOrders: [],
  performance: {},
  products: {}
})

const earnings = ref({})
const vendor = ref({})
const paymentConfig = ref({})
const hasPaymentConfig = ref(false)

// Auth store
const authStore = useAuthStore()

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX'
  }).format(amount)
}

// Format date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-UG')
}

// Load dashboard data
const loadDashboard = async () => {
  try {
    // Fix: Use the API utility instead of direct fetch
    const response = await api.get('/vendor/dashboard')
    dashboard.value = response.data.dashboard
  } catch (error) {
    console.error('Error loading dashboard:', error)
  }
}

// Load earnings data
const loadEarnings = async () => {
  try {
    const response = await api.get('/vendor/earnings')
    earnings.value = response.data.earnings
  } catch (error) {
    console.error('Error loading earnings:', error)
  }
}

// Load vendor profile
const loadVendorProfile = async () => {
  try {
    const response = await api.get('/vendor/profile')
    vendor.value = response.data.vendor
  } catch (error) {
    console.error('Error loading vendor profile:', error)
  }
}

// Load payment configuration
const loadPaymentConfig = async () => {
  try {
    const response = await api.get('/vendor/payment-config/current')
    const config = response.data.mobileMoneyNumbers || {}
    paymentConfig.value = {
      mtn: config.mtn,
      airtel: config.airtel
    }
    hasPaymentConfig.value = !!(config.mtn || config.airtel)
  } catch (error) {
    console.error('Error loading payment config:', error)
  }
}

// Load dashboard on mount
onMounted(() => {
  loadDashboard()
  loadEarnings()
  loadVendorProfile()
  loadPaymentConfig()
})
</script>
