<template>
  <AdminLayout>
    <div>
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Manage Vendors</h1>
      </div>

      <!-- Filters and Search -->
      <div class="bg-white p-4 rounded-lg shadow mb-6">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex-1">
            <input
              v-model="searchQuery"
              @input="debounceSearch"
              type="text"
              placeholder="Search by business name or email..."
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div class="w-full md:w-48">
            <select
              v-model="filterStatus"
              @change="loadVendors"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"
        ></div>
      </div>

      <!-- Vendors Table -->
      <div v-else class="bg-white shadow-md rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Business
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Contact
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Commission
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
                v-for="vendor in vendors"
                :key="vendor._id"
                class="hover:bg-gray-50"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">
                    {{ vendor.businessName }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ vendor.businessEmail }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    {{ vendor.ownerName }}
                  </div>
                  <div class="text-sm text-gray-500">{{ vendor.phone }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                    :class="{
                      'bg-yellow-100 text-yellow-800':
                        vendor.status === 'pending',
                      'bg-green-100 text-green-800':
                        vendor.status === 'approved',
                      'bg-red-100 text-red-800': vendor.status === 'rejected',
                      'bg-gray-100 text-gray-800': !vendor.status,
                    }"
                  >
                    {{
                      vendor.status
                        ? vendor.status.charAt(0).toUpperCase() +
                          vendor.status.slice(1)
                        : "Unknown"
                    }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ vendor.commissionRate || 0 }}%
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                >
                  <button
                    @click="openDetailsModal(vendor)"
                    class="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Details
                  </button>
                  <button
                    v-if="vendor.status === 'pending'"
                    @click="approveVendor(vendor._id)"
                    class="text-green-600 hover:text-green-900 mr-4"
                  >
                    Approve
                  </button>
                  <button
                    v-if="vendor.status === 'pending'"
                    @click="rejectVendor(vendor._id)"
                    class="text-red-600 hover:text-red-900"
                  >
                    Reject
                  </button>
                </td>
              </tr>
              <tr v-if="vendors.length === 0">
                <td colspan="5" class="px-6 py-10 text-center text-gray-500">
                  No vendors found matching your criteria.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

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

      <!-- Vendor Details Modal -->
      <div
        v-if="showDetailsModal"
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
            @click="closeDetailsModal"
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
              <h3
                class="text-lg leading-6 font-medium text-gray-900"
                id="modal-title"
              >
                Vendor Details: {{ selectedVendor?.businessName }}
              </h3>
              <div class="mt-4 space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-500"
                      >Owner Name</label
                    >
                    <p class="mt-1 text-sm text-gray-900">
                      {{ selectedVendor?.ownerName }}
                    </p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-500"
                      >Phone</label
                    >
                    <p class="mt-1 text-sm text-gray-900">
                      {{ selectedVendor?.phone }}
                    </p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-500"
                      >Email</label
                    >
                    <p class="mt-1 text-sm text-gray-900">
                      {{ selectedVendor?.businessEmail }}
                    </p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-500"
                      >Status</label
                    >
                    <p
                      class="mt-1 text-sm font-semibold"
                      :class="{
                        'text-yellow-600': selectedVendor?.status === 'pending',
                        'text-green-600': selectedVendor?.status === 'approved',
                        'text-red-600': selectedVendor?.status === 'rejected',
                      }"
                    >
                      {{
                        selectedVendor?.status
                          ? selectedVendor.status.toUpperCase()
                          : "UNKNOWN"
                      }}
                    </p>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-500"
                    >Address</label
                  >
                  <p class="mt-1 text-sm text-gray-900">
                    {{ selectedVendor?.address?.street }}<br />
                    {{ selectedVendor?.address?.city }},
                    {{ selectedVendor?.address?.district }}
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-500"
                    >Description</label
                  >
                  <p class="mt-1 text-sm text-gray-900">
                    {{
                      selectedVendor?.description || "No description provided."
                    }}
                  </p>
                </div>

                <div class="border-t pt-4">
                  <label class="block text-sm font-medium text-gray-700"
                    >Commission Rate (%)</label
                  >
                  <div class="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="number"
                      v-model="newCommissionRate"
                      class="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <button
                      @click="updateCommission"
                      class="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm hover:bg-gray-100"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div
              class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse"
            >
              <button
                @click="closeDetailsModal"
                type="button"
                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Close
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
const vendors = ref([]);
const loading = ref(false);
const searchQuery = ref("");
const filterStatus = ref("");
const currentPage = ref(1);
const totalPages = ref(1);

// Details Modal
const showDetailsModal = ref(false);
const selectedVendor = ref(null);
const newCommissionRate = ref(0);

// Debounce search
let searchTimeout = null;
const debounceSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    loadVendors();
  }, 500);
};

// Load vendors
const loadVendors = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      limit: 10,
    };
    if (filterStatus.value) params.status = filterStatus.value;
    if (searchQuery.value) params.search = searchQuery.value;

    const response = await api.get("/admin/vendors", { params });
    vendors.value = response.data.vendors;
    totalPages.value = response.data.totalPages;
    currentPage.value = response.data.currentPage;
  } catch (error) {
    console.error("Error loading vendors:", error);
    toast.error("Failed to load vendors");
  } finally {
    loading.value = false;
  }
};

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    loadVendors();
  }
};

// Vendor Actions
const approveVendor = async (id) => {
  try {
    await api.put(`/admin/vendors/${id}/approve`);
    toast.success("Vendor approved successfully");
    loadVendors();
  } catch (error) {
    console.error("Error approving vendor:", error);
    toast.error("Failed to approve vendor");
  }
};

const rejectVendor = async (id) => {
  if (!confirm("Are you sure you want to reject this vendor?")) return;

  try {
    await api.put(`/admin/vendors/${id}/reject`, { reason: "Admin rejected" });
    toast.success("Vendor rejected successfully");
    loadVendors();
  } catch (error) {
    console.error("Error rejecting vendor:", error);
    toast.error("Failed to reject vendor");
  }
};

// Details Modal
const openDetailsModal = (vendor) => {
  selectedVendor.value = vendor;
  newCommissionRate.value = vendor.commissionRate;
  showDetailsModal.value = true;
};

const closeDetailsModal = () => {
  showDetailsModal.value = false;
  selectedVendor.value = null;
};

const updateCommission = async () => {
  if (!selectedVendor.value) return;

  try {
    await api.put(`/admin/commissions/vendor/${selectedVendor.value._id}`, {
      commissionRate: newCommissionRate.value,
    });

    // Update local state
    selectedVendor.value.commissionRate = newCommissionRate.value;
    const index = vendors.value.findIndex(
      (v) => v._id === selectedVendor.value._id
    );
    if (index !== -1) {
      vendors.value[index].commissionRate = newCommissionRate.value;
    }

    toast.success("Commission rate updated");
  } catch (error) {
    console.error("Error updating commission:", error);
    toast.error("Failed to update commission rate");
  }
};

onMounted(() => {
  loadVendors();
});
</script>
