<template>
  <DefaultLayout>
    <div class="max-w-2xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-6">Select Delivery Location</h1>
      
      <div class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <form @submit.prevent="updateDeliveryZone" class="space-y-6">
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2" for="district">
              District *
            </label>
            <select
              id="district"
              v-model="deliveryData.district"
              @change="loadZones"
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="">Select District</option>
              <option v-for="district in districts" :key="district" :value="district">
                {{ district }}
              </option>
            </select>
          </div>
          
          <div v-if="deliveryData.district === 'Kampala'">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="zone">
              Kampala Zone
            </label>
            <select
              id="zone"
              v-model="deliveryData.zone"
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">Select Zone</option>
              <option v-for="zone in kampalaZones" :key="zone" :value="zone">
                {{ zone }}
              </option>
            </select>
          </div>
          
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2" for="landmark">
              Landmark
            </label>
            <input
              id="landmark"
              v-model="deliveryData.landmark"
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="text"
              placeholder="Near Shell station, opposite Posta, etc."
            />
            <p class="text-sm text-gray-500 mt-1">
              Provide a nearby landmark to help with delivery
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
              :disabled="loading"
              class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
              type="submit"
            >
              {{ loading ? 'Updating...' : 'Update Delivery Location' }}
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
        <h3 class="font-medium text-blue-800 mb-2">Delivery Information</h3>
        <ul class="list-disc pl-5 space-y-2 text-sm text-blue-700">
          <li>Delivery is available to all districts in Uganda</li>
          <li>Kampala deliveries are divided into zones for faster service</li>
          <li>Providing a landmark helps our delivery partners locate you easily</li>
          <li>Delivery fees may vary based on your location</li>
        </ul>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'

// Delivery data
const deliveryData = ref({
  district: '',
  zone: '',
  landmark: ''
})

// Districts and zones
const districts = ref([])
const kampalaZones = ref([])

// Form state
const loading = ref(false)
const error = ref('')
const success = ref('')

// Route and auth
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Load delivery zones
const loadZones = async () => {
  try {
    const response = await fetch('/api/delivery/zones')
    const data = await response.json()
    
    if (response.ok) {
      districts.value = data.districts
      
      // Flatten Kampala zones
      const allZones = []
      for (const division in data.kampalaZones) {
        allZones.push(...data.kampalaZones[division])
      }
      kampalaZones.value = [...new Set(allZones)] // Remove duplicates
    } else {
      error.value = 'Failed to load delivery zones'
    }
  } catch (err) {
    error.value = 'Network error. Please try again.'
  }
}

// Update delivery zone
const updateDeliveryZone = async () => {
  loading.value = true
  error.value = ''
  success.value = ''
  
  try {
    const orderId = route.query.orderId
    if (!orderId) {
      error.value = 'Order ID is required'
      return
    }
    
    const response = await fetch(`/api/delivery/order/${orderId}/zone`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify(deliveryData.value)
    })
    
    const data = await response.json()
    
    if (response.ok) {
      success.value = 'Delivery location updated successfully!'
      
      // Redirect to checkout page after a delay
      setTimeout(() => {
        router.push('/checkout')
      }, 2000)
    } else {
      error.value = data.error || 'Failed to update delivery location'
    }
  } catch (err) {
    error.value = 'Network error. Please try again.'
  } finally {
    loading.value = false
  }
}

// Load zones on mount
onMounted(() => {
  loadZones()
})
</script>