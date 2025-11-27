<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Vendor Login
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Sign in to your vendor account
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="login">
        <input type="hidden" name="remember" value="true" />
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="email-address" class="sr-only">Email address</label>
            <input
              id="email-address"
              name="email"
              type="email"
              autocomplete="email"
              required
              v-model="email"
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
            />
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              v-model="password"
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-5 focus:z-10 sm:text-sm"
              placeholder="Password"
            />
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              v-model="rememberMe"
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label for="remember-me" class="ml-2 block text-sm text-gray-900">
              Remember me
            </label>
          </div>

          <div class="text-sm">
            <a href="#" class="font-medium text-indigo-600 hover:text-indigo-500">
              Forgot your password?
            </a>
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
              <LockClosedIcon class="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" aria-hidden="true" />
            </span>
            {{ loading ? 'Signing in...' : 'Sign in' }}
          </button>
        </div>
        <div v-if="error" class="text-red-500 text-center">
          {{ error }}
        </div>
      </form>

      <div class="text-center">
        <p class="text-sm text-gray-600">
          Don't have a vendor account?
          <router-link to="/vendor/register" class="font-medium text-indigo-600 hover:text-indigo-500">
            Register as a vendor
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { LockClosedIcon } from '@heroicons/vue/24/solid';
import api from '@/utils/api';
import { useSocketStore } from '@/stores/socket';
import { useToast } from 'vue-toastification';

const email = ref('');
const password = ref('');
const rememberMe = ref(false);
const loading = ref(false);
const error = ref('');
const authStore = useAuthStore();
const router = useRouter();
const toast = useToast();

const login = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await api.post('/vendor/login', {
      email: email.value,
      password: password.value,
    });
    
    // Extract the full user object from the backend response
    const { token: authToken, user: userData } = response.data;
    
    // Set token and user directly on the auth store refs
    authStore.token = authToken;
    authStore.user = userData;
    
    // Save to localStorage
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Connect socket
    const socketStore = useSocketStore();
    socketStore.connect();
    
    toast.success('Vendor login successful');
    router.push('/vendor');
  } catch (err) {
    error.value = err.response?.data?.error || err.message || 'Login failed';
  } finally {
    loading.value = false;
  }
};
</script>