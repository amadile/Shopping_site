<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full">
      <!-- Card Container -->
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <!-- Logo/Header -->
        <div class="text-center mb-8">
          <div
            class="mx-auto h-16 w-16 bg-green-600 rounded-full flex items-center justify-center mb-4"
          >
            <svg
              class="h-10 w-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p class="mt-2 text-sm text-gray-600">
            Sign in to your account to continue
          </p>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Email Field -->
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
            help-text="Enter your registered email address"
            @validate="handleEmailValidation"
          />

          <!-- Password Field -->
          <ValidatedInput
            id="password"
            v-model="form.password"
            type="password"
            label="Password"
            placeholder="Enter your password"
            :required="true"
            :validator="validateLoginPassword"
            autocomplete="current-password"
            :icon="LockClosedIcon"
            :show-valid-icon="false"
            @validate="handlePasswordValidation"
          />

          <!-- Remember Me & Forgot Password -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember"
                v-model="form.remember"
                type="checkbox"
                class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer"
              />
              <label
                for="remember"
                class="ml-2 block text-sm text-gray-700 cursor-pointer"
              >
                Remember me
              </label>
            </div>

            <div class="text-sm">
              <router-link
                to="/forgot-password"
                class="font-medium text-green-600 hover:text-green-500 transition-colors"
              >
                Forgot password?
              </router-link>
            </div>
          </div>

          <!-- Error Message -->
          <transition name="fade">
            <div
              v-if="errorMessage"
              class="rounded-lg bg-red-50 border border-red-200 p-4"
            >
              <div class="flex">
                <ExclamationTriangleIcon class="h-5 w-5 text-red-400 mr-3" />
                <div>
                  <h3 class="text-sm font-medium text-red-800">Login Failed</h3>
                  <p class="mt-1 text-sm text-red-700">{{ errorMessage }}</p>
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
              <LockClosedIcon class="h-5 w-5 mr-2" />
              Sign In
            </span>
            <span v-else class="flex items-center">
              <svg
                class="animate-spin h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Signing in...
            </span>
          </button>

          <!-- Divider -->
          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500"
                >New to our platform?</span
              >
            </div>
          </div>

          <!-- Register Link -->
          <div class="text-center">
            <router-link
              to="/register"
              class="font-medium text-green-600 hover:text-green-500 transition-colors"
            >
              Create a new account →
            </router-link>
          </div>

          <!-- Vendor Login Link -->
          <div class="text-center pt-4 border-t border-gray-200">
            <p class="text-sm text-gray-600 mb-2">Are you a vendor?</p>
            <router-link
              to="/vendor/login"
              class="inline-flex items-center font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              <svg
                class="h-5 w-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              Sign in as Vendor
            </router-link>
          </div>
        </form>
      </div>

      <!-- Security Notice -->
      <div class="mt-6 text-center">
        <p class="text-xs text-gray-500 flex items-center justify-center">
          <svg
            class="h-4 w-4 mr-1 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          Your connection is secure and encrypted
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import ValidatedInput from "@/components/ValidatedInput.vue";
import { useAuthStore } from "@/stores/auth";
import { sanitizers, validators } from "@/utils/validation";
import {
  EnvelopeIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
} from "@heroicons/vue/24/outline";
import { computed, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const form = reactive({
  email: "",
  password: "",
  remember: false,
});

const emailValid = ref(false);
const passwordValid = ref(false);
const errorMessage = ref("");

// Form validation state
const isFormValid = computed(() => {
  return emailValid.value && passwordValid.value && form.email && form.password;
});

// Custom password validator for login (less strict than registration)
function validateLoginPassword(value) {
  if (!value || value.trim() === "") {
    return { valid: false, message: "Password is required" };
  }
  if (value.length < 6) {
    return { valid: false, message: "Password must be at least 6 characters" };
  }
  return { valid: true, message: "" };
}

// Handle validation callbacks
function handleEmailValidation(result) {
  emailValid.value = result.valid;
}

function handlePasswordValidation(result) {
  passwordValid.value = result.valid;
}

// Handle login
async function handleLogin() {
  // Clear previous errors
  errorMessage.value = "";

  // Final validation check
  if (!isFormValid.value) {
    errorMessage.value = "Please fill in all required fields correctly";
    return;
  }

  try {
    await authStore.login({
      email: form.email.toLowerCase().trim(),
      password: form.password,
    });

    // Determine redirect destination
    const redirect = route.query.redirect;
    let destination;

    if (redirect) {
      destination = redirect;
    } else if (authStore.isAdmin) {
      destination = "/admin";
    } else if (authStore.isVendor) {
      destination = "/vendor";
    } else {
      destination = "/account";
    }

    // Use window.location for a hard redirect to ensure clean state
    window.location.href = destination;
  } catch (error) {
    console.error("Login error:", error);

    // Handle specific error messages
    const errorData = error.response?.data;
    if (errorData?.error) {
      errorMessage.value = errorData.error;
    } else if (error.response?.status === 401) {
      errorMessage.value = "Invalid email or password. Please try again.";
    } else if (error.response?.status === 429) {
      errorMessage.value = "Too many login attempts. Please try again later.";
    } else if (error.message === "Network Error") {
      errorMessage.value =
        "Network error. Please check your internet connection.";
    } else {
      errorMessage.value = "Login failed. Please try again.";
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
