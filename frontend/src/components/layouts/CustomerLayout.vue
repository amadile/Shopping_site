<template>
  <div class="customer-layout">
    <!-- Sidebar - Always visible like Admin/Vendor -->
    <aside
      class="sidebar"
      :class="{
        'sidebar-collapsed': !sidebarOpen,
        'sidebar-open': sidebarOpen,
      }"
    >
      <div class="sidebar-header">
        <router-link to="/" class="sidebar-logo">
          <svg
            class="h-8 w-8 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <span v-if="sidebarOpen" class="logo-text">ShopSite</span>
        </router-link>
        <button @click="toggleSidebar" class="sidebar-toggle-btn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-6 h-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>
      </div>

      <div class="sidebar-body">
        <!-- User Info -->
        <div class="user-info">
          <div class="user-avatar">
            <div v-if="authStore.user?.avatar" class="avatar-img">
              <img :src="authStore.user.avatar" alt="User" />
            </div>
            <div v-else class="avatar-placeholder">
              {{ authStore.user?.name?.charAt(0).toUpperCase() }}
            </div>
          </div>
          <div v-if="sidebarOpen" class="user-details">
            <p class="user-name">{{ authStore.user?.name }}</p>
            <p class="user-email">{{ authStore.user?.email }}</p>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="sidebar-nav">
          <router-link
            v-for="item in menuItems"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ active: isActive(item.path) }"
          >
            <component :is="item.icon" class="nav-icon" />
            <span v-if="sidebarOpen" class="nav-label">{{ item.label }}</span>
            <span v-if="item.badge && sidebarOpen" class="badge">{{
              item.badge
            }}</span>
            <span
              v-else-if="item.badge && !sidebarOpen"
              class="badge-dot"
            ></span>
          </router-link>
        </nav>
      </div>

      <!-- Sidebar Footer -->
      <div class="sidebar-footer">
        <router-link to="/products" class="nav-item">
          <svg
            class="nav-icon"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span v-if="sidebarOpen" class="nav-label">Shop Now</span>
        </router-link>
        <button @click="handleLogout" class="nav-item logout-btn">
          <svg
            class="nav-icon"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span v-if="sidebarOpen" class="nav-label">Logout</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div
      class="main-content"
      :class="{ 'main-content-expanded': !sidebarOpen }"
    >
      <!-- Header -->
      <header class="header">
        <div class="header-left">
          <button @click="toggleSidebar" class="mobile-menu-btn">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
          <h2 class="page-title">{{ pageTitle }}</h2>
        </div>
        <div class="header-right">
          <router-link to="/cart" class="cart-icon">
            <svg
              class="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span v-if="cartStore.itemCount > 0" class="cart-badge">{{
              cartStore.itemCount
            }}</span>
          </router-link>
        </div>
      </header>

      <!-- Page Content -->
      <main class="page-content">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const cartStore = useCartStore();

// Sidebar state - open by default like admin/vendor
const sidebarOpen = ref(true);

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const pageTitle = computed(() => {
  const titles = {
    "/account": "Dashboard",
    "/account/orders": "My Orders",
    "/account/profile": "My Profile",
    "/account/wishlist": "My Wishlist",
    "/account/reviews": "My Reviews",
    "/account/addresses": "My Addresses",
    "/account/notifications": "Notifications",
  };
  return titles[route.path] || "My Account";
});

const menuItems = computed(() => [
  {
    path: "/account",
    label: "Dashboard",
    icon: "DashboardIcon",
  },
  {
    path: "/account/orders",
    label: "My Orders",
    icon: "OrdersIcon",
  },
  {
    path: "/account/profile",
    label: "Profile",
    icon: "ProfileIcon",
  },
  {
    path: "/account/wishlist",
    label: "Wishlist",
    icon: "WishlistIcon",
  },
  {
    path: "/account/reviews",
    label: "My Reviews",
    icon: "ReviewsIcon",
  },
  {
    path: "/account/addresses",
    label: "Addresses",
    icon: "AddressIcon",
  },
  {
    path: "/account/notifications",
    label: "Notifications",
    icon: "NotificationIcon",
  },
]);

const isActive = (path) => {
  return route.path === path || route.path.startsWith(path + "/");
};

const handleLogout = async () => {
  await authStore.logout();
  router.push("/login");
};

// Icon components (inline SVG)
const DashboardIcon = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>`,
};

const OrdersIcon = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>`,
};

const ProfileIcon = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>`,
};

const WishlistIcon = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>`,
};

const ReviewsIcon = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>`,
};

const AddressIcon = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`,
};

const NotificationIcon = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>`,
};
</script>

<style scoped>
/* Customer Layout - Professional Style matching Admin/Vendor */
.customer-layout {
  display: flex;
  min-height: 100vh;
  background: #f9fafb;
}

/* Sidebar Styling */
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: 260px;
  background: white;
  border-right: 1px solid #e5e7eb;
  display: flex !important;
  flex-direction: column;
  transition: width 0.3s ease;
  z-index: 40;
  overflow-y: auto;
  visibility: visible !important;
  opacity: 1 !important;
}

.sidebar-collapsed {
  width: 72px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  min-height: 64px;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: #1f2937;
  font-weight: 700;
  font-size: 1.25rem;
}

.logo-text {
  white-space: nowrap;
  transition: opacity 0.2s;
}

.sidebar-collapsed .logo-text {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

.sidebar-toggle-btn {
  padding: 0.5rem;
  border-radius: 0.375rem;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #6b7280;
  transition: background 0.2s, color 0.2s;
}

.sidebar-toggle-btn:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.sidebar-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

/* User Info */
.user-info {
  padding: 1.5rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  flex-shrink: 0;
}

.avatar-img,
.avatar-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-placeholder {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  font-weight: 700;
  font-size: 1.25rem;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 0.75rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-collapsed .user-details {
  display: none;
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  padding: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  text-decoration: none;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  margin-bottom: 0.25rem;
  border: none;
  background: transparent;
  width: 100%;
  cursor: pointer;
  text-align: left;
}

.nav-item:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.nav-item.active {
  background: #eff6ff;
  color: #2563eb;
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-collapsed .nav-label {
  display: none;
}

.badge {
  background: #ef4444;
  color: white;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-weight: 600;
}

.badge-dot {
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  position: absolute;
  right: 12px;
  top: 12px;
}

/* Sidebar Footer */
.sidebar-footer {
  padding: 0.5rem;
  border-top: 1px solid #e5e7eb;
}

.logout-btn {
  color: #dc2626;
}

.logout-btn:hover {
  background: #fef2f2;
  color: #991b1b;
}

/* Main Content */
.main-content {
  margin-left: 260px;
  flex: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
}

.main-content-expanded {
  margin-left: 72px;
}

/* Header */
.header {
  position: sticky;
  top: 0;
  z-index: 30;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.mobile-menu-btn {
  padding: 0.5rem;
  border-radius: 0.375rem;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #6b7280;
  display: none;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.cart-icon {
  position: relative;
  padding: 0.5rem;
  color: #6b7280;
  transition: color 0.2s;
}

.cart-icon:hover {
  color: #2563eb;
}

.cart-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #ef4444;
  color: white;
  font-size: 0.75rem;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}

/* Page Content */
.page-content {
  flex: 1;
  padding: 2rem;
}

/* Mobile Responsiveness */
@media (max-width: 1024px) {
  .sidebar {
    width: 260px;
    z-index: 50;
  }

  .sidebar:not(.sidebar-open) {
    transform: translateX(-100%);
  }

  .main-content {
    margin-left: 0;
  }

  .mobile-menu-btn {
    display: block;
  }
}
</style>
