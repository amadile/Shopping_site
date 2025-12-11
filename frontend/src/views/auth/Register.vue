<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full">
      <!-- Card Container -->
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <!-- Logo/Header -->
        <div class="text-center mb-8">
          <div class="mx-auto h-16 w-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
            <svg class="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-gray-900">
            Create Account
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            Join thousands of happy shoppers
          </p>
        </div>

        <!-- Registration Form -->
        <form @submit.prevent="handleRegister" class="space-y-5">
          <!-- Full Name -->
          <ValidatedInput
            id="name"
            v-model="form.name"
            type="text"
            label="Full Name"
            placeholder="John Doe"
            :required="true"
            :validator="validators.name"
            :sanitizer="sanitizers.name"
            :prevent-pattern="/[a-zA-Z\s-]/"
            autocomplete="name"
            :icon="UserIcon"
            help-text="Enter your first and last name"
            @validate="handleNameValidation"
          />

          <!-- Email -->
          <ValidatedInput
            id="email"
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
            help-text="We'll never share your email"
            @validate="handleEmailValidation"
          />

          <!-- Phone Number -->
          <ValidatedInput
            id="phone"
            v-model="form.phone"
            type="tel"
            label="Phone Number"
            placeholder="+256700000000 or 0700000000"
            :required="true"
            :validator="validators.phoneUganda"
            :sanitizer="sanitizers.phone"
            :prevent-pattern="/[0-9+]/"
            autocomplete="tel"
            :icon="PhoneIcon"
            help-text="Uganda phone number format"
            @validate="handlePhoneValidation"
          />

          <!-- Password -->
          <ValidatedInput
            id="password"
            v-model="form.password"
            type="password"
            label="Password"
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
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="Re-enter your password"
            :required="true"
            :validator="(value) => validators.confirmPassword(form.password, value)"
            autocomplete="new-password"
            :icon="LockClosedIcon"
            @validate="handleConfirmPasswordValidation"
          />

          <!-- Terms & Conditions -->
          <div class="flex items-start">
            <div class="flex items-center h-5">
              <input
                id="terms"
                v-model="form.acceptTerms"
                type="checkbox"
                class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer"
                required
              />
            </div>
            <div class="ml-3 text-sm">
              <label for="terms" class="font-medium text-gray-700 cursor-pointer">
                I agree to the 
                <router-link to="/terms" class="text-green-600 hover:text-green-500">Terms and Conditions</router-link>
                and 
                <router-link to="/privacy" class="text-green-600 hover:text-green-500">Privacy Policy</router-link>
              </label>
            </div>
          </div>

          <!-- Error Message -->
          <transition name="fade">
            <div v-if="errorMessage" class="rounded-lg bg-red-50 border border-red-200 p-4">
              <div class="flex">
                <ExclamationTriangleIcon class="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
                <div>
                  <h3 class="text-sm font-medium text-red-800">Registration Failed</h3>
                  <p class="mt-1 text-sm text-red-700">{{ errorMessage }}</p>
                </div>
              </div>
            </div>
          </transition>

          <!-- Success Message -->
          <transition name="fade">
            <div v-if="successMessage" class="rounded-lg bg-green-50 border border-green-200 p-4">
              <div class="flex">
                <CheckCircleIcon class="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                <div>
                  <h3 class="text-sm font-medium text-green-800">Success!</h3>
                  <p class="mt-1 text-sm text-green-700">{{ successMessage }}</p>
                </div>
              </div>
            </div>
          </transition>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="!isFormValid || authStore.loading"
            class="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <span v-if="!authStore.loading" class="flex items-center">
              <UserIcon class="h-5 w-5 mr-2" />
              Create Account
            </span>
            <span v-else class="flex items-center">
              <svg class="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating account...
            </span>
          </button>

          <!-- Divider -->
          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">Already have an account?</span>
            </div>
          </div>

          <!-- Login Link -->
          <div class="text-center">
            <router-link
              to="/login"
              class="font-medium text-green-600 hover:text-green-500 transition-colors"
            >
              Sign in instead →
            </router-link>
          </div>

          <!-- Vendor Registration Link -->
          <div class="text-center pt-4 border-t border-gray-200">
            <p class="text-sm text-gray-600 mb-2">Want to sell on our platform?</p>
            <router-link
              to="/vendor/register"
              class="inline-flex items-center font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              <svg class="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Register as Vendor
            </router-link>
          </div>
        </form>
      </div>

      <!-- Security Notice -->
      <div class="mt-6 text-center">
        <p class="text-xs text-gray-500 flex items-center justify-center">
          <svg class="h-4 w-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Your data is protected with 256-bit encryption
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { validators, sanitizers } from '@/utils/validation'
import ValidatedInput from '@/components/ValidatedInput.vue'
import { 
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false
})

const nameValid = ref(false)
const emailValid = ref(false)
const phoneValid = ref(false)
const passwordValid = ref(false)
const confirmPasswordValid = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Form validation state
const isFormValid = computed(() => {
  return (
    nameValid.value &&
    emailValid.value &&
    phoneValid.value &&
    passwordValid.value &&
    confirmPasswordValid.value &&
    form.acceptTerms &&
    form.name &&
    form.email &&
    form.phone &&
    form.password &&
    form.confirmPassword
  )
})

// Handle validation callbacks
function handleNameValidation(result) {
  nameValid.value = result.valid
}

function handleEmailValidation(result) {
  emailValid.value = result.valid
}

function handlePhoneValidation(result) {
  phoneValid.value = result.valid
}

function handlePasswordValidation(result) {
  passwordValid.value = result.valid
}

function handleConfirmPasswordValidation(result) {
  confirmPasswordValid.value = result.valid
}

// Handle registration
async function handleRegister() {
  // Clear previous messages
  errorMessage.value = ''
  successMessage.value = ''

  // Final validation check
  if (!isFormValid.value) {
    errorMessage.value = 'Please fill in all required fields correctly'
    return
  }

  try {
    await authStore.register({
      name: form.name.trim(),
      email: form.email.toLowerCase().trim(),
      phone: form.phone.trim(),
      password: form.password
    })

    successMessage.value = 'Account created successfully! Redirecting...'
    
    // Redirect after short delay
    setTimeout(() => {
      router.push('/')
    }, 1500)
  } catch (error) {
    console.error('Registration error:', error)
    
    // Handle specific error messages
    const errorData = error.response?.data
    if (errorData?.error) {
      errorMessage.value = errorData.error
    } else if (error.response?.status === 409) {
      errorMessage.value = 'An account with this email already exists.'
    } else if (error.response?.status === 422) {
      errorMessage.value = 'Invalid data provided. Please check your inputs.'
    } else if (error.message === 'Network Error') {
      errorMessage.value = 'Network error. Please check your internet connection.'
    } else {
      errorMessage.value = 'Registration failed. Please try again.'
    }
  }
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
