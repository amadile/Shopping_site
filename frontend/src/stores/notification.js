import api from "@/utils/api";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useToast } from "vue-toastification";
import { useSocketStore } from "./socket";

const toast = useToast();

export const useNotificationStore = defineStore("notification", () => {
  // State
  const notifications = ref([]);
  const unreadCount = ref(0);
  const loading = ref(false);

  // Getters
  const unreadNotifications = computed(() =>
    notifications.value.filter((n) => !n.read)
  );

  const readNotifications = computed(() =>
    notifications.value.filter((n) => n.read)
  );

  // Actions
  async function fetchNotifications() {
    loading.value = true;
    try {
      const response = await api.get("/notifications");
      notifications.value = response.data.notifications || [];
      unreadCount.value = response.data.unreadCount || 0;
      return response.data;
    } catch (error) {
      console.error("Fetch notifications error:", error);
    } finally {
      loading.value = false;
    }
  }

  async function markAsRead(notificationId) {
    try {
      await api.put(`/notifications/${notificationId}/read`);

      // Update local state
      const notification = notifications.value.find(
        (n) => n._id === notificationId
      );
      if (notification && !notification.read) {
        notification.read = true;
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
    } catch (error) {
      console.error("Mark as read error:", error);
    }
  }

  async function markAllAsRead() {
    try {
      await api.put("/notifications/mark-all-read");

      // Update local state
      notifications.value.forEach((n) => {
        n.read = true;
      });
      unreadCount.value = 0;

      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Mark all as read error:", error);
    }
  }

  async function deleteNotification(notificationId) {
    try {
      await api.delete(`/notifications/${notificationId}`);

      // Update local state
      const index = notifications.value.findIndex(
        (n) => n._id === notificationId
      );
      if (index !== -1) {
        const notification = notifications.value[index];
        if (!notification.read) {
          unreadCount.value = Math.max(0, unreadCount.value - 1);
        }
        notifications.value.splice(index, 1);
      }

      toast.info("Notification deleted");
    } catch (error) {
      console.error("Delete notification error:", error);
    }
  }

  function addNotification(notification) {
    // Add to beginning of array
    notifications.value.unshift(notification);

    if (!notification.read) {
      unreadCount.value++;
    }

    // Show toast based on priority
    const message = notification.title || notification.message;

    if (notification.priority === "high") {
      toast.error(message, { timeout: 5000 });
    } else if (notification.priority === "medium") {
      toast.warning(message, { timeout: 4000 });
    } else {
      toast.info(message, { timeout: 3000 });
    }
  }

  function setupSocketListeners() {
    const socketStore = useSocketStore();

    socketStore.on("notification", (notification) => {
      addNotification(notification);
    });

    socketStore.on("notification:order", (notification) => {
      addNotification({ ...notification, type: "order" });
    });

    socketStore.on("notification:stock", (notification) => {
      addNotification({ ...notification, type: "stock" });
    });

    socketStore.on("notification:promotion", (notification) => {
      addNotification({ ...notification, type: "promotion" });
    });
  }

  return {
    // State
    notifications,
    unreadCount,
    loading,
    // Getters
    unreadNotifications,
    readNotifications,
    // Actions
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
    setupSocketListeners,
  };
});
