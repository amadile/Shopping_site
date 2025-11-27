<template>
  <VendorLayout>
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex justify-end items-center mb-6">
        <button
          @click="showRequestPayoutModal = true"
          class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center"
          :disabled="vendor.pendingPayout <= 0"
          :class="{ 'opacity-50 cursor-not-allowed': vendor.pendingPayout <= 0 }"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
          </svg>
          Request Payout
        </button>
      </div>

      <!-- Overview Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <p class="text-sm font-medium text-gray-500">Available for Payout</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ formatCurrency(vendor.pendingPayout || 0) }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <p class="text-sm font-medium text-gray-500">Total Paid Out</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ formatCurrency(vendor.totalPayouts || 0) }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <p class="text-sm font-medium text-gray-500">Commission Rate</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ vendor.commissionRate }}%</p>
        </div>
      </div>

      <!-- Payout History -->
      <div class="bg-white shadow-md rounded-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-medium text-gray-900">Payout History</h2>
        </div>
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="payout in payouts" :key="payout._id">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(payout.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ formatCurrency(payout.amount) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatPayoutMethod(payout.paymentMethod) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="{
                  'bg-yellow-100 text-yellow-800': payout.status === 'pending',
                  'bg-blue-100 text-blue-800': payout.status === 'processing',
                  'bg-green-100 text-green-800': payout.status === 'completed',
                  'bg-red-100 text-red-800': payout.status === 'failed'
                }" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                  {{ payout.status.charAt(0).toUpperCase() + payout.status.slice(1) }}
                </span>
              </td>
            </tr>
            <tr v-if="payouts.length === 0">
              <td colspan="4" class="px-6 py-10 text-center text-gray-500">
                No payout history found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Request Payout Modal -->
      <div v-if="showRequestPayoutModal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="showRequestPayoutModal = false"></div>
          <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">Request Payout</h3>
              
              <div v-if="payoutError" class="mt-2 bg-red-50 border-l-4 border-red-400 p-4">
                <div class="flex">
                  <div class="ml-3">
                    <p class="text-sm text-red-700">{{ payoutError }}</p>
                  </div>
                </div>
              </div>

              <div class="mt-4 space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Amount (UGX)</label>
                  <input
                    type="number"
                    v-model="payoutAmount"
                    :max="vendor.pendingPayout"
                    min="50000"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Enter amount"
                  >
                  <p class="mt-1 text-sm text-gray-500">Available: {{ formatCurrency(vendor.pendingPayout || 0) }}</p>
                  <p class="mt-1 text-sm text-gray-500">Minimum: UGX 50,000</p>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700">Payment Method</label>
                  <select
                    v-model="payoutMethod"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  >
                    <option value="bank">Bank Transfer</option>
                    <option value="mtn_momo">MTN Mobile Money</option>
                    <option value="airtel_money">Airtel Money</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>

                <div v-if="payoutMethod === 'mtn_momo' || payoutMethod === 'airtel_money'">
                  <label class="block text-sm font-medium text-gray-700">Mobile Money Number</label>
                  <input
                    type="tel"
                    v-model="mobileMoneyNumber"
                    placeholder="+256700000000"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  >
                </div>
              </div>
            </div>
            <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                @click="requestPayout"
                :disabled="requestingPayout || payoutAmount <= 0"
                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                :class="{ 'opacity-50 cursor-not-allowed': requestingPayout || payoutAmount <= 0 }"
              >
                {{ requestingPayout ? 'Submitting...' : 'Submit Request' }}
              </button>
              <button
                type="button"
                @click="showRequestPayoutModal = false"
                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
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

// Data
const vendor = ref({
  pendingPayout: 0,
  totalPayouts: 0,
  commissionRate: 15
})

const payouts = ref([])
const showRequestPayoutModal = ref(false)
const payoutAmount = ref(0)
const payoutMethod = ref('mtn_momo')
const mobileMoneyNumber = ref('')
const requestingPayout = ref(false)
const payoutError = ref('')
const payoutSuccess = ref('')

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

// Format payout method
const formatPayoutMethod = (method) => {
  const methods = {
    'bank': 'Bank Transfer',
    'paypal': 'PayPal',
    'mtn_momo': 'MTN Mobile Money',
    'airtel_money': 'Airtel Money'
  }
  return methods[method] || method
}

// Load vendor data
const loadVendorData = async () => {
  try {
    const response = await api.get('/vendor/profile')
    vendor.value = {
      ...vendor.value,
      ...response.data.vendor
    }
  } catch (error) {
    console.error('Error loading vendor data:', error)
  }
}

// Load payout history
const loadPayouts = async () => {
  try {
    const response = await api.get('/vendor/payouts')
    payouts.value = response.data.payouts || []
  } catch (error) {
    console.error('Error loading payouts:', error)
  }
}

// Request payout
const requestPayout = async () => {
  requestingPayout.value = true
  payoutError.value = ''
  payoutSuccess.value = ''
  
  try {
    const paymentDetails = {}
    
    if (payoutMethod.value === 'mtn_momo' || payoutMethod.value === 'airtel_money') {
      if (!mobileMoneyNumber.value) {
        payoutError.value = 'Mobile money number is required'
        requestingPayout.value = false
        return
      }
      paymentDetails.mobileMoneyNumber = mobileMoneyNumber.value
      paymentDetails.mobileMoneyNetwork = payoutMethod.value === 'mtn_momo' ? 'mtn' : 'airtel'
    }
    
    const response = await api.post('/vendor/payouts/request', {
      amount: payoutAmount.value,
      paymentMethod: payoutMethod.value,
      paymentDetails
    })
    
    payoutSuccess.value = 'Payout request submitted successfully!'
    showRequestPayoutModal.value = false
    payoutAmount.value = 0
    mobileMoneyNumber.value = ''
    
    // Reload vendor data and payouts
    await loadVendorData()
    await loadPayouts()
  } catch (error) {
    payoutError.value = error.response?.data?.error || 'Failed to request payout'
  } finally {
    requestingPayout.value = false
  }
}

// Load data on mount
onMounted(() => {
  loadVendorData()
  loadPayouts()
})
</script>