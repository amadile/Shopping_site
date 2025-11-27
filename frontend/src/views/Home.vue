<template>
  <DefaultLayout>
    <!-- Hero Section -->
    <section
      class="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1 class="text-4xl md:text-6xl font-bold mb-4">
            Welcome to ShopSite
          </h1>
          <p class="text-xl md:text-2xl mb-8">
            Discover amazing products at unbeatable prices
          </p>
          <router-link
            to="/products"
            class="btn bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3"
          >
            Shop Now
          </router-link>
        </div>
      </div>
    </section>

    <!-- Featured Categories -->
    <section class="py-16 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-gray-900 mb-8 text-center">
          Shop by Category
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div
            v-for="category in categories"
            :key="category.name"
            @click="goToCategory(category.slug)"
            class="bg-white rounded-lg shadow-md p-6 text-center cursor-pointer hover:shadow-xl transition-shadow"
          >
            <div class="text-4xl mb-3">{{ category.icon }}</div>
            <h3 class="font-semibold text-gray-900">{{ category.name }}</h3>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Products -->
    <section class="py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center mb-8">
          <h2 class="text-3xl font-bold text-gray-900">Featured Products</h2>
          <router-link
            to="/products"
            class="text-blue-600 hover:text-blue-700 font-medium"
          >
            View All →
          </router-link>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex justify-center py-12">
          <div class="spinner"></div>
        </div>

        <!-- Products Grid -->
        <div
          v-else
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <div
            v-for="product in featuredProducts"
            :key="product._id"
            @click="goToProduct(product._id)"
            class="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
          >
            <div class="aspect-w-1 aspect-h-1 bg-gray-200">
              <img
                :src="getProductImage(product)"
                :alt="product.name"
                class="w-full h-64 object-cover"
              />
            </div>
            <div class="p-4">
              <h3 class="font-semibold text-gray-900 mb-2 truncate">
                {{ product.name }}
              </h3>
              <div class="flex items-center mb-2">
                <div class="flex text-yellow-400">
                  <span v-for="i in 5" :key="i">
                    {{ i <= Math.round(product.rating || 0) ? "★" : "☆" }}
                  </span>
                </div>
                <span class="text-sm text-gray-600 ml-2"
                  >({{ product.numReviews || 0 }})</span
                >
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xl font-bold text-blue-600">
                  {{ formatCurrency(product.price) }}
                </span>
                <button
                  v-if="authStore.isAuthenticated"
                  @click.stop="addToCart(product._id)"
                  class="btn btn-primary text-sm"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-16 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="text-center">
            <div class="text-blue-600 text-5xl mb-4">🚚</div>
            <h3 class="text-xl font-semibold mb-2">Free Shipping</h3>
            <p class="text-gray-600">On orders over $50</p>
          </div>
          <div class="text-center">
            <div class="text-blue-600 text-5xl mb-4">🔒</div>
            <h3 class="text-xl font-semibold mb-2">Secure Payment</h3>
            <p class="text-gray-600">100% secure transactions</p>
          </div>
          <div class="text-center">
            <div class="text-blue-600 text-5xl mb-4">↩️</div>
            <h3 class="text-xl font-semibold mb-2">Easy Returns</h3>
            <p class="text-gray-600">30-day return policy</p>
          </div>
        </div>
      </div>
    </section>
  </DefaultLayout>
</template>

<script setup>
import DefaultLayout from "@/components/layouts/DefaultLayout.vue";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import api from "@/utils/api";
import { formatCurrency } from "@/utils/helpers";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const authStore = useAuthStore();
const cartStore = useCartStore();

const loading = ref(false);
const featuredProducts = ref([]);

const categories = [
  { name: "Electronics", slug: "electronics", icon: "📱" },
  { name: "Fashion", slug: "fashion", icon: "👕" },
  { name: "Home & Garden", slug: "home-garden", icon: "🏡" },
  { name: "Sports", slug: "sports", icon: "⚽" },
  { name: "Books", slug: "books", icon: "📚" },
  { name: "Toys", slug: "toys", icon: "🧸" },
  { name: "Beauty", slug: "beauty", icon: "💄" },
  { name: "Food", slug: "food", icon: "🍔" },
];

onMounted(async () => {
  await fetchFeaturedProducts();
});

async function fetchFeaturedProducts() {
  loading.value = true;
  try {
    const response = await api.get("/products?limit=8&sort=-rating");
    featuredProducts.value = response.data.products || [];
  } catch (error) {
    console.error("Failed to fetch products:", error);
  } finally {
    loading.value = false;
  }
}

function goToCategory(slug) {
  router.push({ name: "products", query: { category: slug } });
}

function goToProduct(id) {
  router.push({ name: "product-details", params: { id } });
}

async function addToCart(productId) {
  // Check if user is logged in
  if (!authStore.isAuthenticated) {
    console.log("User not authenticated, redirecting to login");
    router.push({
      name: "login",
      query: { redirect: router.currentRoute.value.fullPath },
    });
    return;
  }

  console.log("Adding product to cart:", productId);
  console.log("Auth token exists:", !!localStorage.getItem("authToken"));

  try {
    await cartStore.addToCart(productId, 1);
    console.log("Successfully added to cart");
  } catch (error) {
    console.error("Add to cart failed:", error.response?.status, error.response?.data);
  }
}

const getProductImage = (product) => {
  if (product.images && product.images.length > 0) {
    const img = product.images[0];
    const url = typeof img === 'string' ? img : img.url;
    if (url && url.startsWith('/')) {
      return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`;
    }
    return url;
  }
  return 'data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\' viewBox=\'0 0 200 200\'%3e%3crect width=\'200\' height=\'200\' fill=\'%23e5e7eb\'/%3e%3cpath d=\'M100 100l-20 20h40l-20-20z\' fill=\'%239ca3af\'/%3e%3ctext x=\'50%\' y=\'50%\' dominant-baseline=\'middle\' text-anchor=\'middle\' font-family=\'sans-serif\' font-size=\'14\' fill=\'%236b7280\'>No Image</text>%3c/svg%3e';
};
</script>
