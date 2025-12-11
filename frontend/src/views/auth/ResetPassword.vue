<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full">
      <!-- Card Container -->
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="mx-auto h-16 w-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
            <svg class="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-gray-900">
            Reset Password
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            Create a new password for your account
          </p>
        </div>

        <!-- Success State -->
        <div v-if="resetSuccess" class="text-center">
          <div class="rounded-lg bg-green-50 border border-green-200 p-4 mb-6">
            <div class="flex">
              <CheckCircleIcon class="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
              <div class="text-left">
                <h3 class="text-sm font-medium text-green-800">Password Reset Successful!</h3>
                <p class="mt-1 text-sm text-green-700">
                  Your password has been reset successfully. You can now log in with your new password.
                </p>
              </div>
            </div>
          </div>

          <router-link
            to="/login"
            class="inline-flex items-center justify-center w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
          >
            <ArrowRightIcon class="h-5 w-5 mr-2" />
            Continue to Login
          </router-link>
        </div>

        <!-- Form State -->
        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
          <!-- New Password -->
          <ValidatedInput
            id="new-password"
            v-model="form.password"
            type="password"
            label="New Password"
            placeholder="Create a strong password"
            :required="true"
            :validator="validators.password"
            autocomplete="new-password"
            :icon="LockClosedIcon"
            :show-strength="true"
            help-text="Min 8 chars, 1 uppercase, 1 number, 1 special char"
            @validate="handlePasswordValidation"
          />

          <!-- Confirm Password -->
          <ValidatedInput
            id="confirm-password"
            v-model="form.confirmPassword"
            type="password"
            label="Confirm New Password"
            placeholder="Re-enter your password"
            :required="true"
            :validator="(value) => validators.confirmPassword(form.password, value)"
            autocomplete="new-password"
            :icon="LockClosedIcon"
            @validate="handleConfirmPasswordValidation"
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
            class="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <span v-if="!loading" class="flex items-center">
              <LockClosedIcon class="h-5 w-5 mr-2" />
              Reset Password
            </span>
            <span v-else class="flex items-center">
              <svg class="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Resetting...
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

        <!-- Security Tips -->
        <div class="mt-6 bg-blue-50 rounded-lg p-4">
          <div class="flex">
            <svg class="h-5 w-5 text-blue-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div class="text-sm text-blue-700">
              <p class="font-medium">Password Security Tips:</p>
              <ul class="mt-1 list-disc list-inside space-y-1">
                <li>Use a unique password you don't use elsewhere</li>
                <li>Mix uppercase, lowercase, numbers & symbols</li>
                <li>Avoid personal information</li>
                <li>Consider using a password manager</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Security Notice -->
      <div class="mt-6 text-center">
        <p class="text-xs text-gray-500 flex items-center justify-center">
          <svg class="h-4 w-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Your password is encrypted and secure
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { validators } from '@/utils/validation'
import ValidatedInput from '@/components/ValidatedInput.vue'
import api from '@/utils/api'
import { 
  LockClosedIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()

const form = reactive({
  password: '',
  confirmPassword: ''
})

const passwordValid = ref(false)
const confirmPasswordValid = ref(false)
const errorMessage = ref('')
const loading = ref(false)
const resetSuccess = ref(false)
const token = ref('')

const isFormValid = computed(() => {
  return passwordValid.value && confirmPasswordValid.value && form.password && form.confirmPassword
})

function handlePasswordValidation(result) {
  passwordValid.value = result.valid
}

function handleConfirmPasswordValidation(result) {
  confirmPasswordValid.value = result.valid
}

async function handleSubmit() {
  errorMessage.value = ''

  if (!isFormValid.value) {
    errorMessage.value = 'Please fill in all fields correctly'
    return
  }

  if (!token.value) {
    errorMessage.value = 'Invalid reset link. Please request a new password reset.'
    return
  }

  loading.value = true

  try {
    await api.post('/auth/reset-password', {
      token: token.value,
      password: form.password
    })

    resetSuccess.value = true
  } catch (error) {
    console.error('Reset password error:', error)
    
    const errorData = error.response?.data
    if (errorData?.error) {
      errorMessage.value = errorData.error
    } else if (error.response?.status === 400) {
      errorMessage.value = 'Invalid or expired reset link. Please request a new password reset.'
    } else {
      errorMessage.value = 'Failed to reset password. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // Get token from query params
  token.value = route.query.token || ''
  
  if (!token.value) {
    errorMessage.value = 'No reset token provided. Please check your email for the reset link.'
  }
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
