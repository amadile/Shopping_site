<template>
  <CustomerLayout>
    <div class="space-y-6">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold">Notifications</h1>

        <div class="flex gap-2">
          <button
            v-if="notificationStore.unreadCount > 0"
            @click="markAllAsRead"
            class="btn btn-secondary btn-sm"
          >
            Mark All as Read
          </button>

          <button @click="fetchNotifications" class="btn btn-secondary btn-sm">
            Refresh
          </button>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="flex gap-2 mb-6 border-b">
        <button
          @click="filter = 'all'"
          class="px-4 py-2 font-medium border-b-2 transition-colors"
          :class="
            filter === 'all'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          "
        >
          All ({{ notifications.length }})
        </button>
        <button
          @click="filter = 'unread'"
          class="px-4 py-2 font-medium border-b-2 transition-colors"
          :class="
            filter === 'unread'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          "
        >
          Unread ({{ notificationStore.unreadCount }})
        </button>
        <button
          @click="filter = 'read'"
          class="px-4 py-2 font-medium border-b-2 transition-colors"
          :class="
            filter === 'read'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          "
        >
          Read
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div
          class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"
        ></div>
        <p class="mt-4 text-gray-600">Loading notifications...</p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="filteredNotifications.length === 0"
        class="text-center py-12"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-24 h-24 mx-auto text-gray-400 mb-4"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
        <h2 class="text-2xl font-semibold mb-4">No notifications</h2>
        <p class="text-gray-600">You're all caught up!</p>
      </div>

      <!-- Notifications List -->
      <div v-else class="space-y-3">
        <div
          v-for="notification in filteredNotifications"
          :key="notification._id"
          class="card transition-all hover:shadow-md"
          :class="{ 'bg-blue-50 border-blue-200': !notification.read }"
        >
          <div class="flex gap-4">
            <!-- Icon -->
            <div
              class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
              :class="getNotificationIconClass(notification.type)"
            >
              <component
                :is="getNotificationIcon(notification.type)"
                class="w-6 h-6"
              />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-4 mb-2">
                <h3 class="font-semibold text-lg">{{ notification.title }}</h3>
                <span class="text-gray-500 text-sm whitespace-nowrap">
                  {{ formatRelativeTime(notification.createdAt) }}
                </span>
              </div>

              <p class="text-gray-700 mb-3">{{ notification.message }}</p>

              <!-- Actions -->
              <div class="flex items-center gap-3">
                <button
                  v-if="notification.actionUrl"
                  @click="handleAction(notification)"
                  class="text-primary hover:underline text-sm font-medium"
                >
                  View Details →
                </button>

                <button
                  v-if="!notification.read"
                  @click="markAsRead(notification._id)"
                  class="text-gray-600 hover:text-gray-900 text-sm"
                >
                  Mark as Read
                </button>

                <button
                  @click="deleteNotification(notification._id)"
                  class="text-red-600 hover:text-red-800 text-sm ml-auto"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </CustomerLayout>
</template>

<script setup>
import CustomerLayout from "@/components/layouts/CustomerLayout.vue";
import { useNotificationStore } from "@/stores/notification";
import { formatRelativeTime } from "@/utils/helpers";
import { computed, h, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";

const router = useRouter();
const notificationStore = useNotificationStore();
const toast = useToast();

// State
const loading = ref(false);
const filter = ref("all");

// Computed
const notifications = computed(() => notificationStore.notifications);

const filteredNotifications = computed(() => {
  if (filter.value === "unread") {
    return notificationStore.unreadNotifications;
  } else if (filter.value === "read") {
    return notificationStore.readNotifications;
  }
  return notifications.value;
});

// Fetch notifications
const fetchNotifications = async () => {
  loading.value = true;
  try {
    await notificationStore.fetchNotifications();
  } catch (err) {
    toast.error("Failed to load notifications");
  } finally {
    loading.value = false;
  }
};

// Mark as read
const markAsRead = async (id) => {
  try {
    await notificationStore.markAsRead(id);
    toast.success("Notification marked as read");
  } catch (err) {
    toast.error("Failed to mark notification as read");
  }
};

// Mark all as read
const markAllAsRead = async () => {
  try {
    await notificationStore.markAllAsRead();
    toast.success("All notifications marked as read");
  } catch (err) {
    toast.error("Failed to mark all notifications as read");
  }
};

// Delete notification
const deleteNotification = async (id) => {
  if (!confirm("Delete this notification?")) return;

  try {
    await notificationStore.deleteNotification(id);
    toast.success("Notification deleted");
  } catch (err) {
    toast.error("Failed to delete notification");
  }
};

// Handle notification action
const handleAction = async (notification) => {
  if (!notification.read) {
    await markAsRead(notification._id);
  }

  if (notification.actionUrl) {
    router.push(notification.actionUrl);
  }
};

// Get notification icon
const getNotificationIcon = (type) => {
  const icons = {
    order: h(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        "stroke-width": "1.5",
        stroke: "currentColor",
      },
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
      })
    ),
    stock: h(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        "stroke-width": "1.5",
        stroke: "currentColor",
      },
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z",
      })
    ),
    promotion: h(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        "stroke-width": "1.5",
        stroke: "currentColor",
      },
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z",
      })
    ),
    admin: h(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        "stroke-width": "1.5",
        stroke: "currentColor",
      },
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0",
      })
    ),
  };

  return icons[type] || icons.admin;
};

// Get notification icon class
const getNotificationIconClass = (type) => {
  const classes = {
    order: "bg-blue-100 text-blue-600",
    stock: "bg-orange-100 text-orange-600",
    promotion: "bg-green-100 text-green-600",
    admin: "bg-purple-100 text-purple-600",
  };

  return classes[type] || classes.admin;
};

// Initialize
onMounted(() => {
  fetchNotifications();
});
</script>
