<template>
  <CustomerLayout>
    <div class="space-y-6">
      <h1 class="text-3xl font-bold mb-8">My Profile</h1>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div
          class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"
        ></div>
        <p class="mt-4 text-gray-600">Loading profile...</p>
      </div>

      <!-- Profile Content -->
      <div v-else class="space-y-6">
        <!-- Personal Information -->
        <div class="card">
          <h2 class="text-xl font-bold mb-4">Personal Information</h2>

          <form @submit.prevent="updateProfile" class="space-y-4">
            <div>
              <label class="block font-medium mb-2">Full Name *</label>
              <input
                v-model="profileForm.name"
                type="text"
                required
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label class="block font-medium mb-2">Email *</label>
              <input
                v-model="profileForm.email"
                type="email"
                required
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label class="block font-medium mb-2">Phone</label>
              <input
                v-model="profileForm.phone"
                type="tel"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              :disabled="updatingProfile"
              class="btn btn-primary"
            >
              {{ updatingProfile ? "Updating..." : "Update Profile" }}
            </button>
          </form>
        </div>

        <!-- Shipping Address -->
        <div class="card">
          <h2 class="text-xl font-bold mb-4">Shipping Address</h2>

          <form @submit.prevent="updateAddress" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block font-medium mb-2">Full Name</label>
                <input
                  v-model="addressForm.fullName"
                  type="text"
                  class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label class="block font-medium mb-2">Phone</label>
                <input
                  v-model="addressForm.phone"
                  type="tel"
                  class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div class="md:col-span-2">
                <label class="block font-medium mb-2">Address Line 1</label>
                <input
                  v-model="addressForm.addressLine1"
                  type="text"
                  class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div class="md:col-span-2">
                <label class="block font-medium mb-2">Address Line 2</label>
                <input
                  v-model="addressForm.addressLine2"
                  type="text"
                  class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label class="block font-medium mb-2">City</label>
                <input
                  v-model="addressForm.city"
                  type="text"
                  class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label class="block font-medium mb-2">State/Province</label>
                <input
                  v-model="addressForm.state"
                  type="text"
                  class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label class="block font-medium mb-2">Postal Code</label>
                <input
                  v-model="addressForm.postalCode"
                  type="text"
                  class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label class="block font-medium mb-2">Country</label>
                <input
                  v-model="addressForm.country"
                  type="text"
                  class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              :disabled="updatingAddress"
              class="btn btn-primary"
            >
              {{ updatingAddress ? "Updating..." : "Update Address" }}
            </button>
          </form>
        </div>

        <!-- Change Password -->
        <div class="card">
          <h2 class="text-xl font-bold mb-4">Change Password</h2>

          <form @submit.prevent="changePassword" class="space-y-4">
            <div>
              <label class="block font-medium mb-2">Current Password *</label>
              <input
                v-model="passwordForm.currentPassword"
                type="password"
                required
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label class="block font-medium mb-2">New Password *</label>
              <input
                v-model="passwordForm.newPassword"
                type="password"
                required
                minlength="6"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label class="block font-medium mb-2"
                >Confirm New Password *</label
              >
              <input
                v-model="passwordForm.confirmPassword"
                type="password"
                required
                minlength="6"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              :disabled="changingPassword"
              class="btn btn-primary"
            >
              {{ changingPassword ? "Changing..." : "Change Password" }}
            </button>
          </form>
        </div>

        <!-- Account Information -->
        <div class="card">
          <h2 class="text-xl font-bold mb-4">Account Information</h2>

          <div class="space-y-2 text-gray-700">
            <div class="flex justify-between">
              <span class="font-medium">Account Type:</span>
              <span class="capitalize">{{
                authStore.user?.role || "Customer"
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">Member Since:</span>
              <span>{{ formatDate(authStore.user?.createdAt) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">Account Status:</span>
              <span class="badge badge-success">Active</span>
            </div>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="card border-red-200 bg-red-50">
          <h2 class="text-xl font-bold mb-4 text-red-600">Danger Zone</h2>

          <p class="text-gray-700 mb-4">
            Once you delete your account, there is no going back. Please be
            certain.
          </p>

          <button @click="deleteAccount" class="btn btn-error">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  </CustomerLayout>
</template>

<script setup>
import CustomerLayout from "@/components/layouts/CustomerLayout.vue";
import { useAuthStore } from "@/stores/auth";
import { formatDate } from "@/utils/helpers";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

// State
const loading = ref(false);
const updatingProfile = ref(false);
const updatingAddress = ref(false);
const changingPassword = ref(false);

const profileForm = ref({
  name: "",
  email: "",
  phone: "",
});

const addressForm = ref({
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
});

const passwordForm = ref({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

// Load profile data
const loadProfile = async () => {
  loading.value = true;
  try {
    await authStore.fetchProfile();

    // Populate forms with user data
    if (authStore.user) {
      profileForm.value = {
        name: authStore.user.name || "",
        email: authStore.user.email || "",
        phone: authStore.user.phone || "",
      };

      if (authStore.user.shippingAddress) {
        addressForm.value = { ...authStore.user.shippingAddress };
      }
    }
  } catch (err) {
    toast.error("Failed to load profile");
  } finally {
    loading.value = false;
  }
};

// Update profile
const updateProfile = async () => {
  updatingProfile.value = true;
  try {
    await authStore.updateProfile({
      name: profileForm.value.name,
      email: profileForm.value.email,
      phone: profileForm.value.phone,
    });
    toast.success("Profile updated successfully");
  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to update profile");
  } finally {
    updatingProfile.value = false;
  }
};

// Update address
const updateAddress = async () => {
  updatingAddress.value = true;
  try {
    await authStore.updateProfile({
      shippingAddress: addressForm.value,
    });
    toast.success("Address updated successfully");
  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to update address");
  } finally {
    updatingAddress.value = false;
  }
};

// Change password
const changePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    toast.error("Passwords do not match");
    return;
  }

  changingPassword.value = true;
  try {
    await authStore.changePassword(
      passwordForm.value.currentPassword,
      passwordForm.value.newPassword
    );
    toast.success("Password changed successfully");
    passwordForm.value = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    };
  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to change password");
  } finally {
    changingPassword.value = false;
  }
};

// Delete account
const deleteAccount = () => {
  if (
    confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    )
  ) {
    toast.error("Account deletion feature coming soon!");
  }
};

// Initialize
onMounted(() => {
  loadProfile();
});
</script>
