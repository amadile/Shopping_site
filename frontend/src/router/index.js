import { useAuthStore } from "@/stores/auth";
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("@/views/Home.vue"),
      meta: { layout: "default" },
    },
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/auth/Login.vue"),
      meta: { guest: true },
    },
    {
      path: "/register",
      name: "register",
      component: () => import("@/views/auth/Register.vue"),
      meta: { guest: true },
    },
    {
      path: "/forgot-password",
      name: "forgot-password",
      component: () => import("@/views/auth/ForgotPassword.vue"),
      meta: { guest: true },
    },
    {
      path: "/reset-password/:token",
      name: "reset-password",
      component: () => import("@/views/auth/ResetPassword.vue"),
      meta: { guest: true },
    },
    {
      path: "/admin/register",
      name: "admin-register",
      component: () => import("@/views/auth/AdminRegister.vue"),
      meta: { guest: true },
    },
    {
      path: "/products",
      name: "products",
      component: () => import("@/views/products/ProductList.vue"),
    },
    {
      path: "/products/:id",
      name: "product-details",
      component: () => import("@/views/products/ProductDetails.vue"),
    },
    {
      path: "/vendor/:vendorId",
      name: "vendor-shop",
      component: () => import("@/views/VendorShop.vue"),
    },
    {
      path: "/cart",
      name: "cart",
      component: () => import("@/views/cart/Cart.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/checkout",
      name: "checkout",
      component: () => import("@/views/cart/Checkout.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/checkout/mobile-money",
      name: "mobile-money",
      component: () => import("@/views/cart/MobileMoney.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/orders/:id/payment-status",
      name: "payment-status",
      component: () => import("@/views/cart/PaymentStatus.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/cart/manual-momo/:id",
      name: "manual-momo-payment",
      component: () => import("@/views/cart/ManualMobileMoney.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/checkout/delivery-zone",
      name: "delivery-zone",
      component: () => import("@/views/cart/DeliveryZone.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/track-order",
      name: "track-order",
      component: () => import("@/views/orders/OrderTracking.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/orders",
      name: "orders",
      component: () => import("@/views/orders/OrderList.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/orders/:id",
      name: "order-details",
      component: () => import("@/views/orders/OrderDetails.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/orders/:id/pay",
      name: "order-pay",
      component: () => import("@/views/orders/OrderPay.vue"),
      meta: { requiresAuth: true },
    },
    // Customer Account Dashboard
    {
      path: "/account",
      name: "account-dashboard",
      component: () => import("@/views/account/Dashboard.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/account/orders",
      name: "account-orders",
      component: () => import("@/views/orders/OrderList.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/account/profile",
      name: "account-profile",
      component: () => import("@/views/user/Profile.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/account/wishlist",
      name: "account-wishlist",
      component: () => import("@/views/account/Wishlist.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/account/reviews",
      name: "account-reviews",
      component: () => import("@/views/user/Reviews.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/account/addresses",
      name: "account-addresses",
      component: () => import("@/views/account/Addresses.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/account/notifications",
      name: "account-notifications",
      component: () => import("@/views/user/Notifications.vue"),
      meta: { requiresAuth: true },
    },
    // Legacy redirects
    {
      path: "/profile",
      redirect: "/account/profile",
    },
    {
      path: "/orders",
      redirect: "/account/orders",
    },
    {
      path: "/notifications",
      redirect: "/account/notifications",
    },
    {
      path: "/my-reviews",
      name: "user-reviews",
      component: () => import("@/views/user/Reviews.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/admin",
      name: "admin",
      component: () => import("@/views/admin/Dashboard.vue"),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: "/admin/products",
      name: "admin-products",
      component: () => import("@/views/admin/Products.vue"),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: "/admin/orders",
      name: "admin-orders",
      component: () => import("@/views/admin/Orders.vue"),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: "/admin/users",
      name: "admin-users",
      component: () => import("@/views/admin/Users.vue"),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: "/admin/analytics",
      name: "admin-analytics",
      component: () => import("@/views/admin/Analytics.vue"),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: "/admin/vendors",
      name: "admin-vendors",
      component: () => import("@/views/admin/Vendors.vue"),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: "/admin/reviews",
      name: "admin-reviews",
      component: () => import("@/views/admin/Reviews.vue"),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: "/admin/manual-payments",
      name: "admin-manual-payments",
      component: () => import("@/views/admin/ManualPayments.vue"),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: "/vendor",
      name: "vendor",
      component: () => import("@/views/vendor/Dashboard.vue"),
      meta: { requiresAuth: true, requiresVendor: true },
    },
    {
      path: "/vendor/login",
      name: "vendor-login",
      component: () => import("@/views/vendor/Login.vue"),
      meta: { guest: true },
    },
    {
      path: "/vendor/register",
      name: "vendor-register",
      component: () => import("@/views/vendor/Register.vue"),
      meta: { guest: true },
    },
    {
      path: "/vendor/products",
      name: "vendor-products",
      component: () => import("@/views/vendor/Products.vue"),
      meta: { requiresAuth: true, requiresVendor: true },
    },
    {
      path: "/vendor/products/add",
      name: "vendor-product-add",
      component: () => import("@/views/vendor/AddProduct.vue"),
      meta: { requiresAuth: true, requiresVendor: true },
    },
    {
      path: "/vendor/products/:id/edit",
      name: "vendor-product-edit",
      component: () => import("@/views/vendor/EditProduct.vue"),
      meta: { requiresAuth: true, requiresVendor: true },
    },
    {
      path: "/vendor/orders",
      name: "vendor-orders",
      component: () => import("@/views/vendor/Orders.vue"),
      meta: { requiresAuth: true, requiresVendor: true },
    },
    {
      path: "/vendor/profile",
      name: "vendor-profile",
      component: () => import("@/views/vendor/Profile.vue"),
      meta: { requiresAuth: true, requiresVendor: true },
    },
    {
      path: "/vendor/payouts",
      name: "vendor-payouts",
      component: () => import("@/views/vendor/Payouts.vue"),
      meta: { requiresAuth: true, requiresVendor: true },
    },
    {
      path: "/vendor/reviews",
      name: "vendor-reviews",
      component: () => import("@/views/vendor/Reviews.vue"),
      meta: { requiresAuth: true, requiresVendor: true },
    },
    {
      path: "/vendor/analytics",
      name: "vendor-analytics",
      component: () => import("@/views/vendor/Analytics.vue"),
      meta: { requiresAuth: true, requiresVendor: true },
    },
    {
      path: "/vendor/payment-settings",
      name: "vendor-payment-settings",
      component: () => import("@/views/vendor/PaymentSettings.vue"),
      meta: { requiresAuth: true, requiresVendor: true },
    },
    {
      path: "/shop/:vendorId",
      name: "vendor-shop",
      component: () => import("@/views/VendorShop.vue"),
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => import("@/views/NotFound.vue"),
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

// Navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  // Initialize auth if not already done
  if (!authStore.token) {
    authStore.initializeAuth();
  }

  // Prevent infinite redirects - if we're already at the destination, just proceed
  if (to.path === from.path) {
    next();
    return;
  }

  // Check if route is for guests only (redirect authenticated users away from login/register)
  if (to.meta.guest && authStore.isAuthenticated) {
    // Prevent redirect loop
    if (
      from.name === "home" ||
      from.name === "admin" ||
      from.name === "vendor"
    ) {
      next();
      return;
    }

    // Redirect based on user role
    if (authStore.isAdmin) {
      next({ name: "admin" });
    } else if (authStore.isVendor) {
      next({ name: "vendor" });
    } else {
      next({ name: "home" });
    }
    return;
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: "login", query: { redirect: to.fullPath } });
    return;
  }

  // Check if route requires admin
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next({ name: "home" });
    return;
  }

  // Check if route requires vendor
  if (to.meta.requiresVendor && !authStore.isVendor) {
    next({ name: "home" });
    return;
  }

  next();
});

export default router;