<template>
  <div class="mobile-money-payment">
    <div class="mb-4">
      <h3 class="text-lg font-medium text-gray-900">Mobile Money Payment</h3>
      <p class="text-sm text-gray-500">Pay securely with MTN Mobile Money or Airtel Money.</p>
    </div>

    <div class="space-y-4">
      <!-- Provider Selection -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Select Provider</label>
        <div class="grid grid-cols-2 gap-4">
          <button
            type="button"
            @click="selectProvider('mtn')"
            :class="[
              'flex items-center justify-center px-4 py-3 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2',
              provider === 'mtn'
                ? 'border-yellow-500 ring-yellow-500 bg-yellow-50 text-yellow-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            ]"
          >
            <span class="mr-2">💛</span> MTN MoMo
          </button>
          <button
            type="button"
            @click="selectProvider('airtel')"
            :class="[
              'flex items-center justify-center px-4 py-3 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2',
              provider === 'airtel'
                ? 'border-red-500 ring-red-500 bg-red-50 text-red-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            ]"
          >
            <span class="mr-2">❤️</span> Airtel Money
          </button>
        </div>
      </div>

      <!-- Phone Number Input -->
      <div>
        <label for="phone-number" class="block text-sm font-medium text-gray-700">Phone Number</label>
        <div class="mt-1 relative rounded-md shadow-sm">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span class="text-gray-500 sm:text-sm">+256</span>
          </div>
          <input
            type="tel"
            name="phone-number"
            id="phone-number"
            v-model="phoneNumber"
            @input="validatePhoneNumber"
            class="focus:ring-blue-500 focus:border-blue-500 block w-full pl-16 sm:text-sm border-gray-300 rounded-md"
            placeholder="770 123456"
          />
        </div>
        <p v-if="error" class="mt-2 text-sm text-red-600">{{ error }}</p>
      </div>

      <!-- Instructions -->
      <div class="bg-gray-50 p-4 rounded-md">
        <h4 class="text-sm font-medium text-gray-900 mb-2">How it works:</h4>
        <ol class="list-decimal list-inside text-sm text-gray-600 space-y-1">
          <li>Enter your mobile money number above.</li>
          <li>Click "Place Order" below.</li>
          <li>You will receive a prompt on your phone.</li>
          <li>Enter your PIN to confirm the payment.</li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ provider: '', phoneNumber: '' })
  }
});

const emit = defineEmits(['update:modelValue', 'valid']);

const provider = ref(props.modelValue.provider || 'mtn');
const phoneNumber = ref(props.modelValue.phoneNumber || '');
const error = ref('');

const selectProvider = (p) => {
  provider.value = p;
  validatePhoneNumber();
};

const validatePhoneNumber = () => {
  // Remove spaces and non-numeric chars
  const cleanNumber = phoneNumber.value.replace(/\D/g, '');
  
  // Basic Uganda phone validation (9 digits without country code, or 12 with 256)
  // We'll assume user enters local format (e.g., 772...) or 0772...
  
  let valid = false;
  error.value = '';

  if (cleanNumber.length < 9) {
    // Too short
    valid = false;
  } else {
    // Check prefixes based on provider
    const localNumber = cleanNumber.slice(-9); // Last 9 digits
    const prefix = localNumber.substring(0, 2); // e.g., 77, 78, 70, 75

    if (provider.value === 'mtn') {
      if (['77', '78', '76'].includes(prefix)) {
        valid = true;
      } else {
        error.value = 'Invalid MTN number prefix. Should start with 77, 78, or 76.';
        valid = false;
      }
    } else if (provider.value === 'airtel') {
      if (['70', '75', '74'].includes(prefix)) {
        valid = true;
      } else {
        error.value = 'Invalid Airtel number prefix. Should start with 70, 75, or 74.';
        valid = false;
      }
    }
  }

  emit('update:modelValue', {
    provider: provider.value,
    phoneNumber: cleanNumber
  });
  
  emit('valid', valid);
};

// Initial validation
validatePhoneNumber();

watch(() => props.modelValue, (newVal) => {
  if (newVal.provider !== provider.value) provider.value = newVal.provider;
  if (newVal.phoneNumber !== phoneNumber.value) phoneNumber.value = newVal.phoneNumber;
}, { deep: true });

</script>

<style scoped>
/* Add any specific styles here if needed */
</style>
