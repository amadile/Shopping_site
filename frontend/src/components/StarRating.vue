<template>
  <div class="star-rating" :class="{ 'readonly': readonly, [`size-${size}`]: true }">
    <div class="stars-container">
      <div 
        v-for="star in maxStars" 
        :key="star"
        class="star"
        :class="{ 
          'filled': star <= Math.floor(rating),
          'half': star === Math.ceil(rating) && rating % 1 !== 0,
          'empty': star > Math.ceil(rating),
          'hoverable': !readonly
        }"
        @click="!readonly && handleClick(star)"
        @mouseenter="!readonly && handleHover(star)"
        @mouseleave="!readonly && handleHoverEnd()"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          :fill="getStarFill(star)"
          class="star-icon"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </div>
    </div>
    
    <div v-if="showCount && reviewCount !== undefined" class="review-count">
      ({{ reviewCount }} {{ reviewCount === 1 ? 'review' : 'reviews' }})
    </div>
    
    <div v-if="showRating" class="rating-value">
      {{ rating.toFixed(1) }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  rating: {
    type: Number,
    default: 0,
    validator: (value) => value >= 0 && value <= 5
  },
  maxStars: {
    type: Number,
    default: 5
  },
  readonly: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  showCount: {
    type: Boolean,
    default: false
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  showRating: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:rating', 'change'])

const hoverRating = ref(0)

const getStarFill = (star) => {
  const currentRating = hoverRating.value || props.rating
  
  if (star <= Math.floor(currentRating)) {
    return '#FFD700' // Gold for filled stars
  } else if (star === Math.ceil(currentRating) && currentRating % 1 !== 0) {
    return 'url(#half-fill)' // Half-filled star
  } else {
    return '#E5E7EB' // Gray for empty stars
  }
}

const handleClick = (star) => {
  emit('update:rating', star)
  emit('change', star)
}

const handleHover = (star) => {
  hoverRating.value = star
}

const handleHoverEnd = () => {
  hoverRating.value = 0
}
</script>

<style scoped>
.star-rating {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.stars-container {
  display: flex;
  gap: 2px;
}

.star {
  cursor: default;
  transition: transform 0.2s ease;
}

.star.hoverable {
  cursor: pointer;
}

.star.hoverable:hover {
  transform: scale(1.1);
}

.star-icon {
  display: block;
  transition: fill 0.2s ease;
}

/* Size variants */
.size-sm .star-icon {
  width: 16px;
  height: 16px;
}

.size-md .star-icon {
  width: 20px;
  height: 20px;
}

.size-lg .star-icon {
  width: 24px;
  height: 24px;
}

.review-count {
  font-size: 14px;
  color: #6B7280;
  white-space: nowrap;
}

.rating-value {
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
}

.readonly .star {
  cursor: default;
}
</style>
