<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4"
  >
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900">Reset Your Password</h2>
        <p class="mt-2 text-sm text-gray-600">Enter your new password</p>
      </div>

      <form @submit.prevent="handleSubmit" class="mt-8 space-y-6">
        <div>
          <label
            for="password"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            New Password
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="input"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label
            for="confirmPassword"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            class="input"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full btn btn-primary py-3"
        >
          <span v-if="!loading">Reset Password</span>
          <span v-else>Resetting...</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from "@/stores/auth";
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const password = ref("");
const confirmPassword = ref("");
const loading = ref(false);

async function handleSubmit() {
  if (password.value !== confirmPassword.value) {
    toast.error("Passwords do not match");
    return;
  }

  loading.value = true;
  try {
    await authStore.resetPassword(route.params.token, password.value);
    router.push("/login");
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}
</script>
