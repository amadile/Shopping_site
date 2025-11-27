import socketService from "@/utils/socket";
import { defineStore } from "pinia";
import { ref } from "vue";
import { useToast } from "vue-toastification";

const toast = useToast();

export const useSocketStore = defineStore("socket", () => {
  // State
  const connected = ref(false);
  const socket = ref(null);

  // Actions
  function connect() {
    if (connected.value) return;

    const token = localStorage.getItem("authToken");
    if (!token) return;

    socket.value = socketService.connect(token);
    connected.value = true;

    // Setup listeners
    setupListeners();
  }

  function disconnect() {
    socketService.disconnect();
    connected.value = false;
    socket.value = null;
  }

  function emit(event, data) {
    socketService.emit(event, data);
  }

  function setupListeners() {
    // Connection events
    socketService.on("connect", () => {
      connected.value = true;
      console.log("Socket connected");
    });

    socketService.on("disconnect", () => {
      connected.value = false;
      console.log("Socket disconnected");
    });

    socketService.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      // Only show error toast if user is authenticated and expected to be connected
      const token = localStorage.getItem("authToken");
      if (token && connected.value === false) {
        // Don't spam errors - only show if we were previously trying to connect
        console.warn("Socket.io connection issue - will retry automatically");
      }
    });
  }

  function on(event, callback) {
    socketService.on(event, callback);
  }

  function off(event, callback) {
    socketService.off(event, callback);
  }

  return {
    // State
    connected,
    socket,
    // Actions
    connect,
    disconnect,
    emit,
    on,
    off,
  };
});
