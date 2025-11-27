<template>
  <div class="review-summary">
    <div class="summary-header">
      <h3 class="title">Customer Reviews</h3>
    </div>

    <div class="summary-content">
      <!-- Overall Rating -->
      <div class="overall-rating">
        <div class="rating-number">{{ averageRating.toFixed(1) }}</div>
        <div class="rating-stars">
          <StarRating 
            :rating="averageRating" 
            :show-count="true"
            :review-count="totalReviews"
            size="md"
            readonly
          />
        </div>
      </div>

      <!-- Rating Distribution -->
      <div class="rating-distribution">
        <div 
          v-for="star in [5, 4, 3, 2, 1]" 
          :key="star"
          class="distribution-row"
          @click="$emit('filter-rating', star)"
        >
          <span class="star-label">{{ star }} star</span>
          <div class="progress-bar">
            <div 
              class="progress-fill"
              :style="{ width: getPercentage(star) + '%' }"
            ></div>
          </div>
          <span class="count">{{ getRatingCount(star) }}</span>
        </div>
      </div>

      <!-- Write Review Button -->
      <button 
        v-if="canWriteReview"
        @click="$emit('write-review')"
        class="write-review-btn"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 20 20" fill="currentColor">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
        Write a Review
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import StarRating from './StarRating.vue'

const props = defineProps({
  reviews: {
    type: Array,
    default: () => []
  },
  averageRating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  canWriteReview: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['write-review', 'filter-rating'])

// Calculate rating distribution
const ratingDistribution = computed(() => {
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  
  props.reviews.forEach(review => {
    if (review.rating >= 1 && review.rating <= 5) {
      distribution[review.rating]++
    }
  })
  
  return distribution
})

const getRatingCount = (star) => {
  return ratingDistribution.value[star] || 0
}

const getPercentage = (star) => {
  if (props.totalReviews === 0) return 0
  return (getRatingCount(star) / props.totalReviews) * 100
}
</script>

<style scoped>
.review-summary {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.summary-header {
  margin-bottom: 20px;
}

.title {
  font-size: 20px;
  font-weight: 700;
  color: #1F2937;
  margin: 0;
}

.summary-content {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 24px;
  align-items: start;
}

.overall-rating {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding-right: 24px;
  border-right: 1px solid #E5E7EB;
}

.rating-number {
  font-size: 48px;
  font-weight: 700;
  color: #1F2937;
  line-height: 1;
}

.rating-stars {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.rating-distribution {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.distribution-row {
  display: grid;
  grid-template-columns: 60px 1fr 40px;
  gap: 12px;
  align-items: center;
  cursor: pointer;
  transition: opacity 0.2s;
}

.distribution-row:hover {
  opacity: 0.7;
}

.star-label {
  font-size: 14px;
  color: #6B7280;
  text-align: right;
}

.progress-bar {
  height: 8px;
  background: #E5E7EB;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #FFD700;
  transition: width 0.3s ease;
}

.count {
  font-size: 14px;
  color: #6B7280;
  text-align: right;
}

.write-review-btn {
  grid-column: 1 / -1;
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  background: #3B82F6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.write-review-btn:hover {
  background: #2563EB;
}

.write-review-btn .icon {
  width: 20px;
  height: 20px;
}

@media (max-width: 768px) {
  .summary-content {
    grid-template-columns: 1fr;
  }
  
  .overall-rating {
    padding-right: 0;
    padding-bottom: 20px;
    border-right: none;
    border-bottom: 1px solid #E5E7EB;
  }
  
  .distribution-row {
    grid-template-columns: 50px 1fr 30px;
  }
}
</style>
