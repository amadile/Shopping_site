<template>
  <div class="admin-reviews-page">
    <div class="page-header">
      <h1 class="text-2xl font-bold text-gray-900">Review Moderation</h1>
      <div class="header-actions">
        <div class="tabs">
          <button
            v-for="status in ['pending', 'approved', 'rejected', 'flagged']"
            :key="status"
            @click="currentStatus = status"
            class="tab-btn"
            :class="{ active: currentStatus === status }"
          >
            {{ status.charAt(0).toUpperCase() + status.slice(1) }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading reviews...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="empty-state">
      <div class="text-red-500 text-5xl mb-4">⚠️</div>
      <p class="text-gray-600 mb-4">Failed to load reviews</p>
      <button
        @click="fetchReviews"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Try Again
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && reviews.length === 0" class="empty-state">
      <p class="text-gray-500">No {{ currentStatus }} reviews found.</p>
    </div>

    <!-- Reviews List -->
    <div v-else class="reviews-list">
      <div v-for="review in reviews" :key="review._id" class="review-card">
        <div class="review-header">
          <div class="user-info">
            <div class="avatar">
              {{ getInitials(review.user?.name || "Anonymous") }}
            </div>
            <div>
              <div class="font-semibold">
                {{ review.user?.name || "Anonymous" }}
              </div>
              <div class="text-sm text-gray-500">
                {{ formatDate(review.createdAt) }}
              </div>
            </div>
          </div>
          <div class="product-link">
            Review for:
            <router-link
              :to="`/products/${review.product?._id}`"
              class="text-blue-600 hover:underline"
            >
              {{ review.product?.name || "Unknown Product" }}
            </router-link>
          </div>
        </div>

        <div class="review-content">
          <div class="rating mb-2">
            <span v-for="n in 5" :key="n" class="text-lg">
              <span v-if="n <= review.rating" class="text-yellow-500">★</span>
              <span v-else class="text-gray-300">★</span>
            </span>
          </div>
          <p class="text-gray-700">{{ review.comment }}</p>
        </div>

        <div class="review-actions">
          <template
            v-if="currentStatus === 'pending' || currentStatus === 'flagged'"
          >
            <button
              @click="approveReview(review._id)"
              class="btn btn-approve"
              :disabled="processing === review._id"
            >
              Approve
            </button>
            <button
              @click="rejectReview(review._id)"
              class="btn btn-reject"
              :disabled="processing === review._id"
            >
              Reject
            </button>
          </template>

          <button
            v-if="currentStatus === 'approved'"
            @click="rejectReview(review._id)"
            class="btn btn-reject"
            :disabled="processing === review._id"
          >
            Revoke Approval
          </button>

          <button
            v-if="currentStatus === 'rejected'"
            @click="approveReview(review._id)"
            class="btn btn-approve"
            :disabled="processing === review._id"
          >
            Re-Approve
          </button>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="totalPages > 1">
        <button @click="page--" :disabled="page === 1" class="btn-page">
          Previous
        </button>
        <span>Page {{ page }} of {{ totalPages }}</span>
        <button
          @click="page++"
          :disabled="page === totalPages"
          class="btn-page"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import api from "@/utils/api";
import { onMounted, ref, watch } from "vue";
import { useToast } from "vue-toastification";

const toast = useToast();
const reviews = ref([]);
const loading = ref(true);
const error = ref(false);
const currentStatus = ref("pending");
const page = ref(1);
const totalPages = ref(1);
const processing = ref(null);

const fetchReviews = async () => {
  loading.value = true;
  error.value = false;
  try {
    const response = await api.get("/reviews/admin/moderation-queue", {
      params: {
        status: currentStatus.value,
        page: page.value,
        limit: 20,
      },
    });
    reviews.value = response.data.reviews || [];
    totalPages.value = response.data.totalPages || 1;
  } catch (err) {
    console.error("Failed to fetch reviews:", err);
    error.value = true;
    toast.error("Failed to load reviews. Please try again.");
  } finally {
    loading.value = false;
  }
};

const approveReview = async (reviewId) => {
  processing.value = reviewId;
  try {
    await api.post(`/reviews/admin/${reviewId}/approve`);
    toast.success("Review approved");
    fetchReviews();
  } catch (error) {
    toast.error("Failed to approve review");
  } finally {
    processing.value = null;
  }
};

const rejectReview = async (reviewId) => {
  const reason = prompt("Please enter a reason for rejection:");
  if (!reason) return;

  processing.value = reviewId;
  try {
    await api.post(`/reviews/admin/${reviewId}/reject`, { reason });
    toast.success("Review rejected");
    fetchReviews();
  } catch (error) {
    toast.error("Failed to reject review");
  } finally {
    processing.value = null;
  }
};

const getInitials = (name) => {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

watch([currentStatus, page], () => {
  fetchReviews();
});

onMounted(() => {
  fetchReviews();
});
</script>

<style scoped>
.admin-reviews-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.tabs {
  display: flex;
  gap: 8px;
  background: #f3f4f6;
  padding: 4px;
  border-radius: 8px;
}

.tab-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: white;
  color: #1f2937;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 60px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  margin: 0 auto 16px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.reviews-list {
  display: grid;
  gap: 16px;
}

.review-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.user-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.avatar {
  width: 40px;
  height: 40px;
  background: #e0e7ff;
  color: #4f46e5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.review-content {
  background: #f9fafb;
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.review-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-approve {
  background: #10b981;
  color: white;
}

.btn-reject {
  background: #ef4444;
  color: white;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.btn-page {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  cursor: pointer;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
