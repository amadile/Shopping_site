<template>
  <CustomerLayout>
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">My Wishlist</h1>
          <p class="text-gray-600 mt-1">{{ wishlistItems.length }} item(s) saved</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="wishlistItems.length === 0" class="bg-white rounded-lg shadow-sm p-12 text-center">
        <svg class="mx-auto h-16 w-16 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <h3 class="text-lg font-semibold text-gray-900 mt-4">Your wishlist is empty</h3>
        <p class="text-gray-500 mt-2">Save items you love to buy them later</p>
        <router-link to="/products" class="btn btn-primary mt-6 inline-block">
          Browse Products
        </router-link>
      </div>

      <!-- Wishlist Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="item in wishlistItems" :key="item.id" class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
          <div class="relative pb-[75%] bg-gray-200">
            <img v-if="item.image" :src="item.image" :alt="item.name" class="absolute inset-0 w-full h-full object-cover" />
            <div v-else class="absolute inset-0 flex items-center justify-center text-gray-400">
              No Image
            </div>
            <button @click="removeFromWishlist(item.id)" class="absolute top-2 right-2 h-8 w-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50 transition-colors">
              <svg class="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
          <div class="p-4">
            <h3 class="font-semibold text-gray-900 truncate">{{ item.name }}</h3>
            <p class="text-sm text-gray-500 mt-1">{{ item.category }}</p>
            <div class="flex items-center justify-between mt-4">
              <span class="text-xl font-bold text-blue-600">{{ formatCurrency(item.price) }}</span>
              <button @click="addToCart(item)" class="btn btn-primary btn-sm">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </CustomerLayout>
</template>

<script setup>
import CustomerLayout from '@/components/layouts/CustomerLayout.vue';
import { formatCurrency } from '@/utils/helpers';
import { ref } from 'vue';
import { useToast } from 'vue-toastification';

const toast = useToast();

// TODO: Replace with actual API call
const wishlistItems = ref([
  // Example data - replace with API
]);

const removeFromWishlist = (id) => {
  wishlistItems.value = wishlistItems.value.filter(item => item.id !== id);
  toast.success('Removed from wishlist');
};

const addToCart = (item) => {
  // TODO: Implement add to cart
  toast.success(`${item.name} added to cart`);
};
</script>
