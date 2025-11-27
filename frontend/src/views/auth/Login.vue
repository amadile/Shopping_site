<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full space-y-8">
      <!-- Logo/Header -->
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900">
          Sign in to your account
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Or
          <router-link
            to="/register"
            class="font-medium text-blue-600 hover:text-blue-500"
          >
            create a new account
          </router-link>
        </p>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="mt-8 space-y-6">
        <div class="rounded-md shadow-sm space-y-4">
          <!-- Email -->
          <div>
            <label
              for="email"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              Email address
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              class="input"
              :class="{ 'input-error': errors.email }"
              placeholder="you@example.com"
            />
            <p v-if="errors.email" class="mt-1 text-sm text-red-600">
              {{ errors.email }}
            </p>
          </div>

          <!-- Password -->
          <div>
            <label
              for="password"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              class="input"
              :class="{ 'input-error': errors.password }"
              placeholder="••••••••"
            />
            <p v-if="errors.password" class="mt-1 text-sm text-red-600">
              {{ errors.password }}
            </p>
          </div>
        </div>

        <!-- Remember Me & Forgot Password -->
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input
              id="remember"
              v-model="form.remember"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="remember" class="ml-2 block text-sm text-gray-900">
              Remember me
            </label>
          </div>

          <div class="text-sm">
            <router-link
              to="/forgot-password"
              class="font-medium text-blue-600 hover:text-blue-500"
            >
              Forgot password?
            </router-link>
          </div>
        </div>

        <!-- Submit Button -->
        <div>
          <button
            type="submit"
            :disabled="authStore.loading"
            class="w-full btn btn-primary py-3 text-lg"
          >
            <span v-if="!authStore.loading">Sign in</span>
            <span v-else class="flex items-center justify-center">
              <div class="spinner mr-2" style="width: 20px; height: 20px"></div>
              Signing in...
            </span>
          </button>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="rounded-md bg-red-50 p-4">
          <p class="text-sm text-red-800">{{ errorMessage }}</p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from "@/stores/auth";
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const form = reactive({
  email: "",
  password: "",
  remember: false,
});

const errors = ref({});
const errorMessage = ref("");

async function handleLogin() {
  // Clear previous errors
  errors.value = {};
  errorMessage.value = "";

  // Validate
  if (!form.email) {
    errors.value.email = "Email is required";
    return;
  }
  if (!form.password) {
    errors.value.password = "Password is required";
    return;
  }

  try {
    await authStore.login({
      email: form.email,
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
      destination = "/";
    }

    // Use window.location for a hard redirect to ensure clean state
    window.location.href = destination;
  } catch (error) {
    errorMessage.value =
      error.response?.data?.error || "Login failed. Please try again.";
  }
}
</script>
