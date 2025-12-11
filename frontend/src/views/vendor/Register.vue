<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-2xl w-full">
      <!-- Card Container -->
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <!-- Logo/Header -->
        <div class="text-center mb-8">
          <div class="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center mb-4">
            <svg class="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-gray-900">
            Become a Vendor
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            Start selling on our platform today
          </p>
        </div>

        <!-- Registration Form -->
        <form @submit.prevent="handleRegister" class="space-y-5">
          <!-- Business Information Section -->
          <div class="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Business Name -->
              <div class="md:col-span-2">
                <ValidatedInput
                  id="businessName"
                  v-model="form.businessName"
                  type="text"
                  label="Business Name"
                  placeholder="Your Business Name"
                  :required="true"
                  :validator="validators.businessName"
                  :prevent-pattern="/[a-zA-Z0-9\s\-&.,()]/"
                  autocomplete="organization"
                  :icon="BuildingStorefrontIcon"
                  help-text="Enter your registered business name"
                  @validate="handleBusinessNameValidation"
                />
              </div>

              <!-- Business Email -->
              <ValidatedInput
                id="businessEmail"
                v-model="form.businessEmail"
                type="email"
                label="Business Email"
                placeholder="business@example.com"
                :required="true"
                :validator="validators.email"
                :sanitizer="sanitizers.email"
                :prevent-pattern="/[a-zA-Z0-9@._-]/"
                autocomplete="email"
                :icon="EnvelopeIcon"
                help-text="Your business contact email"
                @validate="handleEmailValidation"
              />

              <!-- Business Phone -->
              <ValidatedInput
                id="businessPhone"
                v-model="form.businessPhone"
                type="tel"
                label="Business Phone"
                placeholder="+256700000000"
                :required="true"
                :validator="validators.phoneUganda"
                :sanitizer="sanitizers.phone"
                :prevent-pattern="/[0-9+]/"
                autocomplete="tel"
                :icon="PhoneIcon"
                help-text="Uganda phone number"
                @validate="handlePhoneValidation"
              />

              <!-- Business Type -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Business Type <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="form.businessType"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                  required
                >
                  <option value="individual">Individual</option>
                  <option value="company">Company</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Location Section -->
          <div class="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Business Location</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- District -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  District <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="form.district"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                  required
                >
                  <option value="">Select District</option>
                  <option v-for="district in districts" :key="district" :value="district">
                    {{ district }}
                  </option>
                </select>
              </div>

              <!-- Zone (Kampala only) -->
              <div v-if="form.district === 'Kampala'">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Kampala Zone
                </label>
                <select
                  v-model="form.zone"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                >
                  <option value="">Select Zone</option>
                  <option v-for="zone in kampalaZones" :key="zone" :value="zone">
                    {{ zone }}
                  </option>
                </select>
              </div>

              <!-- Landmark -->
              <div :class="form.district === 'Kampala' ? '' : 'md:col-span-2'">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Landmark
                </label>
                <input
                  v-model="form.landmark"
                  type="text"
                  placeholder="e.g., Near City Square Mall"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                />
              </div>

              <!-- TIN Number -->
              <div :class="form.district === 'Kampala' ? 'md:col-span-2' : ''">
                <ValidatedInput
                  id="tinNumber"
                  v-model="form.tinNumber"
                  type="text"
                  label="TIN Number (Optional)"
                  placeholder="1234567890"
                  :required="false"
                  :validator="form.tinNumber ? validators.tin : () => ({ valid: true, message: '' })"
                  :sanitizer="sanitizers.numbersOnly"
                  :prevent-pattern="/[0-9]/"
                  help-text="10-digit Tax Identification Number"
                  @validate="handleTinValidation"
                />
              </div>
            </div>
          </div>

          <!-- Security Section -->
          <div class="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Account Security</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Password -->
              <ValidatedInput
                id="vendor-password"
                v-model="form.password"
                type="password"
                label="Password"
                placeholder="Create a strong password"
                :required="true"
                :validator="validators.password"
                autocomplete="new-password"
                :icon="LockClosedIcon"
                :show-strength="true"
                help-text="Min 8 chars, 1 uppercase, 1 number, 1 special"
                @validate="handlePasswordValidation"
              />

              <!-- Confirm Password -->
              <ValidatedInput
                id="vendor-confirmPassword"
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
            </div>
          </div>

          <!-- Terms & Conditions -->
          <div class="flex items-start">
            <div class="flex items-center h-5">
              <input
                id="vendor-terms"
                v-model="form.acceptTerms"
                type="checkbox"
                class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                required
              />
            </div>
            <div class="ml-3 text-sm">
              <label for="vendor-terms" class="font-medium text-gray-700 cursor-pointer">
                I agree to the vendor 
                <router-link to="/vendor-terms" class="text-indigo-600 hover:text-indigo-500">Terms and Conditions</router-link>
                and understand the commission structure
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
            :disabled="!isFormValid || loading"
            class="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <span v-if="!loading" class="flex items-center">
              <BuildingStorefrontIcon class="h-5 w-5 mr-2" />
              Register as Vendor
            </span>
            <span v-else class="flex items-center">
              <svg class="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Registering...
            </span>
          </button>

          <!-- Divider -->
          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">Already a vendor?</span>
            </div>
          </div>

          <!-- Login Link -->
          <div class="text-center">
            <router-link
              to="/vendor/login"
              class="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Sign in to your vendor account →
            </router-link>
          </div>

          <!-- Customer Registration Link -->
          <div class="text-center pt-4 border-t border-gray-200">
            <p class="text-sm text-gray-600 mb-2">Looking to shop instead?</p>
            <router-link
              to="/register"
              class="inline-flex items-center font-medium text-green-600 hover:text-green-500 transition-colors"
            >
              <svg class="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Register as Customer
            </router-link>
          </div>
        </form>
      </div>

      <!-- Security Notice -->
      <div class="mt-6 text-center">
        <p class="text-xs text-gray-500 flex items-center justify-center">
          <svg class="h-4 w-4 mr-1 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Your business data is protected with enterprise-grade encryption
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { validators, sanitizers } from '@/utils/validation'
import ValidatedInput from '@/components/ValidatedInput.vue'
import api from '@/utils/api'
import { 
  BuildingStorefrontIcon,
  EnvelopeIcon,
  PhoneIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const toast = useToast()

const form = reactive({
  businessName: '',
  businessEmail: '',
  businessPhone: '',
  password: '',
  confirmPassword: '',
  businessType: 'individual',
  district: '',
  zone: '',
  landmark: '',
  tinNumber: '',
  acceptTerms: false
})

const businessNameValid = ref(false)
const emailValid = ref(false)
const phoneValid = ref(false)
const passwordValid = ref(false)
const confirmPasswordValid = ref(false)
const tinValid = ref(true) // Optional field, default to true
const errorMessage = ref('')
const successMessage = ref('')
const loading = ref(false)

// Districts and zones
const districts = ref([
  "Kampala", "Wakiso", "Mukono", "Entebbe", "Jinja", "Mbale", "Mbarara", 
  "Kasese", "Fort Portal", "Masaka", "Kalangala", "Kiboga", "Luwero", "Kayunga"
])

const kampalaZones = ref([
  "Nakawa", "Kawempe", "Rubaga", "Makindye", "Kira", "Bugolobi", 
  "Wandegeya", "Kibuli", "Makerere", "Kyambogo", "Kibuye", "Kisugu", "Nsambya"
])

// Form validation state
const isFormValid = computed(() => {
  return (
    businessNameValid.value &&
    emailValid.value &&
    phoneValid.value &&
    passwordValid.value &&
    confirmPasswordValid.value &&
    tinValid.value &&
    form.acceptTerms &&
    form.businessName &&
    form.businessEmail &&
    form.businessPhone &&
    form.password &&
    form.confirmPassword &&
    form.district
  )
})

// Handle validation callbacks
function handleBusinessNameValidation(result) {
  businessNameValid.value = result.valid
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

function handleTinValidation(result) {
  tinValid.value = result.valid
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

  loading.value = true

  try {
    // Prepare data in the format the backend expects
    const registrationData = {
      businessName: form.businessName.trim(),
      businessEmail: form.businessEmail.toLowerCase().trim(),
      businessPhone: form.businessPhone.trim(),
      password: form.password,
      businessType: form.businessType,
      district: form.district,
      zone: form.zone || undefined,
      landmark: form.landmark || undefined,
      tinNumber: form.tinNumber || undefined
    }
    
    const response = await api.post('/vendor/register', registrationData)
    
    successMessage.value = 'Vendor registration successful! Redirecting to login...'
    toast.success('Registration successful! Please sign in.')
    
    // Redirect to login after 2 seconds
    setTimeout(() => {
      router.push('/vendor/login')
    }, 2000)
  } catch (error) {
    console.error('Vendor registration error:', error)
    
    // Handle specific error messages
    const errorData = error.response?.data
    if (errorData?.errors) {
      // Handle validation errors array
      errorMessage.value = errorData.errors.map(e => e.msg).join(', ')
    } else if (errorData?.error) {
      errorMessage.value = errorData.error
    } else if (error.response?.status === 409) {
      errorMessage.value = 'A vendor account with this email already exists.'
    } else if (error.response?.status === 422) {
      errorMessage.value = 'Invalid data provided. Please check your inputs.'
    } else if (error.message === 'Network Error') {
      errorMessage.value = 'Network error. Please check your internet connection.'
    } else {
      errorMessage.value = 'Registration failed. Please try again.'
    }
  } finally {
    loading.value = false
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