<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4"
  >
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900">Reset Password</h2>
        <p class="mt-2 text-sm text-gray-600">
          Enter your email to receive a reset link
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="mt-8 space-y-6">
        <div>
          <label
            for="email"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            Email address
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            class="input"
            placeholder="you@example.com"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full btn btn-primary py-3"
        >
          <span v-if="!loading">Send Reset Link</span>
          <span v-else>Sending...</span>
        </button>

        <div class="text-center">
          <router-link
            to="/login"
            class="text-sm text-blue-600 hover:text-blue-500"
          >
            Back to Login
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from "@/stores/auth";
import { ref } from "vue";

const authStore = useAuthStore();
const email = ref("");
const loading = ref(false);

async function handleSubmit() {
  loading.value = true;
  try {
    await authStore.forgotPassword(email.value);
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}
</script>
