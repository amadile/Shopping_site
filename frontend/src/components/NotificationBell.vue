<template>
  <div class="fixed top-4 right-4 z-50">
    <!-- Notification Bell Button -->
    <button
      @click="toggleDropdown"
      class="relative p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <!-- Bell Icon -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6 text-gray-700"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      <!-- Unread Badge -->
      <span
        v-if="notificationStore.unreadCount > 0"
        class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
      >
        {{
          notificationStore.unreadCount > 9
            ? "9+"
            : notificationStore.unreadCount
        }}
      </span>
    </button>

    <!-- Notifications Dropdown -->
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl overflow-hidden"
        style="max-height: 600px"
      >
        <!-- Header -->
        <div
          class="bg-blue-600 text-white px-4 py-3 flex items-center justify-between"
        >
          <h3 class="font-semibold text-lg">Notifications</h3>
          <button
            v-if="notificationStore.unreadCount > 0"
            @click="markAllAsRead"
            class="text-sm text-blue-100 hover:text-white transition-colors"
          >
            Mark all as read
          </button>
        </div>

        <!-- Notifications List -->
        <div class="overflow-y-auto" style="max-height: 500px">
          <!-- Loading -->
          <div v-if="notificationStore.loading" class="p-8 text-center">
            <div class="spinner mx-auto"></div>
            <p class="text-gray-500 mt-2">Loading notifications...</p>
          </div>

          <!-- Empty State -->
          <div
            v-else-if="notificationStore.notifications.length === 0"
            class="p-8 text-center text-gray-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-16 w-16 mx-auto text-gray-300 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p>No notifications yet</p>
          </div>

          <!-- Notification Items -->
          <div v-else>
            <div
              v-for="notification in notificationStore.notifications"
              :key="notification._id"
              @click="handleNotificationClick(notification)"
              class="border-b border-gray-100 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              :class="{ 'bg-blue-50': !notification.read }"
            >
              <div class="flex items-start gap-3">
                <!-- Icon -->
                <div
                  class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                  :class="getNotificationIconBg(notification.type)"
                >
                  <component
                    :is="getNotificationIcon(notification.type)"
                    class="w-5 h-5"
                  />
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900">
                    {{ notification.title }}
                  </p>
                  <p class="text-sm text-gray-600 mt-1">
                    {{ notification.message }}
                  </p>
                  <p class="text-xs text-gray-400 mt-1">
                    {{ formatRelativeTime(notification.createdAt) }}
                  </p>
                </div>

                <!-- Delete Button -->
                <button
                  @click.stop="deleteNotification(notification._id)"
                  class="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 px-4 py-3 text-center border-t border-gray-200">
          <router-link
            to="/notifications"
            class="text-sm text-blue-600 hover:text-blue-700 font-medium"
            @click="isOpen = false"
          >
            View all notifications
          </router-link>
        </div>
      </div>
    </transition>

    <!-- Backdrop -->
    <div
      v-if="isOpen"
      @click="isOpen = false"
      class="fixed inset-0 z-40"
      style="background: transparent"
    ></div>
  </div>
</template>

<script setup>
import { useNotificationStore } from "@/stores/notification";
import { formatRelativeTime } from "@/utils/helpers";
import { h, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const notificationStore = useNotificationStore();
const isOpen = ref(false);

onMounted(() => {
  // Fetch notifications
  notificationStore.fetchNotifications();

  // Setup socket listeners for real-time notifications
  notificationStore.setupSocketListeners();
});

function toggleDropdown() {
  isOpen.value = !isOpen.value;
}

function handleNotificationClick(notification) {
  // Mark as read
  if (!notification.read) {
    notificationStore.markAsRead(notification._id);
  }

  // Navigate if actionUrl exists
  if (notification.actionUrl) {
    router.push(notification.actionUrl);
    isOpen.value = false;
  }
}

function markAllAsRead() {
  notificationStore.markAllAsRead();
}

function deleteNotification(id) {
  notificationStore.deleteNotification(id);
}

function getNotificationIcon(type) {
  const icons = {
    order: () =>
      h(
        "svg",
        {
          xmlns: "http://www.w3.org/2000/svg",
          fill: "none",
          viewBox: "0 0 24 24",
          stroke: "currentColor",
          class: "w-5 h-5",
        },
        [
          h("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
          }),
        ]
      ),
    stock: () =>
      h(
        "svg",
        {
          xmlns: "http://www.w3.org/2000/svg",
          fill: "none",
          viewBox: "0 0 24 24",
          stroke: "currentColor",
          class: "w-5 h-5",
        },
        [
          h("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
          }),
        ]
      ),
    promotion: () =>
      h(
        "svg",
        {
          xmlns: "http://www.w3.org/2000/svg",
          fill: "none",
          viewBox: "0 0 24 24",
          stroke: "currentColor",
          class: "w-5 h-5",
        },
        [
          h("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
          }),
        ]
      ),
    admin: () =>
      h(
        "svg",
        {
          xmlns: "http://www.w3.org/2000/svg",
          fill: "none",
          viewBox: "0 0 24 24",
          stroke: "currentColor",
          class: "w-5 h-5",
        },
        [
          h("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
          }),
        ]
      ),
  };

  return icons[type] || icons.admin;
}

function getNotificationIconBg(type) {
  const colors = {
    order: "bg-green-100 text-green-600",
    stock: "bg-yellow-100 text-yellow-600",
    promotion: "bg-purple-100 text-purple-600",
    admin: "bg-blue-100 text-blue-600",
  };

  return colors[type] || colors.admin;
}
</script>
