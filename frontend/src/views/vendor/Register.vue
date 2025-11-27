<template>
  <DefaultLayout>
    <div class="max-w-4xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-6">Become a Vendor</h1>
      
      <form @submit.prevent="registerVendor" class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="businessName">
            Business Name *
          </label>
          <input
            id="businessName"
            v-model="vendorData.businessName"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            required
          />
        </div>
        
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="businessEmail">
            Business Email *
          </label>
          <input
            id="businessEmail"
            v-model="vendorData.businessEmail"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="email"
            required
          />
        </div>
        
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="businessPhone">
            Business Phone *
          </label>
          <input
            id="businessPhone"
            v-model="vendorData.businessPhone"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="tel"
            required
            placeholder="+256700000000"
          />
        </div>
        
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="password">
            Password *
          </label>
          <input
            id="password"
            v-model="vendorData.password"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="password"
            required
            minlength="8"
            placeholder="At least 8 characters"
          />
        </div>
        
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="confirmPassword">
            Confirm Password *
          </label>
          <input
            id="confirmPassword"
            v-model="vendorData.confirmPassword"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="password"
            required
            minlength="8"
            placeholder="Re-enter your password"
          />
        </div>
        
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="businessType">
            Business Type *
          </label>
          <select
            id="businessType"
            v-model="vendorData.businessType"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          >
            <option value="individual">Individual</option>
            <option value="company">Company</option>
          </select>
        </div>
        
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="district">
            District *
          </label>
          <select
            id="district"
            v-model="vendorData.district"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          >
            <option value="">Select District</option>
            <option v-for="district in districts" :key="district" :value="district">
              {{ district }}
            </option>
          </select>
        </div>
        
        <div v-if="vendorData.district === 'Kampala'" class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="zone">
            Kampala Zone
          </label>
          <select
            id="zone"
            v-model="vendorData.zone"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Select Zone</option>
            <option v-for="zone in kampalaZones" :key="zone" :value="zone">
              {{ zone }}
            </option>
          </select>
        </div>
        
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="landmark">
            Landmark
          </label>
          <input
            id="landmark"
            v-model="vendorData.landmark"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            placeholder="e.g., Near City Square Mall"
          />
        </div>
        
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="tinNumber">
            TIN Number (Optional)
          </label>
          <input
            id="tinNumber"
            v-model="vendorData.tinNumber"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
          />
        </div>
        
        <div class="flex items-center justify-between">
          <button
            :disabled="loading"
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            type="submit"
          >
            {{ loading ? 'Registering...' : 'Register as Vendor' }}
          </button>
          
          <router-link to="/vendor/login" class="text-blue-500 hover:text-blue-700">
            Already have an account? Login
          </router-link>
        </div>
        
        <div v-if="error" class="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {{ error }}
        </div>
        
        <div v-if="success" class="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {{ success }}
        </div>
      </form>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/utils/api'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import { useToast } from 'vue-toastification'

const router = useRouter()
const toast = useToast()

// Vendor data
const vendorData = ref({
  businessName: '',
  businessEmail: '',
  businessPhone: '',
  password: '',
  confirmPassword: '',
  businessType: 'individual',
  district: '',
  zone: '',
  landmark: '',
  tinNumber: ''
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

const registerVendor = async () => {
  loading.value = true
  error.value = ''
  success.value = ''
  
  // Validate passwords match
  if (vendorData.value.password !== vendorData.value.confirmPassword) {
    error.value = 'Passwords do not match'
    loading.value = false
    return
  }
  
  // Validate password length
  if (vendorData.value.password.length < 8) {
    error.value = 'Password must be at least 8 characters'
    loading.value = false
    return
  }
  
  try {
    // Prepare data in the format the backend expects
    const registrationData = {
      businessName: vendorData.value.businessName,
      businessEmail: vendorData.value.businessEmail,
      businessPhone: vendorData.value.businessPhone,
      password: vendorData.value.password,
      businessType: vendorData.value.businessType,
      district: vendorData.value.district,
      zone: vendorData.value.zone || undefined,
      landmark: vendorData.value.landmark || undefined,
      tinNumber: vendorData.value.tinNumber || undefined
    }
    
    const response = await api.post('/vendor/register', registrationData)
    
    success.value = 'Vendor registration successful! Redirecting to login...'
    toast.success('Registration successful!')
    
    // Redirect to login after 2 seconds
    setTimeout(() => {
      router.push('/vendor/login')
    }, 2000)
  } catch (err) {
    console.error('Registration error:', err)
    if (err.response?.data?.errors) {
      // Handle validation errors
      error.value = err.response.data.errors.map(e => e.msg).join(', ')
    } else {
      error.value = err.response?.data?.error || 'Registration failed. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>