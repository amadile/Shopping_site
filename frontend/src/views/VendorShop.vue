<template>
  <DefaultLayout>
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div
          class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"
        ></div>
        <p class="mt-4 text-gray-600">Loading vendor store...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <p class="text-red-600 mb-4">{{ error }}</p>
        <button @click="fetchVendorData" class="btn btn-primary">
          Try Again
        </button>
      </div>

      <div v-else-if="vendor">
        <!-- Vendor Header -->
        <div class="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <!-- Banner -->
          <div class="h-48 bg-gray-200 relative">
            <img
              v-if="vendor.banner"
              :src="vendor.banner"
              alt="Vendor Banner"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center bg-gray-300 text-gray-500">
              No Banner
            </div>
          </div>

          <!-- Profile Info -->
          <div class="px-6 py-4 relative">
            <div class="flex flex-col md:flex-row items-start md:items-end -mt-16 mb-4">
              <!-- Logo -->
              <div class="w-24 h-24 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg mr-4">
                <img
                  v-if="vendor.logo"
                  :src="vendor.logo"
                  alt="Vendor Logo"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-2xl font-bold">
                  {{ vendor.businessName.charAt(0) }}
                </div>
              </div>

              <!-- Details -->
              <div class="flex-1 mt-4 md:mt-0">
                <h1 class="text-3xl font-bold text-gray-900">{{ vendor.businessName }}</h1>
                <div class="flex items-center text-gray-600 mt-1">
                  <span class="mr-4">📍 {{ vendor.address?.district || 'Uganda' }}</span>
                  <div class="flex items-center">
                    <span class="text-yellow-500 mr-1">★</span>
                    <span>{{ (vendor.rating || 0).toFixed(1) }} ({{ vendor.totalReviews || 0 }} reviews)</span>
                  </div>
                </div>
              </div>
            </div>

            <p class="text-gray-700 mb-4">{{ vendor.description }}</p>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-gray-200 mb-6">
          <button
            @click="activeTab = 'products'"
            class="px-6 py-3 font-medium text-sm focus:outline-none"
            :class="activeTab === 'products' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'"
          >
            Products
          </button>
          <button
            @click="activeTab = 'reviews'"
            class="px-6 py-3 font-medium text-sm focus:outline-none"
            :class="activeTab === 'reviews' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'"
          >
            Reviews
          </button>
        </div>

        <!-- Products Tab -->
        <div v-if="activeTab === 'products'">
          <div v-if="products.length === 0" class="text-center py-12 text-gray-500">
            No products found for this vendor.
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div
              v-for="product in products"
              :key="product._id"
              class="card hover:shadow-xl transition-shadow cursor-pointer bg-white rounded-lg shadow overflow-hidden"
              @click="goToProduct(product._id)"
            >
              <!-- Product Image -->
              <div class="relative pb-[75%] bg-gray-200">
                <img
                  v-if="product.images && product.images.length > 0"
                  :src="product.images[0]"
                  :alt="product.name"
                  class="absolute inset-0 w-full h-full object-cover"
                />
                <div v-else class="absolute inset-0 flex items-center justify-center text-gray-400">
                  No Image
                </div>
              </div>

              <!-- Product Info -->
              <div class="p-4">
                <h3 class="font-semibold text-lg mb-2 truncate">{{ product.name }}</h3>
                <div class="flex items-center justify-between">
                  <span class="text-xl font-bold text-primary">{{ formatCurrency(product.price) }}</span>
                  <button
                    @click.stop="addToCart(product)"
                    class="btn btn-primary btn-sm"
                    :disabled="product.stockQuantity === 0"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Pagination -->
           <div v-if="totalPages > 1" class="flex justify-center items-center gap-2 mt-8">
            <button
              @click="changePage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="btn btn-secondary btn-sm"
            >
              Previous
            </button>
            <span class="text-gray-600">Page {{ currentPage }} of {{ totalPages }}</span>
            <button
              @click="changePage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="btn btn-secondary btn-sm"
            >
              Next
            </button>
          </div>
        </div>

        <!-- Reviews Tab -->
        <div v-if="activeTab === 'reviews'">
          <!-- Add Review Form -->
          <div v-if="isAuthenticated" class="bg-white p-6 rounded-lg shadow mb-8">
            <h3 class="text-lg font-semibold mb-4">Write a Review</h3>
            <form @submit.prevent="submitReview">
              <div class="mb-4">
                <label class="block text-gray-700 mb-2">Rating</label>
                <div class="flex gap-2">
                  <button
                    v-for="star in 5"
                    :key="star"
                    type="button"
                    @click="newReview.rating = star"
                    class="text-2xl focus:outline-none"
                    :class="star <= newReview.rating ? 'text-yellow-500' : 'text-gray-300'"
                  >
                    ★
                  </button>
                </div>
              </div>
              <div class="mb-4">
                <label class="block text-gray-700 mb-2">Comment</label>
                <textarea
                  v-model="newReview.comment"
                  class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows="3"
                  placeholder="Share your experience..."
                  required
                ></textarea>
              </div>
              <button type="submit" class="btn btn-primary" :disabled="submittingReview">
                {{ submittingReview ? 'Submitting...' : 'Submit Review' }}
              </button>
            </form>
          </div>
          <div v-else class="bg-blue-50 p-4 rounded-lg mb-8 text-center">
            <p class="text-blue-700">Please <router-link :to="{ name: 'login', query: { redirect: $route.fullPath } }" class="underline font-bold">login</router-link> to write a review.</p>
          </div>

          <!-- Reviews List -->
          <div v-if="reviews.length === 0" class="text-center py-12 text-gray-500">
            No reviews yet. Be the first to review!
          </div>
          <div v-else class="space-y-4">
            <div v-for="review in reviews" :key="review._id" class="bg-white p-6 rounded-lg shadow">
              <div class="flex items-center justify-between mb-2">
                <div class="font-semibold">{{ review.user?.name || 'Anonymous' }}</div>
                <div class="text-sm text-gray-500">{{ formatDate(review.createdAt) }}</div>
              </div>
              <div class="flex text-yellow-500 mb-2">
                <span v-for="n in 5" :key="n">
                  {{ n <= review.rating ? '★' : '☆' }}
                </span>
              </div>
              <p class="text-gray-700">{{ review.comment }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import DefaultLayout from "@/components/layouts/DefaultLayout.vue";
import { useCartStore } from "@/stores/cart";
import { useAuthStore } from "@/stores/auth";
import api from "@/utils/api";
import { formatCurrency } from "@/utils/helpers";
import { ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();
const authStore = useAuthStore();
const toast = useToast();

const activeTab = ref("products");
const loading = ref(true);
const error = ref("");
const vendor = ref(null);
const products = ref([]);
const reviews = ref([]);
const isAuthenticated = ref(authStore.isAuthenticated);

// Pagination
const currentPage = ref(1);
const totalPages = ref(1);

// Review Form
const newReview = ref({
  rating: 5,
  comment: ""
});
const submittingReview = ref(false);

const fetchVendorData = async () => {
  const id = route.params.vendorId;
  console.log('Fetching data for vendorId:', id);
  loading.value = true;
  error.value = "";
  try {
    // Fetch Vendor Profile
    const vendorRes = await api.get(`/vendor/${id}`);
    console.log('Vendor response:', vendorRes.data);
    vendor.value = vendorRes.data.vendor;

    // Fetch Products
    await fetchProducts(id);

    // Fetch Reviews
    await fetchReviews(id);

  } catch (err) {
    console.error("Error fetching vendor data:", err);
    error.value = err.response?.data?.error || "Failed to load vendor shop";
  } finally {
    loading.value = false;
  }
};

const fetchProducts = async (id) => {
  try {
    const res = await api.get(`/vendor/${id}/products`, {
      params: { page: currentPage.value, limit: 12 }
    });
    products.value = res.data.products;
    totalPages.value = res.data.pagination.pages;
  } catch (err) {
    console.error("Error fetching products:", err);
  }
};

const fetchReviews = async (id) => {
  try {
    const res = await api.get(`/vendor/${id}/reviews`);
    reviews.value = res.data.reviews;
  } catch (err) {
    console.error("Error fetching reviews:", err);
  }
};

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchProducts(route.params.vendorId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
};

const submitReview = async () => {
  if (!isAuthenticated.value) return;
  
  submittingReview.value = true;
  try {
    const id = route.params.vendorId;
    await api.post(`/vendor/${id}/reviews`, newReview.value);
    toast.success("Review submitted successfully!");
    newReview.value = { rating: 5, comment: "" };
    fetchReviews(id); // Refresh reviews
    // Update vendor rating locally or refetch vendor
    const vendorRes = await api.get(`/vendor/${id}`);
    vendor.value = vendorRes.data.vendor;
  } catch (err) {
    toast.error(err.response?.data?.error || "Failed to submit review");
  } finally {
    submittingReview.value = false;
  }
};

const addToCart = async (product) => {
  try {
    await cartStore.addToCart(product._id, 1);
    toast.success(`${product.name} added to cart`);
  } catch (err) {
    toast.error("Failed to add to cart");
  }
};

const goToProduct = (id) => {
  router.push(`/products/${id}`);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

onMounted(() => {
  fetchVendorData();
});

// Watch for route changes to reload if vendorId changes
watch(() => route.params.vendorId, (newId) => {
  if (newId) {
    fetchVendorData();
  }
});
</script>
