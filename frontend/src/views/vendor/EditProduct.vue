<template>
  <DefaultLayout>
    <div class="max-w-4xl mx-auto p-6">
      <div class="header-section">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="page-title">Edit Product</h1>
            <p class="page-subtitle">Update product details and manage images</p>
          </div>
          <router-link to="/vendor/products" class="back-link">
            <svg class="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Products
          </router-link>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <svg class="animate-spin loading-icon" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p>Loading product...</p>
      </div>

      <form v-else @submit.prevent="updateProduct" class="product-form">
        <!-- Existing Product Images Section -->
        <div class="form-section">
          <h2 class="section-title">Current Product Images</h2>
          <p class="section-description">Manage existing images or add new ones. Drag to reorder.</p>
          
          <div v-if="product.images && product.images.length > 0" class="existing-images-grid">
            <div
              v-for="(image, index) in product.images"
              :key="index"
              class="existing-image-card"
              :class="{ 'is-primary': index === 0 }"
            >
              <img :src="getImageUrl(image)" :alt="`Product image ${index + 1}`" class="existing-image" />
              <div v-if="index === 0" class="primary-badge">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Main Image
              </div>
              <button
                type="button"
                class="remove-existing-button"
                @click="removeExistingImage(index)"
                :disabled="submitting"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div v-else class="no-images-message">
            <svg class="no-images-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>No images uploaded yet</p>
          </div>
        </div>

        <!-- Add New Images Section -->
        <div class="form-section">
          <h2 class="section-title">Add New Images</h2>
          <p class="section-description">Upload additional product images (up to {{ maxTotalImages - (product.images?.length || 0) }} more)</p>
          <ImageUpload
            ref="imageUploadRef"
            v-model="newImages"
            :multiple="true"
            :max-images="maxTotalImages - (product.images?.length || 0)"
            @upload-complete="handleUploadComplete"
            @upload-error="handleUploadError"
          />
        </div>

        <!-- Product Details Section -->
        <div class="form-section">
          <h2 class="section-title">Product Details</h2>
          
          <div class="form-grid">
            <div class="form-group full-width">
              <label class="form-label">
                Product Name <span class="required">*</span>
              </label>
              <input
                v-model="product.name"
                type="text"
                required
                placeholder="Enter product name"
                class="form-input"
              />
            </div>

            <div class="form-group full-width">
              <label class="form-label">
                Description <span class="required">*</span>
              </label>
              <textarea
                v-model="product.description"
                rows="4"
                required
                placeholder="Describe your product in detail..."
                class="form-textarea"
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">
                Category <span class="required">*</span>
              </label>
              <select v-model="product.category" required class="form-select">
                <option value="">Select a category</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="food">Food & Beverages</option>
                <option value="home">Home & Garden</option>
                <option value="beauty">Beauty & Personal Care</option>
                <option value="sports">Sports & Outdoors</option>
                <option value="books">Books & Media</option>
                <option value="toys">Toys & Games</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Brand</label>
              <input
                v-model="product.brand"
                type="text"
                placeholder="Enter brand name"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label class="form-label">
                Price (UGX) <span class="required">*</span>
              </label>
              <div class="input-with-prefix">
                <span class="input-prefix">UGX</span>
                <input
                  v-model.number="product.price"
                  type="number"
                  min="0"
                  step="100"
                  required
                  placeholder="0"
                  class="form-input with-prefix"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">
                Stock Quantity <span class="required">*</span>
              </label>
              <input
                v-model.number="product.stock"
                type="number"
                min="0"
                required
                placeholder="0"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label class="form-label">SKU (Stock Keeping Unit)</label>
              <input
                v-model="product.sku"
                type="text"
                placeholder="e.g., PROD-001"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Weight (kg)</label>
              <input
                v-model.number="product.weight"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                class="form-input"
              />
            </div>
          </div>
        </div>

        <!-- Additional Options Section -->
        <div class="form-section">
          <h2 class="section-title">Additional Options</h2>
          
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input
                v-model="product.featured"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-text">Feature this product</span>
            </label>
            <p class="checkbox-description">Featured products appear prominently on your store</p>
          </div>

          <div class="checkbox-group">
            <label class="checkbox-label">
              <input
                v-model="product.freeShipping"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-text">Offer free shipping</span>
            </label>
            <p class="checkbox-description">Free shipping can increase sales</p>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button
            type="button"
            @click="goBack"
            class="btn btn-secondary"
            :disabled="submitting"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="submitting"
          >
            <span v-if="!submitting">
              <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Update Product
            </span>
            <span v-else class="flex items-center">
              <svg class="animate-spin btn-icon" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </span>
          </button>
        </div>
      </form>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import api from '@/utils/api';
import DefaultLayout from '@/components/layouts/DefaultLayout.vue';
import ImageUpload from '@/components/ImageUpload.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const productId = route.params.id;
const imageUploadRef = ref(null);
const product = ref({
  name: '',
  description: '',
  category: '',
  brand: '',
  price: 0,
  stock: 0,
  sku: '',
  weight: 0,
  images: [],
  featured: false,
  freeShipping: false
});
const newImages = ref([]);
const loading = ref(true);
const submitting = ref(false);
const maxTotalImages = 5;

