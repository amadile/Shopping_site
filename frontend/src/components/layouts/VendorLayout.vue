<template>
  <div class="min-h-screen bg-gray-100 flex">
    <!-- Sidebar -->
    <aside
      class="bg-white w-64 flex-shrink-0 border-r border-gray-200 hidden md:flex flex-col transition-all duration-300"
      :class="{ '-ml-64': !isSidebarOpen }"
    >
      <div class="h-16 flex items-center justify-center border-b border-gray-200 px-4">
        <router-link to="/" class="flex items-center gap-2">
          <div class="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            V
          </div>
          <span class="text-xl font-bold text-gray-800">Vendor Portal</span>
        </router-link>
      </div>

      <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <router-link
          v-for="item in navigation"
          :key="item.name"
          :to="item.href"
          class="group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
          :class="[
            isActive(item.href)
              ? 'bg-green-50 text-green-700'
              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
          ]"
        >
          <component
            :is="item.icon"
            class="mr-3 flex-shrink-0 h-5 w-5 transition-colors"
            :class="[
              isActive(item.href)
                ? 'text-green-600'
                : 'text-gray-400 group-hover:text-gray-500',
            ]"
            aria-hidden="true"
          />
          {{ item.name }}
        </router-link>
      </nav>

      <div class="p-4 border-t border-gray-200">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
              {{ userInitials }}
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-700 group-hover:text-gray-900">
              {{ user?.name || 'Vendor' }}
            </p>
            <p class="text-xs font-medium text-gray-500 group-hover:text-gray-700">
              View Profile
            </p>
          </div>
        </div>
        <button
          @click="logout"
          class="mt-4 w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Logout
        </button>
      </div>
    </aside>

    <!-- Mobile Sidebar Overlay -->
    <div
      v-if="isMobileMenuOpen"
      class="fixed inset-0 z-40 flex md:hidden"
      role="dialog"
      aria-modal="true"
    >
      <div
        class="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
        @click="isMobileMenuOpen = false"
      ></div>

      <div class="relative flex-1 flex flex-col max-w-xs w-full bg-white transition ease-in-out duration-300 transform">
        <div class="absolute top-0 right-0 -mr-12 pt-2">
          <button
            @click="isMobileMenuOpen = false"
            class="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
          >
            <span class="sr-only">Close sidebar</span>
            <XMarkIcon class="h-6 w-6 text-white" aria-hidden="true" />
          </button>
        </div>

        <div class="h-16 flex items-center justify-center border-b border-gray-200 px-4">
          <span class="text-xl font-bold text-gray-800">Vendor Portal</span>
        </div>

        <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <router-link
            v-for="item in navigation"
            :key="item.name"
            :to="item.href"
            @click="isMobileMenuOpen = false"
            class="group flex items-center px-3 py-2 text-base font-medium rounded-md"
            :class="[
              isActive(item.href)
                ? 'bg-green-50 text-green-700'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
            ]"
          >
            <component
              :is="item.icon"
              class="mr-4 flex-shrink-0 h-6 w-6"
              :class="[
                isActive(item.href)
                  ? 'text-green-600'
                  : 'text-gray-400 group-hover:text-gray-500',
              ]"
              aria-hidden="true"
            />
            {{ item.name }}
          </router-link>
        </nav>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Top header -->
      <header class="bg-white shadow-sm z-10">
        <div class="px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <button
            @click="isMobileMenuOpen = true"
            class="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500 md:hidden"
          >
            <span class="sr-only">Open sidebar</span>
            <Bars3Icon class="h-6 w-6" aria-hidden="true" />
          </button>
          
          <div class="flex-1 flex justify-between items-center">
            <h1 class="text-2xl font-semibold text-gray-900 ml-4 md:ml-0">
              {{ currentPageTitle }}
            </h1>
            
            <div class="ml-4 flex items-center md:ml-6">
              <button class="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                <span class="sr-only">View notifications</span>
                <BellIcon class="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main content area -->
      <main class="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  HomeIcon,
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  StarIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isSidebarOpen = ref(true)
const isMobileMenuOpen = ref(false)

const user = computed(() => authStore.user)
const userInitials = computed(() => {
  const name = user.value?.name || 'Vendor'
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
})

const navigation = [
  { name: 'Dashboard', href: '/vendor', icon: HomeIcon },
  { name: 'Products', href: '/vendor/products', icon: ShoppingBagIcon },
  { name: 'Orders', href: '/vendor/orders', icon: ClipboardDocumentListIcon },
  { name: 'Analytics', href: '/vendor/analytics', icon: ChartBarIcon },
  { name: 'Reviews', href: '/vendor/reviews', icon: StarIcon },
  { name: 'Payouts', href: '/vendor/payouts', icon: CurrencyDollarIcon },
  { name: 'Settings', href: '/vendor/profile', icon: UserIcon },
]

const isActive = (path) => {
  if (path === '/vendor' && route.path === '/vendor') return true
  if (path !== '/vendor' && route.path.startsWith(path)) return true
  return false
}

const currentPageTitle = computed(() => {
  const activeItem = navigation.find(item => isActive(item.href))
  return activeItem ? activeItem.name : 'Vendor Portal'
})

const logout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>
