<template>
  <VendorLayout>
    <div class="vendor-analytics p-6">
      <div class="flex justify-end items-center mb-6">
        <!-- Date Range Picker (Simplified) -->
        <div class="flex gap-2">
          <button 
            v-for="days in [7, 30, 90]" 
            :key="days"
            @click="fetchData(days)"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="selectedDays === days ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'"
          >
            Last {{ days }} Days
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>

      <div v-else class="space-y-6">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div class="text-sm text-gray-500 mb-1">Total Revenue</div>
            <div class="text-2xl font-bold text-gray-900">{{ formatCurrency(summary.totalRevenue) }}</div>
            <div class="text-xs text-green-600 mt-2 flex items-center">
              <span class="bg-green-100 px-2 py-1 rounded-full">
                {{ summary.totalOrders }} Orders
              </span>
            </div>
          </div>

          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div class="text-sm text-gray-500 mb-1">Conversion Rate</div>
            <div class="text-2xl font-bold text-gray-900">{{ conversionRate }}%</div>
            <div class="text-xs text-gray-500 mt-2">
              {{ summary.totalProductClicks }} clicks
            </div>
          </div>

          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div class="text-sm text-gray-500 mb-1">Shop Views</div>
            <div class="text-2xl font-bold text-gray-900">{{ formatNumber(summary.totalShopViews) }}</div>
            <div class="text-xs text-blue-600 mt-2">
              {{ formatNumber(summary.totalProductClicks) }} Product Clicks
            </div>
          </div>

          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div class="text-sm text-gray-500 mb-1">Avg. Order Value</div>
            <div class="text-2xl font-bold text-gray-900">{{ formatCurrency(averageOrderValue) }}</div>
          </div>
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Sales Chart -->
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 class="text-lg font-semibold mb-4">Revenue & Orders</h3>
            <div class="h-80">
              <Line :data="salesChartData" :options="chartOptions" />
            </div>
          </div>

          <!-- Traffic Chart -->
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 class="text-lg font-semibold mb-4">Traffic Overview</h3>
            <div class="h-80">
              <Bar :data="trafficChartData" :options="chartOptions" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </VendorLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
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
  Filler
} from 'chart.js'
import { Line, Bar } from 'vue-chartjs'
import api from '@/utils/api'
import { formatCurrency } from '@/utils/helpers'
import VendorLayout from '@/components/layouts/VendorLayout.vue'

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
  Filler
)

const loading = ref(true)
const selectedDays = ref(30)
const chartData = ref([])
const vendorId = ref('')
const summary = ref({
  totalRevenue: 0,
  totalOrders: 0,
  totalShopViews: 0,
  totalProductClicks: 0
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top',
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: '#f3f4f6'
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  }
}

const salesChartData = computed(() => ({
  labels: chartData.value.map(d => formatDate(d.date)),
  datasets: [
    {
      label: 'Revenue',
      data: chartData.value.map(d => d.revenue),
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      yAxisID: 'y',
      tension: 0.4
    },
    {
      label: 'Orders',
      data: chartData.value.map(d => d.orders),
      borderColor: '#10B981',
      backgroundColor: 'transparent',
      yAxisID: 'y1',
      tension: 0.4,
      borderDash: [5, 5]
    }
  ]
}))

const trafficChartData = computed(() => ({
  labels: chartData.value.map(d => formatDate(d.date)),
  datasets: [
    {
      label: 'Views',
      data: chartData.value.map(d => d.views),
      backgroundColor: '#8B5CF6',
      borderRadius: 4
    }
  ]
}))

const conversionRate = computed(() => {
  if (!summary.value.totalProductClicks) return 0
  return ((summary.value.totalOrders / summary.value.totalProductClicks) * 100).toFixed(2)
})

const averageOrderValue = computed(() => {
  if (!summary.value.totalOrders) return 0
  return summary.value.totalRevenue / summary.value.totalOrders
})

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)
}

const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num || 0)
}

const fetchData = async (days) => {
  loading.value = true
  selectedDays.value = days
  
  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Fetch profile to get Vendor ID for debug
    try {
        const profileRes = await api.get('/vendor/profile')
        vendorId.value = profileRes.data.vendor._id
    } catch (e) {
        console.error('Failed to fetch profile', e)
    }

    const [chartRes, summaryRes] = await Promise.all([
      api.get('/vendor/analytics/chart', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      }),
      api.get('/vendor/analytics/summary', {
        params: { days }
      })
    ])

    chartData.value = chartRes.data.sort((a, b) => new Date(a.date) - new Date(b.date))
    summary.value = summaryRes.data
    console.log('Analytics Data:', { chart: chartRes.data, summary: summaryRes.data })
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData(30)
})
</script>
