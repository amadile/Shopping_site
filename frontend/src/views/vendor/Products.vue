<template>
  <VendorLayout>
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex justify-end items-center mb-6">
        <div class="flex gap-3">
          <button
            @click="showUploadModal = true"
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                clip-rule="evenodd"
              />
            </svg>
            Bulk Upload
          </button>
          <button
            v-if="products.length > 0"
            @click="exportProducts"
            class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
            Export CSV
          </button>
          <router-link
            to="/vendor/products/add"
            class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clip-rule="evenodd"
              />
            </svg>
            Add Product
          </router-link>
        </div>
      </div>

      <!-- Bulk Actions Toolbar -->
      <div
        v-if="selectedProducts.length > 0"
        class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center"
      >
        <span class="text-sm font-medium text-blue-900"
          >{{ selectedProducts.length }} product(s) selected</span
        >
        <div class="flex gap-2">
          <button
            @click="bulkActivate"
            class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            Activate
          </button>
          <button
            @click="bulkDeactivate"
            class="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
          >
            Deactivate
          </button>
          <button
            @click="bulkDelete"
            class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Delete
          </button>
          <button
            @click="clearSelection"
            class="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
          >
            Clear
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"
        ></div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="products.length === 0"
        class="bg-white rounded-lg shadow-md p-12 text-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-16 w-16 mx-auto text-gray-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        <h3 class="text-xl font-medium text-gray-900 mb-2">No products yet</h3>
        <p class="text-gray-500 mb-6">
          Start selling by adding your first product or uploading a CSV file.
        </p>
        <div class="flex gap-3 justify-center">
          <button
            @click="showUploadModal = true"
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Bulk Upload
          </button>
          <router-link
            to="/vendor/products/add"
            class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded inline-block"
            >Add Product</router-link
          >
        </div>
      </div>

      <!-- Products Table -->
      <div v-else class="bg-white shadow-md rounded-lg overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  @change="toggleSelectAll"
                  :checked="isAllSelected"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
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
                Category
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
              :class="{ 'bg-blue-50': isSelected(product._id) }"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  :checked="isSelected(product._id)"
                  @change="toggleSelect(product._id)"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="h-10 w-10 flex-shrink-0">
                    <img
                      class="h-10 w-10 rounded-full object-cover"
                      :src="getProductImage(product)"
                      alt=""
                    />
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ product.name }}
                    </div>
                    <div class="text-sm text-gray-500 truncate max-w-xs">
                      {{ product.description }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ product.category }}
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium"
              >
                {{ formatCurrency(product.price) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span
                  :class="
                    product.stock < 10
                      ? 'text-red-600 font-semibold'
                      : 'text-gray-500'
                  "
                  >{{ product.stock
                  }}<span v-if="product.stock < 10" class="text-xs"
                    >(Low)</span
                  ></span
                >
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    product.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800',
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                  ]"
                  >{{ product.isActive ? "Active" : "Inactive" }}</span
                >
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
              >
                <router-link
                  :to="`/vendor/products/${product._id}/edit`"
                  class="text-green-600 hover:text-green-900 mr-4"
                  >Edit</router-link
                ><button
                  @click="deleteProduct(product._id)"
                  class="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Bulk Upload Modal -->
      <BulkUploadModal
        :isOpen="showUploadModal"
        @close="showUploadModal = false"
        @success="handleUploadSuccess"
      />
    </div>
  </VendorLayout>
</template>

<script setup>
import VendorLayout from "@/components/layouts/VendorLayout.vue";
import BulkUploadModal from "@/components/vendor/BulkUploadModal.vue";
import api from "@/utils/api";
import { computed, onMounted, ref } from "vue";
import { useToast } from "vue-toastification";
const toast = useToast();

const products = ref([]);
const loading = ref(false);
const selectedProducts = ref([]);
const showUploadModal = ref(false);

const isAllSelected = computed(
  () =>
    products.value.length &&
    selectedProducts.value.length === products.value.length
);

const isSelected = (id) => {
  return selectedProducts.value.includes(id);
};

const fetchProducts = async () => {
  loading.value = true;
  try {
    const response = await api.get("/vendor/products");
    products.value = response.data.products || response.data;
  } catch (error) {
    console.error("Failed to fetch products", error);
    toast.error("Failed to load products");
  } finally {
    loading.value = false;
  }
};

const toggleSelect = (id) => {
  if (selectedProducts.value.includes(id)) {
    selectedProducts.value = selectedProducts.value.filter((p) => p !== id);
  } else {
    selectedProducts.value.push(id);
  }
};

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedProducts.value = [];
  } else {
    selectedProducts.value = products.value.map((p) => p._id);
  }
};

const clearSelection = () => {
  selectedProducts.value = [];
};

const bulkDelete = async () => {
  if (
    !confirm(
      `Are you sure you want to delete ${selectedProducts.value.length} products?`
    )
  )
    return;
  try {
    await api.post("/vendor/products/bulk-delete", {
      productIds: selectedProducts.value,
    });
    products.value = products.value.filter(
      (p) => !selectedProducts.value.includes(p._id)
    );
    toast.success(
      `Successfully deleted ${selectedProducts.value.length} products`
    );
    selectedProducts.value = [];
  } catch (error) {
    console.error("Bulk delete failed:", error);
    toast.error(error.response?.data?.error || "Bulk delete failed");
  }
};

const bulkActivate = async () => {
  try {
    await api.post("/vendor/products/bulk-update", {
      productIds: selectedProducts.value,
      updates: { isActive: true },
    });
    products.value.forEach((p) => {
      if (selectedProducts.value.includes(p._id)) p.isActive = true;
    });
    toast.success(
      `Successfully activated ${selectedProducts.value.length} products`
    );
    selectedProducts.value = [];
  } catch (error) {
    console.error("Bulk activate failed:", error);
    toast.error(error.response?.data?.error || "Bulk activate failed");
  }
};

const bulkDeactivate = async () => {
  try {
    await api.post("/vendor/products/bulk-update", {
      productIds: selectedProducts.value,
      updates: { isActive: false },
    });
    products.value.forEach((p) => {
      if (selectedProducts.value.includes(p._id)) p.isActive = false;
    });
    toast.success(
      `Successfully deactivated ${selectedProducts.value.length} products`
    );
    selectedProducts.value = [];
  } catch (error) {
    console.error("Bulk deactivate failed:", error);
    toast.error(error.response?.data?.error || "Bulk deactivate failed");
  }
};

const exportProducts = async () => {
  try {
    const response = await api.get("/vendor/products/export", {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `products-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    toast.success("Products exported successfully");
  } catch (error) {
    console.error("Export failed:", error);
    toast.error("Failed to export products");
  }
};

const handleUploadSuccess = () => {
  fetchProducts();
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
  }).format(value);
};

const getProductImage = (product) => {
  if (product.images && product.images.length > 0) {
    const img = product.images[0];
    const url = typeof img === "string" ? img : img.url;
    if (url && url.startsWith("/")) {
      return `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${url}`;
    }
    return url;
  }
  return "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3e%3crect width='40' height='40' fill='%23e5e7eb'/%3e%3cpath d='M20 20l-4 4h8l-4-4z' fill='%239ca3af'/%3e%3c/svg%3e";
};

onMounted(() => {
  fetchProducts();
});
</script>
