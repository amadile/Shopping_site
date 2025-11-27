<template>
  <CustomerLayout>
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Delivery Addresses</h1>
          <p class="text-gray-600 mt-1">Manage your saved delivery locations</p>
        </div>
        <button @click="showAddForm = true" class="btn btn-primary">
          + Add New Address
        </button>
      </div>

      <!-- Add Address Form -->
      <div v-if="showAddForm" class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Add New Address</h2>
        <form @submit.prevent="saveAddress" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input v-model="newAddress.fullName" type="text" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input v-model="newAddress.phone" type="tel" required placeholder="+256..." class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">District *</label>
              <input v-model="newAddress.district" type="text" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Zone / Area</label>
              <input v-model="newAddress.zone" type="text" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
            <input v-model="newAddress.landmark" type="text" placeholder="e.g., Near Nakawa Market" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Address Line</label>
            <textarea v-model="newAddress.addressLine" rows="2" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
          </div>
          <div class="flex items-center">
            <input v-model="newAddress.isDefault" type="checkbox" id="default" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
            <label for="default" class="ml-2 block text-sm text-gray-900">
              Set as default address
            </label>
          </div>
          <div class="flex space-x-3">
            <button type="submit" class="btn btn-primary">Save Address</button>
            <button type="button" @click="cancelAdd" class="btn btn-outline">Cancel</button>
          </div>
        </form>
      </div>

      <!-- Addresses List -->
      <div v-if="addresses.length === 0 && !showAddForm" class="bg-white rounded-lg shadow-sm p-12 text-center">
        <svg class="mx-auto h-16 w-16 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        </svg>
        <h3 class="text-lg font-semibold text-gray-900 mt-4">No saved addresses</h3>
        <p class="text-gray-500 mt-2">Add a delivery address for faster checkout</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-for="address in addresses" :key="address.id" class="bg-white rounded-lg shadow-sm p-6 relative">
          <div v-if="address.isDefault" class="absolute top-4 right-4">
            <span class="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Default</span>
          </div>
          <h3 class="font-semibold text-gray-900 text-lg">{{ address.fullName }}</h3>
          <p class="text-gray-600 mt-2">{{ address.phone }}</p>
          <p class="text-gray-600 mt-1">{{ address.addressLine }}</p>
          <p class="text-gray-600">{{ address.district }}, {{ address.zone }}</p>
          <p v-if="address.landmark" class="text-gray-500 text-sm mt-1">Landmark: {{ address.landmark }}</p>
          
          <div class="flex space-x-3 mt-4 pt-4 border-t border-gray-200">
            <button @click="editAddress(address)" class="text-blue-600 hover:text-blue-700 font-medium text-sm">
              Edit
            </button>
            <button v-if="!address.isDefault" @click="setDefault(address.id)" class="text-green-600 hover:text-green-700 font-medium text-sm">
              Set as Default
            </button>
            <button @click="deleteAddress(address.id)" class="text-red-600 hover:text-red-700 font-medium text-sm ml-auto">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </CustomerLayout>
</template>

<script setup>
import CustomerLayout from '@/components/layouts/CustomerLayout.vue';
import { ref } from 'vue';
import { useToast } from 'vue-toastification';

const toast = useToast();

const showAddForm = ref(false);
const newAddress = ref({
  fullName: '',
  phone: '',
  district: '',
  zone: '',
  landmark: '',
  addressLine: '',
  isDefault: false,
});

// TODO: Replace with actual API call
const addresses = ref([
  // Example data - replace with API
]);

const saveAddress = () => {
  // TODO: Implement save address API
  addresses.value.push({
    id: Date.now(),
    ...newAddress.value,
  });
  toast.success('Address saved successfully');
  cancelAdd();
};

const cancelAdd = () => {
  showAddForm.value = false;
  newAddress.value = {
    fullName: '',
    phone: '',
    district: '',
    zone: '',
    landmark: '',
    addressLine: '',
    isDefault: false,
  };
};

const editAddress = (address) => {
  // TODO: Implement edit
  toast.info('Edit functionality coming soon');
};

const setDefault = (id) => {
  addresses.value = addresses.value.map(addr => ({
    ...addr,
    isDefault: addr.id === id
  }));
  toast.success('Default address updated');
};

const deleteAddress = (id) => {
  if (confirm('Are you sure you want to delete this address?')) {
    addresses.value = addresses.value.filter(addr => addr.id !== id);
    toast.success('Address deleted');
  }
};
</script>
