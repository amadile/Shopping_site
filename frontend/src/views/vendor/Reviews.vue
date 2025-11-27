<template>
  <VendorLayout>
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="reviews.length === 0" class="bg-white rounded-lg shadow-md p-12 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        <h3 class="text-xl font-medium text-gray-900 mb-2">No reviews yet</h3>
        <p class="text-gray-500">You haven't received any reviews for your products yet.</p>
      </div>

      <!-- Reviews List -->
      <div v-else class="space-y-6">
        <div v-for="review in reviews" :key="review._id" class="bg-white shadow rounded-lg p-6">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <img class="h-12 w-12 rounded-full object-cover" :src="review.user?.avatar || 'data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 48 48\'%3e%3crect width=\'48\' height=\'48\' fill=\'%23e5e7eb\'/%3e%3cpath d=\'M24 24c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm0 4c-5.333 0-16 2.667-16 8v4h32v-4c0-5.333-10.667-8-16-8z\' fill=\'%239ca3af\'/%3e%3c/svg%3e'" alt="" />
            </div>
            <div class="ml-4 flex-1">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-medium text-gray-900">{{ review.product?.name || 'Unknown Product' }}</h3>
                <span class="text-sm text-gray-500">{{ formatDate(review.createdAt) }}</span>
              </div>
              <div class="flex items-center mt-1">
                <div class="flex text-yellow-400">
                  <svg v-for="i in 5" :key="i" class="h-5 w-5" :class="i <= review.rating ? 'text-yellow-400' : 'text-gray-300'" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.038 3.185 3.363.094c.97.026 1.371 1.24.588 1.81l-2.8 2.034 1.151 3.537c.3.921-.755 1.688-1.54 1.118l-2.8-2.034-2.8 2.034c-.784.57-1.838-.196-1.539-1.118l1.151-3.537-2.8-2.034c-.783-.57-.38-1.81.588-1.81l3.363-.094 1.038-3.185z" />
                  </svg>
                </div>
                <span class="ml-2 text-sm text-gray-600">by {{ review.user?.name || 'Anonymous' }}</span>
              </div>
              <p class="mt-2 text-gray-700">{{ review.comment }}</p>
              
              <!-- Reply Section (Optional Future Feature) -->
              <!-- <div class="mt-4">
                <button class="text-sm text-green-600 hover:text-green-700 font-medium">Reply to review</button>
              </div> -->
            </div>
          </div>
        </div>
      </div>
    </div>
  </VendorLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/api'
import VendorLayout from '@/components/layouts/VendorLayout.vue'

const reviews = ref([])
const loading = ref(false)

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-UG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const loadReviews = async () => {
  loading.value = true
  try {
    // Assuming endpoint exists or using a generic one
    // If specific vendor reviews endpoint doesn't exist, we might need to add it to backend
    // For now, let's try a likely endpoint
    const response = await api.get('/vendor/reviews')
    reviews.value = response.data.reviews || []
  } catch (error) {
    console.error('Error loading reviews:', error)
    // Fallback or empty state if endpoint fails
    reviews.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadReviews()
})
</script>
