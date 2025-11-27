<template>
  <DefaultLayout>
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold mb-4">Products</h1>

        <!-- Search and Filters -->
        <div class="flex flex-col md:flex-row gap-4 mb-6">
          <!-- Search -->
          <div class="flex-1">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search products..."
              class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              @input="debouncedSearch"
            />
          </div>

          <!-- Category Filter -->
          <select
            v-model="selectedCategory"
            class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            @change="filterProducts"
          >
            <option value="">All Categories</option>
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing</option>
            <option value="books">Books</option>
            <option value="home">Home & Garden</option>
            <option value="sports">Sports</option>
            <option value="toys">Toys</option>
          </select>

          <!-- Sort -->
          <select
            v-model="sortBy"
            class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            @change="filterProducts"
          >
            <option value="name">Name</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Rating</option>
            <option value="newest">Newest</option>
          </select>
        </div>

        <!-- Results Count -->
        <p class="text-gray-600">
          Showing {{ products.length }} of {{ totalProducts }} products
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div
          class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"
        ></div>
        <p class="mt-4 text-gray-600">Loading products...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <p class="text-red-600 mb-4">{{ error }}</p>
        <button @click="fetchProducts" class="btn btn-primary">
          Try Again
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="products.length === 0" class="text-center py-12">
        <p class="text-gray-600 mb-4">No products found</p>
        <button @click="resetFilters" class="btn btn-primary">
          Clear Filters
        </button>
      </div>

      <!-- Product Grid -->
      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8"
      >
        <div
          v-for="product in products"
          :key="product._id"
          class="card hover:shadow-xl transition-shadow cursor-pointer"
          @click="goToProduct(product._id)"
        >
          <!-- Product Image -->
          <div
            class="relative pb-[75%] bg-gray-200 rounded-t-lg overflow-hidden"
          >
            <img
              v-if="product.images && product.images.length > 0"
              :src="getProductImage(product)"
              :alt="product.name"
              class="absolute inset-0 w-full h-full object-cover"
            />
            <div
              v-else
              class="absolute inset-0 flex items-center justify-center text-gray-400"
            >
              No Image
            </div>

            <!-- Stock Badge -->
            <span
              v-if="product.stockQuantity === 0"
              class="absolute top-2 right-2 badge badge-error"
            >
              Out of Stock
            </span>
            <span
              v-else-if="product.stockQuantity < 10"
              class="absolute top-2 right-2 badge badge-warning"
            >
              Low Stock
            </span>
          </div>

          <!-- Product Info -->
          <div class="p-4">
            <h3 class="font-semibold text-lg mb-2 truncate">
              {{ product.name }}
            </h3>
            <p class="text-gray-600 text-sm mb-2 line-clamp-2">
              {{ product.description }}
            </p>

            <!-- Rating -->
            <div class="flex items-center mb-2">
              <div class="text-yellow-500 text-sm">
                <span v-for="n in 5" :key="n">
                  <span v-if="n <= Math.floor(product.averageRating || 0)">★</span>
                  <span v-else-if="n === Math.ceil(product.averageRating || 0) && (product.averageRating || 0) % 1 >= 0.5">★</span>
                  <span v-else class="text-gray-300">★</span>
                </span>
              </div>
              <span class="text-gray-600 text-sm ml-2">
                ({{ product.reviewCount || 0 }})
              </span>
            </div>

            <!-- Price -->
            <div class="flex items-center justify-between">
              <div>
                <span class="text-2xl font-bold text-primary">
                  {{ formatCurrency(product.price) }}
                </span>
                <span
                  v-if="product.compareAtPrice"
                  class="text-sm text-gray-500 line-through ml-2"
                >
                  {{ formatCurrency(product.compareAtPrice) }}
                </span>
              </div>

              <!-- Add to Cart -->
              <button
                @click.stop="addToCart(product)"
                :disabled="product.stockQuantity === 0"
                class="btn btn-primary btn-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-5 h-5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-center items-center gap-2">
        <button
          @click="changePage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="btn btn-secondary btn-sm"
          :class="{ 'opacity-50 cursor-not-allowed': currentPage === 1 }"
        >
          Previous
        </button>

        <button
          v-for="page in visiblePages"
          :key="page"
          @click="changePage(page)"
          class="btn btn-sm"
          :class="page === currentPage ? 'btn-primary' : 'btn-secondary'"
        >
          {{ page }}
        </button>

        <button
          @click="changePage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="btn btn-secondary btn-sm"
          :class="{
            'opacity-50 cursor-not-allowed': currentPage === totalPages,
          }"
        >
          Next
        </button>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import DefaultLayout from "@/components/layouts/DefaultLayout.vue";
import { useCartStore } from "@/stores/cart";
import api from "@/utils/api";
import { debounce, formatCurrency } from "@/utils/helpers";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";

const router = useRouter();
const cartStore = useCartStore();
const toast = useToast();

// State
const products = ref([]);
const loading = ref(false);
const error = ref("");
const searchQuery = ref("");
const selectedCategory = ref("");
const sortBy = ref("name");
const currentPage = ref(1);
const totalProducts = ref(0);
const totalPages = ref(1);
const pageSize = 12;

// Fetch products
const fetchProducts = async () => {
  loading.value = true;
  error.value = "";

  try {
    const params = {
      page: currentPage.value,
      limit: pageSize,
      sort: sortBy.value,
    };

    if (searchQuery.value) {
      params.search = searchQuery.value;
    }

    if (selectedCategory.value) {
      params.category = selectedCategory.value;
    }

    const response = await api.get("/products", { params });
    products.value = response.data.products || response.data;
    totalProducts.value = response.data.total || products.value.length;
    totalPages.value =
      response.data.pages || Math.ceil(totalProducts.value / pageSize);
  } catch (err) {
    error.value = err.response?.data?.message || "Failed to load products";
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
};

// Debounced search
const debouncedSearch = debounce(() => {
  currentPage.value = 1;
  fetchProducts();
}, 500);

// Filter products
const filterProducts = () => {
  currentPage.value = 1;
  fetchProducts();
};

// Reset filters
const resetFilters = () => {
  searchQuery.value = "";
  selectedCategory.value = "";
  sortBy.value = "name";
  currentPage.value = 1;
  fetchProducts();
};

// Change page
const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchProducts();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
};

// Visible pages for pagination
const visiblePages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages.value, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
});

// Go to product details
const goToProduct = (id) => {
  router.push(`/products/${id}`);
};

// Add to cart
const addToCart = async (product) => {
  try {
    await cartStore.addToCart(product._id, 1);
    toast.success(`${product.name} added to cart`);
  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to add to cart");
  }
};

const getProductImage = (product) => {
  if (product.images && product.images.length > 0) {
    const img = product.images[0];
    const url = typeof img === 'string' ? img : img.url;
    if (url && url.startsWith('/')) {
      return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`;
    }
    return url;
  }
  return null;
};

// Initialize
onMounted(() => {
  fetchProducts();
});
</script>
