<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full">
      <!-- Card Container -->
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <!-- Loading State -->
        <div v-if="loading" class="text-center">
          <div class="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg class="animate-spin h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">
            Verifying Your Email
          </h2>
          <p class="text-gray-600">
            Please wait while we verify your email address...
          </p>
        </div>

        <!-- Success State -->
        <div v-else-if="success" class="text-center">
          <div class="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircleIcon class="h-10 w-10 text-green-600" />
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">
            Email Verified!
          </h2>
          <p class="text-gray-600 mb-6">
            {{ message }}
          </p>
          <router-link
            to="/login"
            class="inline-flex items-center justify-center w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
          >
            <ArrowRightIcon class="h-5 w-5 mr-2" />
            Continue to Login
          </router-link>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center">
          <div class="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircleIcon class="h-10 w-10 text-red-600" />
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">
            Verification Failed
          </h2>
          <p class="text-red-600 mb-6">
            {{ message }}
          </p>
          
          <!-- Resend Verification -->
          <div class="space-y-4">
            <div v-if="!showResendForm">
              <button
                @click="showResendForm = true"
                class="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
              >
                Request New Verification Link
              </button>
            </div>

            <!-- Resend Form -->
            <form v-else @submit.prevent="resendVerification" class="space-y-4">
              <ValidatedInput
                id="resend-email"
                v-model="resendEmail"
                type="email"
                label="Email Address"
                placeholder="you@example.com"
                :required="true"
                :validator="validators.email"
                :sanitizer="sanitizers.email"
                :icon="EnvelopeIcon"
                @validate="handleEmailValidation"
              />

              <button
                type="submit"
                :disabled="!emailValid || resending"
                class="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <span v-if="!resending">Send Verification Email</span>
                <span v-else class="flex items-center">
                  <svg class="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              </button>

              <transition name="fade">
                <div v-if="resendSuccess" class="rounded-lg bg-green-50 border border-green-200 p-4">
                  <p class="text-sm text-green-700">{{ resendMessage }}</p>
                </div>
              </transition>
            </form>

            <router-link
              to="/login"
              class="block text-center text-sm text-gray-600 hover:text-gray-900"
            >
              Back to Login
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CheckCircleIcon, XCircleIcon, ArrowRightIcon, EnvelopeIcon } from '@heroicons/vue/24/outline'
import { validators, sanitizers } from '@/utils/validation'
import ValidatedInput from '@/components/ValidatedInput.vue'
import api from '@/utils/api'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const success = ref(false)
const error = ref(false)
const message = ref('')
const showResendForm = ref(false)
const resendEmail = ref('')
const emailValid = ref(false)
const resending = ref(false)
const resendSuccess = ref(false)
const resendMessage = ref('')

function handleEmailValidation(result) {
  emailValid.value = result.valid
}

async function verifyEmail() {
  const token = route.query.token

  if (!token) {
    loading.value = false
    error.value = true
    message.value = 'No verification token provided. Please check your email for the verification link.'
    return
  }

  try {
    const response = await api.get(`/auth/verify-email?token=${token}`)
    loading.value = false
    success.value = true
    message.value = response.data.message || 'Your email has been verified successfully!'
  } catch (err) {
    loading.value = false
    error.value = true
    message.value = err.response?.data?.error || 'Verification failed. The link may be invalid or expired.'
  }
}

async function resendVerification() {
  resending.value = true
  resendSuccess.value = false
  resendMessage.value = ''

  try {
    const response = await api.post('/auth/resend-verification', {
      email: resendEmail.value.toLowerCase().trim()
    })
    
    resendSuccess.value = true
    resendMessage.value = response.data.message || 'Verification email sent! Please check your inbox.'
    
    // Reset form after 3 seconds
    setTimeout(() => {
      showResendForm.value = false
      resendEmail.value = ''
      resendSuccess.value = false
    }, 3000)
  } catch (err) {
    resendMessage.value = err.response?.data?.error || 'Failed to send verification email. Please try again.'
  } finally {
    resending.value = false
  }
}

onMounted(() => {
  verifyEmail()
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
