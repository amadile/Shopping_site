<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full">
      <!-- Card Container -->
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <svg class="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-gray-900">
            Forgot Password?
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            No worries! Enter your email and we'll send you reset instructions.
          </p>
        </div>

        <!-- Success State -->
        <div v-if="emailSent" class="text-center">
          <div class="rounded-lg bg-green-50 border border-green-200 p-4 mb-6">
            <div class="flex">
              <CheckCircleIcon class="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
              <div class="text-left">
                <h3 class="text-sm font-medium text-green-800">Email Sent!</h3>
                <p class="mt-1 text-sm text-green-700">
                  {{ successMessage }}
                </p>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <button
              @click="resetForm"
              class="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
            >
              Send Another Email
            </button>

            <router-link
              to="/login"
              class="block text-center text-sm text-gray-600 hover:text-gray-900"
            >
              Back to Login
            </router-link>
          </div>
        </div>

        <!-- Form State -->
        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Email Field -->
          <ValidatedInput
            id="forgot-email"
            v-model="form.email"
            type="email"
            label="Email Address"
            placeholder="you@example.com"
            :required="true"
            :validator="validators.email"
            :sanitizer="sanitizers.email"
            :prevent-pattern="/[a-zA-Z0-9@._-]/"
            autocomplete="email"
            :icon="EnvelopeIcon"
            help-text="Enter the email address associated with your account"
            @validate="handleEmailValidation"
          />

          <!-- Error Message -->
          <transition name="fade">
            <div v-if="errorMessage" class="rounded-lg bg-red-50 border border-red-200 p-4">
              <div class="flex">
                <ExclamationTriangleIcon class="h-5 w-5 text-red-400 mr-3" />
                <div>
                  <h3 class="text-sm font-medium text-red-800">Error</h3>
                  <p class="mt-1 text-sm text-red-700">{{ errorMessage }}</p>
                </div>
              </div>
            </div>
          </transition>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="!isFormValid || loading"
            class="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <span v-if="!loading" class="flex items-center">
              <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Send Reset Link
            </span>
            <span v-else class="flex items-center">
              <svg class="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </span>
          </button>

          <!-- Back to Login -->
          <div class="text-center">
            <router-link
              to="/login"
              class="text-sm font-medium text-green-600 hover:text-green-500 transition-colors"
            >
              ← Back to Login
            </router-link>
          </div>
        </form>

        <!-- Info Box -->
        <div class="mt-6 bg-blue-50 rounded-lg p-4">
          <div class="flex">
            <svg class="h-5 w-5 text-blue-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="text-sm text-blue-700">
              <p class="font-medium">Didn't receive the email?</p>
              <ul class="mt-1 list-disc list-inside space-y-1">
                <li>Check your spam folder</li>
                <li>Make sure you entered the correct email</li>
                <li>Wait a few minutes and try again</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Security Notice -->
      <div class="mt-6 text-center">
        <p class="text-xs text-gray-500 flex items-center justify-center">
          <svg class="h-4 w-4 mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Your account security is our priority
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { validators, sanitizers } from '@/utils/validation'
import ValidatedInput from '@/components/ValidatedInput.vue'
import api from '@/utils/api'
import { 
  EnvelopeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/vue/24/outline'

const form = reactive({
  email: ''
})

const emailValid = ref(false)
const errorMessage = ref('')
const loading = ref(false)
const emailSent = ref(false)
const successMessage = ref('')

const isFormValid = computed(() => {
  return emailValid.value && form.email
})

function handleEmailValidation(result) {
  emailValid.value = result.valid
}

async function handleSubmit() {
  errorMessage.value = ''

  if (!isFormValid.value) {
    errorMessage.value = 'Please enter a valid email address'
    return
  }

  loading.value = true

  try {
    const response = await api.post('/auth/forgot-password', {
      email: form.email.toLowerCase().trim()
    })

    emailSent.value = true
    successMessage.value = response.data.message || 'Password reset instructions have been sent to your email.'
  } catch (error) {
    console.error('Forgot password error:', error)
    errorMessage.value = error.response?.data?.error || 'Failed to send reset email. Please try again.'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  emailSent.value = false
  form.email = ''
  errorMessage.value = ''
  successMessage.value = ''
}
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
