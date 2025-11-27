<template>
  <div class="review-list">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading reviews...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && reviews.length === 0" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" class="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
      <p class="empty-title">No reviews yet</p>
      <p class="empty-subtitle">Be the first to review this product!</p>
    </div>

    <!-- Reviews List -->
    <div v-else class="reviews-container">
      <div 
        v-for="review in paginatedReviews" 
        :key="review._id"
        class="review-card"
      >
        <!-- Review Header -->
        <div class="review-header">
          <div class="user-info">
            <div class="user-avatar">
              {{ getInitials(review.user?.name || 'Anonymous') }}
            </div>
            <div class="user-details">
              <div class="user-name">{{ review.user?.name || 'Anonymous' }}</div>
              <div class="review-date">{{ formatDate(review.createdAt) }}</div>
            </div>
          </div>
          
          <StarRating 
            :rating="review.rating" 
            size="sm"
            readonly
          />
        </div>

        <!-- Review Content -->
        <div v-if="review.comment" class="review-comment">
          {{ review.comment }}
        </div>

        <!-- Review Footer -->
        <div class="review-footer">
          <span v-if="review.moderationStatus === 'pending'" class="status-badge pending">
            Pending Approval
          </span>
          <span v-else-if="review.moderationStatus === 'approved'" class="status-badge approved">
            Verified Purchase
          </span>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          @click="currentPage--"
          :disabled="currentPage === 1"
          class="pagination-btn"
        >
          Previous
        </button>
        
        <span class="page-info">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        
        <button 
          @click="currentPage++"
          :disabled="currentPage === totalPages"
          class="pagination-btn"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import api from '@/utils/api'
import StarRating from './StarRating.vue'

const props = defineProps({
  productId: {
    type: String,
    required: true
  },
  limit: {
    type: Number,
    default: 10
  },
  filterRating: {
    type: Number,
    default: null
  }
})

const toast = useToast()

const reviews = ref([])
const loading = ref(false)
const currentPage = ref(1)

const filteredReviews = computed(() => {
  if (!props.filterRating) return reviews.value
  return reviews.value.filter(review => review.rating === props.filterRating)
})

const paginatedReviews = computed(() => {
  const start = (currentPage.value - 1) * props.limit
  const end = start + props.limit
  return filteredReviews.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredReviews.value.length / props.limit)
})

const fetchReviews = async () => {
  loading.value = true
  try {
    const response = await api.get(`/reviews/product/${props.productId}`)
    reviews.value = response.data
  } catch (error) {
    console.error('Failed to fetch reviews:', error)
    toast.error('Failed to load reviews')
  } finally {
    loading.value = false
  }
}

const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  return date.toLocaleDateString('en-US', options)
}

// Watch for filter changes
watch(() => props.filterRating, () => {
  currentPage.value = 1
})

// Fetch reviews on mount
onMounted(() => {
  fetchReviews()
})

// Expose refresh method
defineExpose({
  fetchReviews
})
</script>

<style scoped>
.review-list {
  margin-top: 24px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #6B7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #E5E7EB;
  border-top-color: #3B82F6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: #D1D5DB;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #1F2937;
  margin: 0 0 8px 0;
}

.empty-subtitle {
  font-size: 14px;
  color: #6B7280;
  margin: 0;
}

.reviews-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  margin-bottom: 12px;
}

.user-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
}

.review-date {
  font-size: 13px;
  color: #6B7280;
}

.review-comment {
  font-size: 15px;
  line-height: 1.6;
  color: #374151;
  margin-bottom: 12px;
}

.review-footer {
  display: flex;
  gap: 8px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.pending {
  background: #FEF3C7;
  color: #92400E;
}

.status-badge.approved {
  background: #D1FAE5;
  color: #065F46;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  padding: 20px 0;
}

.pagination-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #F9FAFB;
  border-color: #3B82F6;
  color: #3B82F6;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #6B7280;
}
</style>
