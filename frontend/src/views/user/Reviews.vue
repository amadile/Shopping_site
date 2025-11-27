<template>
  <CustomerLayout>
  <div class="user-reviews-page">
    <div class="page-header">
      <h1 class="text-2xl font-bold text-gray-900">My Reviews</h1>
      <p class="text-gray-600 mt-1">Manage your product reviews and ratings</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading your reviews...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && reviews.length === 0" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" class="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.055A7 7 0 0112 19a7 7 0 01-7-7m7 0a7 7 0 014-4.85" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900">No reviews yet</h3>
      <p class="text-gray-500 mt-1">You haven't written any reviews yet.</p>
      <router-link to="/products" class="btn btn-primary mt-4">
        Browse Products
      </router-link>
    </div>

    <!-- Reviews List -->
    <div v-else class="reviews-grid">
      <div v-for="review in reviews" :key="review._id" class="review-card">
        <div class="review-header">
          <div class="product-info">
            <img 
              :src="getImageUrl(review.product?.images?.[0])" 
              :alt="review.product?.name"
              class="product-thumb"
            >
            <div class="product-details">
              <router-link 
                :to="`/products/${review.product?._id}`"
                class="product-name hover:text-blue-600"
              >
                {{ review.product?.name || 'Unknown Product' }}
              </router-link>
              <div class="review-date">{{ formatDate(review.createdAt) }}</div>
            </div>
          </div>
          
          <div class="review-status">
            <span 
              class="status-badge"
              :class="review.moderationStatus"
            >
              {{ review.moderationStatus }}
            </span>
          </div>
        </div>

        <div class="review-content">
          <StarRating 
            :rating="review.rating" 
            size="sm"
            readonly
            class="mb-2"
          />
          <p class="comment">{{ review.comment }}</p>
        </div>

        <div class="review-actions">
          <button 
            @click="deleteReview(review._id)" 
            class="btn-delete"
            :disabled="deleting === review._id"
          >
            {{ deleting === review._id ? 'Deleting...' : 'Delete Review' }}
          </button>
        </div>
      </div>
    </div>
  </div>
  </CustomerLayout>
</template>

<script setup>
import CustomerLayout from '@/components/layouts/CustomerLayout.vue'
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import api from '@/utils/api'
import StarRating from '@/components/StarRating.vue'

const toast = useToast()
const reviews = ref([])
const loading = ref(true)
const deleting = ref(null)

const fetchReviews = async () => {
  loading.value = true
  try {
    const response = await api.get('/reviews/user/me')
    reviews.value = response.data
  } catch (error) {
    console.error('Failed to fetch reviews:', error)
    toast.error('Failed to load your reviews')
  } finally {
    loading.value = false
  }
}

const deleteReview = async (reviewId) => {
  if (!confirm('Are you sure you want to delete this review?')) return

  deleting.value = reviewId
  try {
    await api.delete(`/reviews/${reviewId}`)
    toast.success('Review deleted successfully')
    // Remove from list
    reviews.value = reviews.value.filter(r => r._id !== reviewId)
  } catch (error) {
    console.error('Failed to delete review:', error)
    toast.error('Failed to delete review')
  } finally {
    deleting.value = null
  }
}

const getImageUrl = (path) => {
  if (!path) return '/placeholder-image.jpg'
  const url = typeof path === 'string' ? path : path.url
  if (url && url.startsWith('/')) {
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`
  }
  return url
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

onMounted(() => {
  fetchReviews()
})
</script>

<style scoped>
.user-reviews-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  margin-bottom: 32px;
  border-bottom: 1px solid #E5E7EB;
  padding-bottom: 16px;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 60px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #E5E7EB;
  border-top-color: #3B82F6;
  border-radius: 50%;
  margin: 0 auto 16px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: #D1D5DB;
  margin: 0 auto 16px;
}

.reviews-grid {
  display: grid;
  gap: 24px;
}

.review-card {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 20px;
  transition: box-shadow 0.2s;
}

.review-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.product-info {
  display: flex;
  gap: 16px;
  align-items: center;
}

.product-thumb {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  background: #F3F4F6;
}

.product-name {
  font-weight: 600;
  color: #1F2937;
  display: block;
  margin-bottom: 4px;
}

.review-date {
  font-size: 13px;
  color: #6B7280;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
}

.status-badge.pending {
  background: #FEF3C7;
  color: #92400E;
}

.status-badge.approved {
  background: #D1FAE5;
  color: #065F46;
}

.status-badge.rejected {
  background: #FEE2E2;
  color: #991B1B;
}

.review-content {
  margin-bottom: 16px;
}

.comment {
  color: #4B5563;
  line-height: 1.5;
}

.review-actions {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #F3F4F6;
  padding-top: 16px;
}

.btn-delete {
  color: #EF4444;
  font-size: 14px;
  font-weight: 500;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.btn-delete:hover:not(:disabled) {
  background: #FEE2E2;
}

.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  display: inline-block;
  background: #3B82F6;
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
}

@media (max-width: 640px) {
  .review-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .status-badge {
    align-self: flex-start;
  }
}
</style>
