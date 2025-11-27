<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header Navigation -->
    <header class="bg-white shadow-md sticky top-0 z-40">
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <router-link to="/" class="flex items-center space-x-2">
            <svg
              class="h-8 w-8 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <span class="text-xl font-bold text-gray-900">ShopSite</span>
          </router-link>

          <!-- Search Bar (Desktop) -->
          <div class="hidden md:flex flex-1 max-w-md mx-8">
            <div class="w-full relative">
              <input
                type="text"
                placeholder="Search products..."
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                @input="handleSearch"
              />
              <svg
                class="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          <!-- Navigation Links -->
          <div class="flex items-center space-x-4">
            <!-- Products Link -->
            <router-link
              to="/products"
              class="hidden md:inline-block text-gray-700 hover:text-blue-600 font-medium"
            >
              Products
            </router-link>

            <!-- Cart Button -->
            <router-link
              v-if="authStore.isAuthenticated"
              to="/cart"
              class="relative p-2 text-gray-700 hover:text-blue-600"
            >
              <svg
                class="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span
                v-if="cartStore.itemCount > 0"
                class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
              >
                {{ cartStore.itemCount }}
              </span>
            </router-link>

            <!-- User Menu -->
            <div v-if="authStore.isAuthenticated" class="relative">
              <button
                @click="showUserMenu = !showUserMenu"
                class="flex items-center space-x-2 text-gray-700 hover:text-blue-600"
              >
                <img
                  v-if="authStore.user?.avatar"
                  :src="authStore.user.avatar"
                  alt="User"
                  class="h-8 w-8 rounded-full"
                />
                <div
                  v-else
                  class="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium"
                >
                  {{ authStore.user?.name?.charAt(0).toUpperCase() }}
                </div>
                <span class="hidden md:inline font-medium">{{
                  authStore.user?.name
                }}</span>
              </button>

              <!-- User Dropdown -->
              <transition
                enter-active-class="transition ease-out duration-100"
                enter-from-class="transform opacity-0 scale-95"
                enter-to-class="transform opacity-100 scale-100"
                leave-active-class="transition ease-in duration-75"
                leave-from-class="transform opacity-100 scale-100"
                leave-to-class="transform opacity-0 scale-95"
              >
                <div
                  v-if="showUserMenu"
                  class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
                >
                  <router-link
                    to="/account"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    @click="showUserMenu = false"
                  >
                    My Account
                  </router-link>
                  <router-link
                    to="/account/orders"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    @click="showUserMenu = false"
                  >
                    My Orders
                  </router-link>
                  <router-link
                    to="/account/wishlist"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    @click="showUserMenu = false"
                  >
                    Wishlist
                  </router-link>
                  <div class="border-t border-gray-200 my-1"></div>
                  <router-link
                    v-if="authStore.isAdmin"
                    to="/admin"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    @click="showUserMenu = false"
                  >
                    Admin Dashboard
                  </router-link>
                  <router-link
                    v-if="authStore.isVendor"
                    to="/vendor"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    @click="showUserMenu = false"
                  >
                    Vendor Dashboard
                  </router-link>
                  <div v-if="authStore.isAdmin || authStore.isVendor" class="border-t border-gray-200 my-1"></div>
                  <button
                    @click="handleLogout"
                    class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </transition>
            </div>

            <!-- Login/Register Buttons -->
            <div v-else class="flex items-center space-x-2">
              <router-link to="/login" class="btn btn-outline text-sm"
                >Login</router-link
              >
              <router-link to="/register" class="btn btn-primary text-sm"
                >Sign Up</router-link
              >
              <!-- Add Vendor Login Link -->
              <router-link to="/vendor/login" class="btn btn-secondary text-sm"
                >Vendor Login</router-link
              >
            </div>
          </div>
        </div>
      </nav>
    </header>

    <!-- Main Content -->
    <main class="flex-1">
      <slot></slot>
    </main>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white mt-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <!-- About -->
          <div>
            <h3 class="text-lg font-semibold mb-4">About ShopSite</h3>
            <p class="text-gray-400 text-sm">
              Your trusted online shopping destination for quality products at
              great prices.
            </p>
          </div>

          <!-- Quick Links -->
          <div>
            <h3 class="text-lg font-semibold mb-4">Quick Links</h3>
            <ul class="space-y-2 text-sm">
              <li>
                <router-link
                  to="/products"
                  class="text-gray-400 hover:text-white"
                  >Products</router-link
                >
              </li>
              <li>
                <router-link to="/about" class="text-gray-400 hover:text-white"
                  >About Us</router-link
                >
              </li>
              <li>
                <router-link
                  to="/contact"
                  class="text-gray-400 hover:text-white"
                  >Contact</router-link
                >
              </li>
            </ul>
          </div>

          <!-- Customer Service -->
          <div>
            <h3 class="text-lg font-semibold mb-4">Customer Service</h3>
            <ul class="space-y-2 text-sm">
              <li>
                <a href="#" class="text-gray-400 hover:text-white"
                  >Shipping Info</a
                >
              </li>
              <li>
                <a href="#" class="text-gray-400 hover:text-white">Returns</a>
              </li>
              <li>
                <a href="#" class="text-gray-400 hover:text-white">FAQ</a>
              </li>
            </ul>
          </div>

          <!-- Contact -->
          <div>
            <h3 class="text-lg font-semibold mb-4">Contact Us</h3>
            <ul class="space-y-2 text-sm text-gray-400">
              <li>Email: support@shopsite.com</li>
              <li>Phone: (123) 456-7890</li>
              <li>Address: 123 Shopping St, City</li>
            </ul>
          </div>
        </div>

        <div
          class="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400"
        >
          <p>
            &copy; {{ new Date().getFullYear() }} ShopSite. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const authStore = useAuthStore();
const cartStore = useCartStore();
const showUserMenu = ref(false);

onMounted(() => {
  // Fetch cart if authenticated
  if (authStore.isAuthenticated) {
    cartStore.fetchCart();
  }
});

function handleSearch(event) {
  const query = event.target.value;
  if (query.length > 2) {
    router.push({ name: "products", query: { search: query } });
  }
}

async function handleLogout() {
  showUserMenu.value = false;
  await authStore.logout();
  router.push("/login");
}
</script>