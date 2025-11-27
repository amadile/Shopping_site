<template>
  <DefaultLayout>
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div
          class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"
        ></div>
        <p class="mt-4 text-gray-600">Loading product...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <p class="text-red-600 mb-4">{{ error }}</p>
        <button @click="$router.push('/products')" class="btn btn-primary">
          Back to Products
        </button>
      </div>

      <!-- Product Details -->
      <div v-else-if="product" class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Image Gallery -->
        <div>
          <div
            class="relative pb-[100%] bg-gray-200 rounded-lg overflow-hidden mb-4"
          >
            <img
              :src="selectedImage"
              :alt="product.name"
              class="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          <!-- Thumbnail Gallery -->
          <div
            v-if="product.images && product.images.length > 1"
            class="grid grid-cols-4 gap-2"
          >
            <div
              v-for="(image, index) in product.images"
              :key="index"
              @click="selectedImage = getImageUrl(image)"
              class="relative pb-[100%] bg-gray-200 rounded cursor-pointer overflow-hidden"
              :class="{ 'ring-2 ring-primary': selectedImage === getImageUrl(image) }"
            >
              <img
                :src="getImageUrl(image)"
                :alt="`${product.name} ${index + 1}`"
                class="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        <!-- Product Info -->
        <div>
          <h1 class="text-3xl font-bold mb-4">{{ product.name }}</h1>

          <!-- Rating -->
          <div class="flex items-center mb-4">
            <StarRating 
              :rating="product.averageRating || 0" 
              :show-count="false"
              size="md"
              readonly
            />
            <span class="text-gray-600 ml-2">
              {{ product.averageRating ? product.averageRating.toFixed(1) : '0.0' }} ({{ product.reviewCount || 0 }} {{ product.reviewCount === 1 ? 'review' : 'reviews' }})
            </span>
          </div>

          <!-- Price -->
          <div class="mb-6">
            <span class="text-4xl font-bold text-primary">
              {{ formatCurrency(product.price) }}
            </span>
            <span
              v-if="product.compareAtPrice"
              class="text-xl text-gray-500 line-through ml-4"
            >
              {{ formatCurrency(product.compareAtPrice) }}
            </span>
            <span v-if="product.compareAtPrice" class="text-green-600 ml-2">
              Save
              {{ calculateDiscount(product.price, product.compareAtPrice) }}%
            </span>
          </div>

          <!-- Description -->
          <p class="text-gray-700 mb-6">{{ product.description }}</p>

          <!-- Stock Status -->
          <div class="mb-6">
            <span v-if="product.stockQuantity > 10" class="badge badge-success">
              In Stock
            </span>
            <span
              v-else-if="product.stockQuantity > 0"
              class="badge badge-warning"
            >
              Only {{ product.stockQuantity }} left!
            </span>
            <span v-else class="badge badge-error"> Out of Stock </span>
          </div>

          <!-- Variants (if any) -->
          <div
            v-if="product.variants && product.variants.length > 0"
            class="mb-6"
          >
            <label class="block font-semibold mb-2">Select Variant:</label>
            <select
              v-model="selectedVariant"
              class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option :value="null">Default</option>
              <option
                v-for="variant in product.variants"
                :key="variant._id"
                :value="variant"
              >
                {{ variant.name }} - {{ formatCurrency(variant.price) }}
                {{ variant.stock === 0 ? "(Out of Stock)" : "" }}
              </option>
            </select>
          </div>

          <!-- Quantity -->
          <div class="mb-6">
            <label class="block font-semibold mb-2">Quantity:</label>
            <div class="flex items-center gap-4">
              <button
                @click="quantity = Math.max(1, quantity - 1)"
                class="btn btn-secondary"
              >
                -
              </button>
              <input
                v-model.number="quantity"
                type="number"
                min="1"
                :max="product.stockQuantity"
                class="w-20 text-center px-4 py-2 border rounded-lg"
              />
              <button
                @click="
                  quantity = Math.min(product.stockQuantity, quantity + 1)
                "
                class="btn btn-secondary"
              >
                +
              </button>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-4 mb-6">
            <button
              @click="addToCart"
              :disabled="product.stockQuantity === 0 || addingToCart"
              class="btn btn-primary flex-1"
            >
              {{ addingToCart ? "Adding..." : "Add to Cart" }}
            </button>
            <button @click="buyNow" class="btn btn-secondary flex-1">
              Buy Now
            </button>
          </div>

          <!-- Additional Info -->
          <div class="border-t pt-6">
            <h3 class="font-semibold mb-2">Product Details</h3>
            <ul class="space-y-2 text-gray-700">
              <li><span class="font-medium">SKU:</span> {{ product.sku }}</li>
              <li>
                <span class="font-medium">Category:</span>
                {{ product.category }}
              </li>
              <li v-if="product.brand">
                <span class="font-medium">Brand:</span> {{ product.brand }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Reviews Section -->
      <div v-if="product" class="mt-12" id="reviews">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Left Column: Summary & Form -->
          <div class="lg:col-span-1 space-y-8">
            <ReviewSummary 
              :reviews="reviews"
              :average-rating="product.averageRating || 0"
              :total-reviews="product.reviewCount || 0"
              :can-write-review="!showReviewForm"
              @write-review="showReviewForm = true"
              @filter-rating="filterRating = $event"
            />
            
            <ReviewForm 
              v-if="showReviewForm"
              :product-id="product._id"
              @success="handleReviewSuccess"
              @cancel="showReviewForm = false"
            />
          </div>

          <!-- Right Column: Reviews List -->
          <div class="lg:col-span-2">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold">Customer Reviews</h2>
              <button 
                v-if="filterRating" 
                @click="filterRating = null"
                class="text-sm text-primary hover:underline"
              >
                Clear Filter
              </button>
            </div>

            <ReviewList 
              ref="reviewListRef"
              :product-id="product._id"
              :filter-rating="filterRating"
            />
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import DefaultLayout from "@/components/layouts/DefaultLayout.vue";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import api from "@/utils/api";
import {
  calculateDiscount,
  formatCurrency,
  formatRelativeTime,
} from "@/utils/helpers";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import StarRating from "@/components/StarRating.vue";
import ReviewSummary from "@/components/ReviewSummary.vue";
import ReviewList from "@/components/ReviewList.vue";
import ReviewForm from "@/components/ReviewForm.vue";

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();
const authStore = useAuthStore();
const toast = useToast();

// State
const product = ref(null);
const reviews = ref([]);
const loading = ref(false);
const error = ref("");
const selectedImage = ref("");
const selectedVariant = ref(null);
const quantity = ref(1);
const addingToCart = ref(false);

// Review State
const showReviewForm = ref(false);
const filterRating = ref(null);
const reviewListRef = ref(null);

// Fetch product
const fetchProduct = async () => {
  loading.value = true;
  error.value = "";

  try {
    const response = await api.get(`/products/${route.params.id}`);
    product.value = response.data;
    selectedImage.value = getImageUrl(product.value.images?.[0]);

    // Fetch reviews
    await fetchReviews();
  } catch (err) {
    error.value = err.response?.data?.message || "Failed to load product";
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
};

// Fetch reviews
const fetchReviews = async () => {
  try {
    const response = await api.get(`/reviews/product/${route.params.id}`);
    reviews.value = response.data;
  } catch (err) {
    console.error("Failed to load reviews:", err);
  }
};

// Add to cart
const addToCart = async () => {
  if (!authStore.isAuthenticated) {
    toast.warning("Please login to add items to cart");
    router.push("/login");
    return;
  }

  addingToCart.value = true;
  try {
    await cartStore.addToCart(
      product.value._id,
      quantity.value,
      selectedVariant.value?._id
    );
    toast.success(`${product.value.name} added to cart`);
  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to add to cart");
  } finally {
    addingToCart.value = false;
  }
};

// Buy now
const buyNow = async () => {
  await addToCart();
  if (addingToCart.value === false) {
    router.push("/cart");
  }
};

// Handle review success
const handleReviewSuccess = async (newReview) => {
  showReviewForm.value = false;
  // Refresh reviews list
  if (reviewListRef.value) {
    await reviewListRef.value.fetchReviews();
  }
  // Refresh product to update rating
  await fetchProduct();
};

const getImageUrl = (path) => {
  if (!path) return '';
  const url = typeof path === 'string' ? path : path.url;
  if (url && url.startsWith('/')) {
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`;
  }
  return url;
};

// Initialize
onMounted(() => {
  fetchProduct();
});
</script>
