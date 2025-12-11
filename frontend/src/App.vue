<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Notification Bell (visible when logged in) -->
    <NotificationBell v-if="authStore.isAuthenticated" />

    <!-- Main Router View with Transitions -->
    <RouterView v-slot="{ Component, route }">
      <Transition :name="route.meta.transition || 'fade'" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
  </div>
</template>

<script setup>
import NotificationBell from "@/components/NotificationBell.vue";
import { useAuthStore } from "@/stores/auth";
import { useSocketStore } from "@/stores/socket";
import { onMounted, onUnmounted } from "vue";
import { RouterView } from "vue-router";

const authStore = useAuthStore();
const socketStore = useSocketStore();

onMounted(() => {
  // Initialize auth from localStorage
  authStore.initializeAuth();

  // Connect to Socket.io if authenticated
  if (authStore.isAuthenticated) {
    socketStore.connect();
  }
});

onUnmounted(() => {
  // Disconnect socket on app unmount
  socketStore.disconnect();
});
</script>

<style>
/* Global styles will be loaded from assets/main.css */

/* Professional Page Transitions - Subtle and Fast */

/* Fade Transition (Default) - Minimal, professional */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from {
  opacity: 0;
}

.fade-leave-to {
  opacity: 0;
}

/* Slide Transition - Removed for professional look */
.slide-enter-active,
.slide-leave-active {
  transition: opacity 0.15s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
}

/* Scale Transition - Removed for professional look */
.scale-enter-active,
.scale-leave-active {
  transition: opacity 0.15s ease;
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
}

/* Smooth scroll behavior */
html {
  scroll-behavior: smooth;
}

/* Loading skeleton animation */
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.skeleton {
  animation: shimmer 2s infinite linear;
  background: linear-gradient(to right, #f0f0f0 4%, #e0e0e0 25%, #f0f0f0 36%);
  background-size: 1000px 100%;
}

/* Hover effects for cards */
.hover-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

/* Button press effect */
.btn-press:active {
  transform: scale(0.98);
}

/* Smooth image loading */
img {
  transition: opacity 0.3s ease;
}

img[loading="lazy"] {
  opacity: 0;
}

img[loading="lazy"].loaded {
  opacity: 1;
}
</style>
