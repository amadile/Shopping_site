<template>
  <DefaultLayout>
    <div class="max-w-2xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-6">Mobile Money Payment</h1>
      
      <div class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div class="mb-6">
          <h2 class="text-xl font-semibold mb-4">Order Summary</h2>
          <div class="border rounded-lg p-4">
            <div class="flex justify-between mb-2">
              <span>Order ID:</span>
              <span class="font-medium">{{ order?._id?.substring(0, 8) }}</span>
            </div>
            <div class="flex justify-between mb-2">
              <span>Total Amount:</span>
              <span class="font-medium text-lg">{{ formatCurrency(order?.total) }}</span>
            </div>
          </div>
        </div>
        
        <form @submit.prevent="initiatePayment" class="space-y-6">
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2" for="provider">
              Mobile Network *
            </label>
            <select
              id="provider"
              v-model="paymentData.provider"
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="">Select Network</option>
              <option value="mtn">MTN Mobile Money</option>
              <option value="airtel">Airtel Money</option>
            </select>
          </div>
          
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2" for="phoneNumber">
              Phone Number *
            </label>
            <input
              id="phoneNumber"
              v-model="paymentData.phoneNumber"
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="tel"
              placeholder="+256700000000"
              required
              @input="validatePhone"
            />
            <p class="text-sm text-gray-500 mt-1">
              Format: +256XXXXXXXXX (e.g., +256772123456)
            </p>
            <p v-if="phoneError" class="text-sm text-red-500 mt-1">
              {{ phoneError }}
            </p>
          </div>
          
          <div class="flex items-center justify-between">
            <button
              type="button"
              @click="$router.back()"
              class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Back
            </button>
            <button
              :disabled="loading || !!phoneError"
              class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
              type="submit"
            >
              {{ loading ? 'Processing...' : 'Pay with Mobile Money' }}
            </button>
          </div>
          
          <div v-if="error" class="mt-4 text-red-500">
            {{ error }}
          </div>
          
          <div v-if="success" class="mt-4 text-green-500">
            {{ success }}
          </div>
        </form>
      </div>
      
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 class="font-medium text-blue-800 mb-2">How Mobile Money Payment Works</h3>
        <ol class="list-decimal pl-5 space-y-2 text-sm text-blue-700">
          <li>Enter your mobile money registered phone number</li>
          <li>Select your mobile network (MTN or Airtel)</li>
          <li>You will receive a prompt on your phone to confirm the payment</li>
          <li>Enter your mobile money PIN to complete the transaction</li>
          <li>You will receive a confirmation SMS once payment is successful</li>
        </ol>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import api from '@/utils/api'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'

// Payment data
const paymentData = ref({
  provider: '',
  phoneNumber: ''
})

// Order data
const order = ref(null)

// Form state
const loading = ref(false)
const error = ref('')
const success = ref('')
const phoneError = ref('')

// Route and auth
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX'
  }).format(amount)
}

// Validate phone number
const validatePhone = () => {
  const phoneRegex = /^\+256\d{9}$/
  if (!paymentData.value.phoneNumber) {
    phoneError.value = 'Phone number is required'
  } else if (!phoneRegex.test(paymentData.value.phoneNumber)) {
    phoneError.value = 'Invalid format. Use +256XXXXXXXXX'
  } else {
    phoneError.value = ''
    
    // Auto-detect provider if not selected
    if (!paymentData.value.provider) {
      const mtnPrefixes = ['+25677', '+25678', '+25676']
      const airtelPrefixes = ['+25675', '+25670', '+25674']
      
      if (mtnPrefixes.some(p => paymentData.value.phoneNumber.startsWith(p))) {
        paymentData.value.provider = 'mtn'
      } else if (airtelPrefixes.some(p => paymentData.value.phoneNumber.startsWith(p))) {
        paymentData.value.provider = 'airtel'
      }
    }
  }
}

// Load order
const loadOrder = async () => {
  try {
    const orderId = route.query.orderId
    if (!orderId) {
      error.value = 'Order ID is required'
      toast.error('Order ID is required')
      return
    }
    
    const response = await api.get(`/orders/${orderId}`)
    order.value = response.data
    
    // Pre-fill phone if available in shipping address
    if (response.data.shippingAddress?.phone) {
      paymentData.value.phoneNumber = response.data.shippingAddress.phone
      validatePhone()
    }
  } catch (err) {
    const errorMsg = err.response?.data?.error || 'Failed to load order'
    error.value = errorMsg
    toast.error(errorMsg)
  }
}

// Initiate payment
const initiatePayment = async () => {
  validatePhone()
  if (phoneError.value) {
    toast.error(phoneError.value)
    return
  }

  loading.value = true
  error.value = ''
  success.value = ''
  
  try {
    const response = await api.post('/payment/mobile-money/initiate', {
      orderId: order.value._id,
      phoneNumber: paymentData.value.phoneNumber,
      provider: paymentData.value.provider
    })
    
    success.value = 'Payment initiated successfully! Please check your phone to complete the transaction.'
    toast.success('Payment initiated! Check your phone to complete the transaction.')
    
    // Redirect to order confirmation page after a delay
    setTimeout(() => {
      router.push(`/orders/${order.value._id}`)
    }, 3000)
  } catch (err) {
    const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Payment initiation failed'
    error.value = errorMsg
    toast.error(errorMsg)
  } finally {
    loading.value = false
  }
}

// Load order on mount
onMounted(() => {
  loadOrder()
})
</script>