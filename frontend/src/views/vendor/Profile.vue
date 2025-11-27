<template>
  <VendorLayout>
    <div class="max-w-4xl mx-auto px-4 py-8">
      <!-- Success/Error Messages -->
      <div v-if="success" class="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
        <p class="text-sm text-green-700">{{ success }}</p>
      </div>
      <div v-if="error" class="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
        <p class="text-sm text-red-700">{{ error }}</p>
      </div>

      <!-- Profile Form -->
      <div class="bg-white shadow-md rounded-lg p-6">
        <form @submit.prevent="updateProfile" class="space-y-6">
          <!-- Business Information -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Business Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Business Name</label>
                <input v-model="vendor.businessName" type="text" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Business Email</label>
                <input v-model="vendor.businessEmail" type="email" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Business Phone</label>
                <input v-model="vendor.businessPhone" type="tel" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Business Type</label>
                <select v-model="vendor.businessType" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm">
                  <option value="individual">Individual</option>
                  <option value="company">Company</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Business Description</label>
            <textarea v-model="vendor.description" rows="3" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"></textarea>
          </div>

          <!-- Address -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Address</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">District</label>
                <select v-model="vendor.address.district" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm">
                  <option value="">Select District</option>
                  <option v-for="district in districts" :key="district" :value="district">{{ district }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Zone</label>
                <select v-model="vendor.address.zone" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm">
                  <option value="">Select Zone</option>
                  <option v-for="zone in kampalaZones" :key="zone" :value="zone">{{ zone }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Landmark</label>
                <input v-model="vendor.address.landmark" type="text" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm">
              </div>
            </div>
          </div>

          <!-- Payout Information -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Payout Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">MTN Mobile Money</label>
                <input v-model="vendor.payoutInfo.mobileMoneyNumbers.mtn" type="tel" placeholder="+256700000000" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Airtel Money</label>
                <input v-model="vendor.payoutInfo.mobileMoneyNumbers.airtel" type="tel" placeholder="+256750000000" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm">
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="flex justify-end">
            <button type="submit" :disabled="loading" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500" :class="{ 'opacity-50 cursor-not-allowed': loading }">
              {{ loading ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </VendorLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/utils/api'
import VendorLayout from '@/components/layouts/VendorLayout.vue'

// Vendor data
const vendor = ref({
  businessName: '',
  businessEmail: '',
  businessPhone: '',
  businessType: 'individual',
  registrationNumber: '',
  tinNumber: '',
  description: '',
  address: {
    district: '',
    zone: '',
    landmark: ''
  },
  phoneNumbers: [''],
  payoutInfo: {
    mobileMoneyNumbers: {
      mtn: '',
      airtel: ''
    },
    preferredMethod: 'bank'
  }
})

// Form state
const loading = ref(false)
const error = ref('')
const success = ref('')

// Districts and zones
const districts = ref([
  "Kampala", "Wakiso", "Mukono", "Entebbe", "Jinja", "Mbale", "Mbarara", 
  "Kasese", "Fort Portal", "Masaka", "Kalangala", "Kiboga", "Luwero", "Kayunga"
])

const kampalaZones = ref([
  "Nakawa", "Kawempe", "Rubaga", "Makindye", "Kira", "Bugolobi", 
  "Wandegeya", "Kibuli", "Makerere", "Kyambogo", "Kibuye", "Kisugu", "Nsambya"
])

// Auth store
const authStore = useAuthStore()

// Methods
const addPhone = () => {
  vendor.value.phoneNumbers.push('')
}

const removePhone = (index) => {
  if (vendor.value.phoneNumbers.length > 1) {
    vendor.value.phoneNumbers.splice(index, 1)
  }
}

const loadProfile = async () => {
  try {
    // Fix: Use the API utility instead of direct fetch
    const response = await api.get('/vendor/profile')
    
    vendor.value = {
      ...vendor.value,
      ...response.data.vendor,
      phoneNumbers: response.data.vendor.phoneNumbers || [''],
      payoutInfo: {
        ...vendor.value.payoutInfo,
        ...response.data.vendor.payoutInfo,
        mobileMoneyNumbers: response.data.vendor.payoutInfo?.mobileMoneyNumbers || {
          mtn: '',
          airtel: ''
        }
      }
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to load profile'
  }
}

const updateProfile = async () => {
  loading.value = true
  error.value = ''
  success.value = ''
  
  try {
    // Fix: Use the API utility instead of direct fetch
    const response = await api.put('/vendor/profile', vendor.value)
    
    success.value = 'Profile updated successfully!'
  } catch (err) {
    error.value = err.response?.data?.error || 'Update failed'
  } finally {
    loading.value = false
  }
}

// Load profile on mount
onMounted(() => {
  loadProfile()
})
</script>