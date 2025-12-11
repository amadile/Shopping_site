<template>
  <AdminLayout>
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Manage Products</h1>
      </div>

      <!-- Filters and Search -->
      <div class="bg-white p-4 rounded-lg shadow mb-6">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex-1">
            <input
              v-model="searchQuery"
              @input="debounceSearch"
              type="text"
              placeholder="Search by name, description, or vendor..."
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div class="w-full md:w-48">
            <div class="flex items-center h-full">
              <input
                id="lowStock"
                type="checkbox"
                v-model="filterLowStock"
                @change="loadProducts"
                class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label for="lowStock" class="ml-2 block text-sm text-gray-900">
                Low Stock Only
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
        ></div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="bg-white shadow-md rounded-lg overflow-hidden text-center py-12"
      >
        <div class="text-red-500 text-5xl mb-4">⚠️</div>
        <p class="text-gray-600 mb-4">Failed to load products</p>
        <button
          @click="loadProducts"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>

      <!-- Products Table -->
      <div v-else class="bg-white shadow-md rounded-lg overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Product
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Vendor
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Price
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Stock
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="product in products"
              :key="product._id"
              class="hover:bg-gray-50"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="h-10 w-10 flex-shrink-0">
                    <img
                      class="h-10 w-10 rounded object-cover"
                      :src="
                        product.images?.[0] || 'https://via.placeholder.com/40'
                      "
                      alt=""
                    />
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ product.name }}
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ product.category }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div class="font-medium text-gray-900">
                  {{ product.vendor?.businessName || "Unknown" }}
                </div>
                <div class="text-xs text-gray-400">
                  {{ product.vendor?.email }}
                </div>
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium"
              >
                {{ formatCurrency(product.price) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span
                  :class="product.stock < 10 ? 'text-red-600 font-bold' : ''"
                >
                  {{ product.stock }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    product.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800',
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                  ]"
                >
                  {{ product.isActive ? "Active" : "Inactive" }}
                </span>
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
              >
                <button
                  @click="deleteProduct(product._id)"
                  class="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
            <tr v-if="products.length === 0">
              <td colspan="6" class="px-6 py-10 text-center text-gray-500">
                No products found matching your criteria.
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div
          v-if="totalPages > 1"
          class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6"
        >
          <div
            class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between"
          >
            <div>
              <p class="text-sm text-gray-700">
                Showing page
                <span class="font-medium">{{ currentPage }}</span> of
                <span class="font-medium">{{ totalPages }}</span>
              </p>
            </div>
            <div>
              <nav
                class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  @click="changePage(currentPage - 1)"
                  :disabled="currentPage === 1"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  :class="{
                    'opacity-50 cursor-not-allowed': currentPage === 1,
                  }"
                >
                  Previous
                </button>
                <button
                  @click="changePage(currentPage + 1)"
                  :disabled="currentPage === totalPages"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  :class="{
                    'opacity-50 cursor-not-allowed': currentPage === totalPages,
                  }"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 z-50 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div
          class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
        >
          <div
            class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            aria-hidden="true"
            @click="showDeleteModal = false"
          ></div>
          <span
            class="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
            >&#8203;</span
          >
          <div
            class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
          >
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div class="sm:flex sm:items-start">
                <div
                  class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"
                >
                  <svg
                    class="h-6 w-6 text-red-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3
                    class="text-lg leading-6 font-medium text-gray-900"
                    id="modal-title"
                  >
                    Delete Product
                  </h3>
                  <div class="mt-2">
                    <p class="text-sm text-gray-500">
                      Are you sure you want to delete this product? This action
                      cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div
              class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse"
            >
              <button
                @click="confirmDelete"
                type="button"
                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                :disabled="deleting"
              >
                {{ deleting ? "Deleting..." : "Delete" }}
              </button>
              <button
                @click="showDeleteModal = false"
                type="button"
                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import AdminLayout from "@/components/layouts/AdminLayout.vue";
import api from "@/utils/api";
import { onMounted, ref } from "vue";
import { useToast } from "vue-toastification";

const toast = useToast();

// State
const products = ref([]);
const loading = ref(false);
const searchQuery = ref("");
const filterLowStock = ref(false);
const currentPage = ref(1);
const totalPages = ref(1);

// Delete Modal
const showDeleteModal = ref(false);
const productToDelete = ref(null);
const deleting = ref(false);

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
  }).format(amount);
};

// Debounce search
let searchTimeout = null;
const debounceSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    loadProducts();
  }, 500);
};

// Load products
const loadProducts = async () => {
  loading.value = true;
  error.value = false;
  try {
    const params = {
      page: currentPage.value,
      limit: 10,
      lowStock: filterLowStock.value,
      search: searchQuery.value,
    };

    const response = await api.get("/admin/products", { params });
    products.value = response.data.products || [];
    totalPages.value = response.data.totalPages || 1;
    currentPage.value = response.data.currentPage || 1;
  } catch (err) {
    console.error("Error loading products:", err);
    error.value = true;
    toast.error("Failed to load products. Please try again.");
  } finally {
    loading.value = false;
  }
};

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    loadProducts();
  }
};

// Delete Product
const deleteProduct = (productId) => {
  productToDelete.value = productId;
  showDeleteModal.value = true;
};

const confirmDelete = async () => {
  if (!productToDelete.value) return;

  deleting.value = true;
  try {
    await api.delete(`/products/${productToDelete.value}`);

    // Remove from local list
    products.value = products.value.filter(
      (p) => p._id !== productToDelete.value
    );

    toast.success("Product deleted successfully");
    showDeleteModal.value = false;
    productToDelete.value = null;

    // Reload if list becomes empty
    if (products.value.length === 0 && currentPage.value > 1) {
      currentPage.value--;
      loadProducts();
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    toast.error("Failed to delete product");
  } finally {
    deleting.value = false;
  }
};

onMounted(() => {
  loadProducts();
});
</script>
