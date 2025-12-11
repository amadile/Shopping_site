<template>
  <VendorLayout>
    <div class="max-w-4xl mx-auto space-y-6">
      <h1 class="text-2xl font-bold">Payment Settings</h1>

      <!-- Success Message -->
      <div
        v-if="saveSuccess"
        class="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg flex items-center"
      >
        <svg
          class="h-6 w-6 text-green-400 mr-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <p class="text-sm font-medium text-green-800">
            Configuration saved successfully!
          </p>
          <p class="text-xs text-green-700 mt-1">
            Your payment settings have been updated and will be shown to
            customers.
          </p>
        </div>
      </div>

      <div class="card">
        <h2 class="text-lg font-semibold mb-4">
          Manual Mobile Money Configuration
        </h2>
        <p class="text-sm text-gray-600 mb-6">
          Configure your MTN and Airtel Mobile Money numbers for receiving
          manual payments from customers. These numbers will be displayed to
          customers when they choose "Manual Mobile Money" at checkout.
        </p>

        <form @submit.prevent="savePaymentConfig" class="space-y-6">
          <!-- MTN Mobile Money -->
          <div class="border rounded-lg p-4 bg-yellow-50">
            <h3 class="font-semibold mb-4 flex items-center">
              <span class="text-yellow-600 mr-2">📱</span>
              MTN Mobile Money
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block font-medium mb-2">MTN Number *</label>
                <input
                  v-model="paymentConfig.mtnNumber"
                  type="tel"
                  placeholder="+256777123456"
                  pattern="^\+256\d{9}$"
                  required
                  class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p class="text-xs text-gray-500 mt-1">Format: +256XXXXXXXXX</p>
              </div>
              <div>
                <label class="block font-medium mb-2">Account Name *</label>
                <input
                  v-model="paymentConfig.mtnAccountName"
                  type="text"
                  placeholder="Your Name or Business Name"
                  required
                  class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p class="text-xs text-gray-500 mt-1">
                  Name registered on MTN account
                </p>
              </div>
            </div>
          </div>

          <!-- Airtel Money -->
          <div class="border rounded-lg p-4 bg-red-50">
            <h3 class="font-semibold mb-4 flex items-center">
              <span class="text-red-600 mr-2">📱</span>
              Airtel Money
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block font-medium mb-2">Airtel Number *</label>
                <input
                  v-model="paymentConfig.airtelNumber"
                  type="tel"
                  placeholder="+256752123456"
                  pattern="^\+256\d{9}$"
                  required
                  class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p class="text-xs text-gray-500 mt-1">Format: +256XXXXXXXXX</p>
              </div>
              <div>
                <label class="block font-medium mb-2">Account Name *</label>
                <input
                  v-model="paymentConfig.airtelAccountName"
                  type="text"
                  placeholder="Your Name or Business Name"
                  required
                  class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p class="text-xs text-gray-500 mt-1">
                  Name registered on Airtel account
                </p>
              </div>
            </div>
          </div>

          <!-- Info Box -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 class="font-semibold text-blue-900 mb-2">ℹ️ How It Works</h4>
            <ul class="text-sm text-blue-800 space-y-1">
              <li>
                • Customers will see these numbers when they choose "Manual
                Mobile Money"
              </li>
              <li>
                • They send money to your number and submit the Transaction ID
              </li>
              <li>• You verify the payment in your mobile money app</li>
              <li>
                • Confirm the payment in the admin panel to complete the order
              </li>
            </ul>
          </div>

          <!-- Save Button -->
          <div class="flex gap-4">
            <button type="submit" :disabled="saving" class="btn btn-primary">
              {{ saving ? "Saving..." : "💾 Save Payment Configuration" }}
            </button>
            <button
              type="button"
              @click="loadCurrentConfig"
              class="btn btn-secondary"
            >
              🔄 Reset
            </button>
          </div>
        </form>
      </div>

      <!-- Preview Section -->
      <div class="card bg-gray-50">
        <h2 class="text-lg font-semibold mb-4">
          Preview - What Customers Will See
        </h2>
        <div class="bg-white rounded-lg border-2 border-blue-300 p-4">
          <p class="text-sm text-gray-600 mb-3">Send payment to:</p>
          <div class="space-y-3">
            <div>
              <p class="text-xs text-gray-600 mb-1">MTN Mobile Money</p>
              <p class="text-xl font-bold text-yellow-600">
                {{ paymentConfig.mtnNumber || "+256777123456" }}
              </p>
              <p class="text-xs text-gray-500">
                Name: {{ paymentConfig.mtnAccountName || "Your Business" }}
              </p>
            </div>
            <div class="border-t pt-3">
              <p class="text-xs text-gray-600 mb-1">Airtel Money</p>
              <p class="text-xl font-bold text-red-600">
                {{ paymentConfig.airtelNumber || "+256752123456" }}
              </p>
              <p class="text-xs text-gray-500">
                Name: {{ paymentConfig.airtelAccountName || "Your Business" }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </VendorLayout>
</template>

<script setup>
import VendorLayout from "@/components/layouts/VendorLayout.vue";
import api from "@/utils/api";
import { onMounted, ref } from "vue";
import { useToast } from "vue-toastification";

const toast = useToast();

const paymentConfig = ref({
  mtnNumber: "",
  mtnAccountName: "",
  airtelNumber: "",
  airtelAccountName: "",
});

const saving = ref(false);
const saveSuccess = ref(false);

const loadCurrentConfig = async () => {
  try {
    const response = await api.get("/vendor/payment-config/current");
    const config = response.data.mobileMoneyNumbers || {};

    paymentConfig.value = {
      mtnNumber: config.mtn || "",
      mtnAccountName: config.mtnAccountName || response.data.businessName || "",
      airtelNumber: config.airtel || "",
      airtelAccountName:
        config.airtelAccountName || response.data.businessName || "",
    };
  } catch (err) {
    console.error("Failed to load payment config:", err);
    toast.error("Failed to load current configuration");
  }
};

const savePaymentConfig = async () => {
  // Validate phone numbers
  const phoneRegex = /^\+256\d{9}$/;
  if (!phoneRegex.test(paymentConfig.value.mtnNumber)) {
    toast.error("Invalid MTN number format. Use +256XXXXXXXXX");
    return;
  }
  if (!phoneRegex.test(paymentConfig.value.airtelNumber)) {
    toast.error("Invalid Airtel number format. Use +256XXXXXXXXX");
    return;
  }

  saving.value = true;
  saveSuccess.value = false;
  try {
    await api.put("/vendor/payment-config/update", paymentConfig.value);
    toast.success("Payment configuration saved successfully!");
    saveSuccess.value = true;
    setTimeout(() => {
      saveSuccess.value = false;
    }, 5000);
  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to save configuration");
    console.error(err);
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadCurrentConfig();
});
</script>