const loadProduct = async () => {
  loading.value = true;
  try {
    const response = await api.get(`/products/${productId}`);
    product.value = response.data.product || response.data;
    
    // Ensure images is an array
    if (!product.value.images) {
      product.value.images = [];
    }
  } catch (error) {
    console.error('Failed to load product:', error);
    toast.error('Failed to load product details');
    router.push('/vendor/products');
  } finally {
    loading.value = false;
  }
};

const getImageUrl = (image) => {
  if (typeof image === 'string') {
    return image.startsWith('http') ? image : `http://localhost:5000${image}`;
  }
  return image.url || image;
};

const removeExistingImage = async (index) => {
  if (!confirm('Are you sure you want to remove this image?')) {
    return;
  }

  try {
    const imageToRemove = product.value.images[index];
    const imageUrl = getImageUrl(imageToRemove);
    
    // Remove from array
    product.value.images.splice(index, 1);
    
    toast.success('Image removed');
  } catch (error) {
    console.error('Failed to remove image:', error);
    toast.error('Failed to remove image');
  }
};

const handleUploadComplete = (urls) => {
  console.log('New images uploaded:', urls);
  newImages.value = urls;
};

const handleUploadError = (error) => {
  console.error('Upload error:', error);
  toast.error('Failed to upload images. Please try again.');
};

const updateProduct = async () => {
  console.log('Update product clicked');
  submitting.value = true;
  
  try {
    // Upload new images if any
    if (imageUploadRef.value && imageUploadRef.value.images?.length > 0) {
      console.log('Uploading new images...');
      toast.info('Uploading new images...');
      // Explicitly use the return value
      const uploadedUrls = await imageUploadRef.value.uploadImages();
      console.log('New images uploaded successfully:', uploadedUrls);
      newImages.value = uploadedUrls;
    }

    // Combine existing and new images
    const allImages = [...(product.value.images || []), ...newImages.value];
    
    // Prepare update data
    const updateData = {
      ...product.value,
      images: allImages
    };

    console.log('Sending update data to backend:', updateData);
    toast.info('Updating product...');
    await api.put(`/products/${productId}`, updateData);
    
    toast.success('Product updated successfully!');
    
    // Redirect to product list after success
    console.log('Redirecting to products page...');
    setTimeout(() => {
      router.push({ name: 'vendor-products' });
    }, 500);
  } catch (error) {
    console.error('Failed to update product:', error);
    const errorMessage = error.response?.data?.error || error.message || 'Failed to update product';
    toast.error(errorMessage);
  } finally {
    submitting.value = false;
  }
};

const goBack = () => {
  router.push('/vendor/products');
};

onMounted(loadProduct);
</script>

<style scoped>
.header-section {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  font-size: 1rem;
  color: #6b7280;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  color: #374151;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  text-decoration: none;
}

.back-link:hover {
  background: #e5e7eb;
}

.back-icon {
  width: 18px;
  height: 18px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
}

.loading-icon {
  width: 48px;
  height: 48px;
  color: #10b981;
}

.product-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.section-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.existing-images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.existing-image-card {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e5e7eb;
  background: white;
  transition: all 0.2s;
}

.existing-image-card.is-primary {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.existing-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.primary-badge {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.primary-badge svg {
  width: 14px;
  height: 14px;
}

.remove-existing-button {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.remove-existing-button:hover {
  background: #dc2626;
  transform: scale(1.1);
}

.remove-existing-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.remove-existing-button svg {
  width: 16px;
  height: 16px;
}

.no-images-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 2px dashed #d1d5db;
}

.no-images-icon {
  width: 48px;
  height: 48px;
  color: #9ca3af;
  margin-bottom: 0.75rem;
}

.no-images-message p {
  color: #6b7280;
  font-size: 0.875rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.required {
  color: #ef4444;
}

.form-input,
.form-textarea,
.form-select {
  padding: 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s;
  background: white;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #10b981;
  ring: 2px;
  ring-color: rgba(16, 185, 129, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.input-with-prefix {
  position: relative;
  display: flex;
  align-items: center;
}

.input-prefix {
  position: absolute;
  left: 0.875rem;
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  pointer-events: none;
}

.form-input.with-prefix {
  padding-left: 3.5rem;
}

.checkbox-group {
  margin-bottom: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 2px solid #d1d5db;
  cursor: pointer;
  accent-color: #10b981;
}

.checkbox-text {
  margin-left: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.checkbox-description {
  margin-left: 2.25rem;
  margin-top: 0.25rem;
  font-size: 0.8125rem;
  color: #6b7280;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 12px -2px rgba(16, 185, 129, 0.4);
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-icon {
  width: 18px;
  height: 18px;
  margin-right: 0.5rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column-reverse;
  }
  
  .btn {
    width: 100%;
  }
}
</style>
