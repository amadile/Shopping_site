<template>
  <AdminLayout>
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        
        <!-- Period Selector -->
        <div class="flex bg-white rounded-md shadow-sm">
          <button
            v-for="p in ['week', 'month', 'year', 'all']"
            :key="p"
            @click="changePeriod(p)"
            class="px-4 py-2 text-sm font-medium border first:rounded-l-md last:rounded-r-md focus:z-10 focus:ring-1 focus:ring-green-500 focus:border-green-500"
            :class="period === p ? 'bg-green-50 text-green-700 border-green-500 z-10' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
          >
            {{ p.charAt(0).toUpperCase() + p.slice(1) }}
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
      </div>

      <div v-else class="space-y-8">
        <!-- Overview Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Total Revenue -->
          <div class="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-sm font-medium text-gray-500">Total Revenue</p>
                <p class="text-2xl font-bold text-gray-900 mt-1">{{ formatCurrency(overview?.revenue?.totalRevenue || 0) }}</p>
              </div>
              <div class="p-2 bg-green-100 rounded-full">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
            </div>
            <div class="mt-4 text-sm text-gray-600">
              <span class="font-medium">{{ overview?.revenue?.completedOrders || 0 }}</span> completed orders
            </div>
          </div>

          <!-- Active Vendors -->
          <div class="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-sm font-medium text-gray-500">Active Vendors</p>
                <p class="text-2xl font-bold text-gray-900 mt-1">{{ overview?.vendors?.active || 0 }}</p>
              </div>
              <div class="p-2 bg-blue-100 rounded-full">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
              </div>
            </div>
            <div class="mt-4 text-sm text-gray-600">
              <span class="font-medium">{{ overview?.vendors?.pending || 0 }}</span> pending approval
            </div>
          </div>

          <!-- Total Customers -->
          <div class="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-sm font-medium text-gray-500">Total Customers</p>
                <p class="text-2xl font-bold text-gray-900 mt-1">{{ overview?.customers?.total || 0 }}</p>
              </div>
              <div class="p-2 bg-purple-100 rounded-full">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </div>
            </div>
            <div class="mt-4 text-sm text-gray-600">
              <span class="font-medium">{{ overview?.customers?.new || 0 }}</span> new in this period
            </div>
          </div>

          <!-- Pending Payouts -->
          <div class="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-sm font-medium text-gray-500">Pending Payouts</p>
                <p class="text-2xl font-bold text-gray-900 mt-1">{{ formatCurrency(overview?.payouts?.pendingBalance || 0) }}</p>
              </div>
              <div class="p-2 bg-yellow-100 rounded-full">
                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </div>
            </div>
            <div class="mt-4 text-sm text-gray-600">
              <span class="font-medium">{{ formatCurrency(overview?.payouts?.totalPaid || 0) }}</span> paid out total
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Revenue Trend -->
          <div class="bg-white p-6 rounded-lg shadow">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Revenue Trend</h3>
            <div class="h-64">
              <Line v-if="revenueChartData" :data="revenueChartData" :options="chartOptions" />
              <div v-else class="h-full flex items-center justify-center text-gray-400">No data available</div>
            </div>
          </div>

          <!-- Payment Methods -->
          <div class="bg-white p-6 rounded-lg shadow">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Payment Methods</h3>
            <div class="h-64 flex justify-center">
              <Pie v-if="paymentMethodChartData" :data="paymentMethodChartData" :options="pieChartOptions" />
              <div v-else class="h-full flex items-center justify-center text-gray-400">No data available</div>
            </div>
          </div>
        </div>

        <!-- Uganda Specific Insights -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Top Districts -->
          <div class="bg-white p-6 rounded-lg shadow">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Top Vendor Districts</h3>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendors</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="district in ugandaData?.vendorsByDistrict" :key="district._id">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ district._id }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ district.count }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatCurrency(district.totalRevenue) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Kampala Zones -->
          <div class="bg-white p-6 rounded-lg shadow">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Top Delivery Zones (Kampala)</h3>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="zone in ugandaData?.ordersByKampalaZone" :key="zone._id">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ zone._id }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ zone.count }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatCurrency(zone.totalValue) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Top Vendors -->
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Top Performing Vendors</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="vendor in vendorPerformance?.vendors" :key="vendor._id">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{{ vendor.businessName }}</div>
                    <div class="text-sm text-gray-500">{{ vendor.user?.email }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ vendor.stats?.totalOrders || 0 }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatCurrency(vendor.stats?.totalRevenue || 0) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div class="flex items-center">
                      <span class="text-yellow-400 mr-1">★</span>
                      {{ vendor.rating?.toFixed(1) || 'N/A' }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {{ vendor.tier || 'Bronze' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '@/utils/api'
import { formatCurrency } from '@/utils/helpers'
import AdminLayout from '@/components/layouts/AdminLayout.vue'
import { useToast } from 'vue-toastification'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'
import { Line, Pie } from 'vue-chartjs'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

const toast = useToast()

// State
const loading = ref(false)
const period = ref('month')
const overview = ref(null)
const revenueData = ref(null)
const vendorPerformance = ref(null)
const ugandaData = ref(null)

// Chart Options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    }
  }
}

const pieChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right'
    }
  }
}

// Computed Chart Data
const revenueChartData = computed(() => {
  if (!revenueData.value?.dailyTrend) return null
  
  const labels = revenueData.value.dailyTrend.map(item => item._id)
  const data = revenueData.value.dailyTrend.map(item => item.totalRevenue)
  
  return {
    labels,
    datasets: [
      {
        label: 'Revenue (UGX)',
        backgroundColor: '#10B981',
        borderColor: '#10B981',
        data,
        tension: 0.3
      }
    ]
  }
})

const paymentMethodChartData = computed(() => {
  if (!revenueData.value?.byPaymentMethod) return null
  
  const labels = revenueData.value.byPaymentMethod.map(item => item._id || 'Unknown')
  const data = revenueData.value.byPaymentMethod.map(item => item.totalRevenue)
  const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6']
  
  return {
    labels,
    datasets: [
      {
        backgroundColor: colors,
        data
      }
    ]
  }
})

// Fetch Data
const loadData = async () => {
  loading.value = true
  try {
    const params = { period: period.value }
    
    // Parallel requests
    const [overviewRes, revenueRes, vendorsRes, ugandaRes] = await Promise.all([
      api.get('/admin/analytics/marketplace-overview', { params }),
      api.get('/admin/analytics/revenue-breakdown', { params }),
      api.get('/admin/analytics/vendor-performance', { params: { limit: 5 } }),
      api.get('/admin/analytics/uganda-specific')
    ])
    
    overview.value = overviewRes.data
    revenueData.value = revenueRes.data
    vendorPerformance.value = vendorsRes.data
    ugandaData.value = ugandaRes.data
    
  } catch (error) {
    console.error('Error loading analytics:', error)
    toast.error('Failed to load analytics data')
  } finally {
    loading.value = false
  }
}

const changePeriod = (newPeriod) => {
  period.value = newPeriod
  loadData()
}

onMounted(() => {
  loadData()
})
</script>
