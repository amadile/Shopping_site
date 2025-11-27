<template>
  <div class="review-form">
    <h3 class="form-title">Write a Review</h3>
    
    <form @submit.prevent="submitReview">
      <!-- Rating Input -->
      <div class="form-group">
        <label class="form-label">
          Your Rating <span class="required">*</span>
        </label>
        <StarRating 
          v-model:rating="formData.rating"
          size="lg"
          :readonly="false"
          @change="ratingError = ''"
        />
        <p v-if="ratingError" class="error-message">{{ ratingError }}</p>
      </div>

      <!-- Comment Input -->
      <div class="form-group">
        <label class="form-label" for="comment">
          Your Review
        </label>
        <textarea
          id="comment"
          v-model="formData.comment"
          rows="5"
          maxlength="1000"
          placeholder="Share your thoughts about this product..."
          class="form-textarea"
          @input="commentError = ''"
        ></textarea>
        <div class="textarea-footer">
          <p v-if="commentError" class="error-message">{{ commentError }}</p>
          <span class="char-count">
            {{ formData.comment.length }} / 1000
          </span>
        </div>
      </div>

      <!-- Submit Button -->
      <div class="form-actions">
        <button 
          type="button"
          @click="$emit('cancel')"
          class="btn btn-secondary"
          :disabled="submitting"
        >
          Cancel
        </button>
        <button 
          type="submit"
          class="btn btn-primary"
          :disabled="submitting"
        >
          {{ submitting ? 'Submitting...' : 'Submit Review' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import api from '@/utils/api'
import StarRating from './StarRating.vue'

const props = defineProps({
  productId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['success', 'cancel'])

const toast = useToast()
const authStore = useAuthStore()

const formData = reactive({
  rating: 0,
  comment: ''
})

const submitting = ref(false)
const ratingError = ref('')
const commentError = ref('')

const validateForm = () => {
  let isValid = true
  
  // Validate rating
  if (formData.rating === 0) {
    ratingError.value = 'Please select a rating'
    isValid = false
  }
  
  // Validate comment (optional but if provided, check length)
  if (formData.comment.length > 1000) {
    commentError.value = 'Comment must be 1000 characters or less'
    isValid = false
  }
  
  return isValid
}

const submitReview = async () => {
  // Reset errors
  ratingError.value = ''
  commentError.value = ''
  
  // Validate
  if (!validateForm()) {
    return
  }
  
  // Check authentication
  if (!authStore.isAuthenticated) {
    toast.error('Please login to submit a review')
    return
  }
  
  submitting.value = true
  
  try {
    const response = await api.post('/reviews', {
      productId: props.productId,
      rating: formData.rating,
      comment: formData.comment.trim() || undefined
    })
    
    toast.success('Review submitted successfully! It will be visible after moderation.')
    
    // Reset form
    formData.rating = 0
    formData.comment = ''
    
    // Emit success event
    emit('success', response.data)
  } catch (error) {
    console.error('Review submission error:', error)
    const errorMessage = error.response?.data?.error || 'Failed to submit review'
    toast.error(errorMessage)
    
    // Handle specific errors
    if (errorMessage.includes('already reviewed')) {
      ratingError.value = 'You have already reviewed this product'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.review-form {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-title {
  font-size: 20px;
  font-weight: 700;
  color: #1F2937;
  margin: 0 0 24px 0;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.required {
  color: #EF4444;
}

.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 15px;
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  transition: border-color 0.2s;
}

.form-textarea:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea::placeholder {
  color: #9CA3AF;
}

.textarea-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.char-count {
  font-size: 13px;
  color: #6B7280;
  margin-left: auto;
}

.error-message {
  font-size: 13px;
  color: #EF4444;
  margin: 0;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #D1D5DB;
}

.btn-secondary:hover:not(:disabled) {
  background: #F9FAFB;
}

.btn-primary {
  background: #3B82F6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563EB;
}

@media (max-width: 640px) {
  .form-actions {
    flex-direction: column-reverse;
  }
  
  .btn {
    width: 100%;
  }
}
</style>
