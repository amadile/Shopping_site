<template>
  <VendorLayout>
    <div class="max-w-4xl mx-auto p-6">
      <form @submit.prevent="submitProduct" class="product-form">
        <!-- Product Images Section -->
        <div class="form-section">
          <h2 class="section-title">Product Images</h2>
          <p class="section-description">Upload high-quality images of your product. The first image will be the main display image.</p>
          <ImageUpload
            ref="imageUploadRef"
            v-model="product.images"
            :multiple="true"
            :max-images="5"
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
              <label class="form-label">
                Brand
              </label>
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
              <label class="form-label">
                SKU (Stock Keeping Unit)
              </label>
              <input
                v-model="product.sku"
                type="text"
                placeholder="e.g., PROD-001"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label class="form-label">
                Weight (kg)
              </label>
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
              Add Product
            </span>
            <span v-else class="flex items-center">
              <svg class="animate-spin btn-icon" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading & Saving...
            </span>
          </button>
        </div>
      </form>
    </div>
  </VendorLayout>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import api from '@/utils/api';
import VendorLayout from '@/components/layouts/VendorLayout.vue';
import ImageUpload from '@/components/ImageUpload.vue';

const router = useRouter();
const toast = useToast();

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
const submitting = ref(false);

const handleUploadComplete = (urls) => {
  console.log('Images uploaded:', urls);
  product.value.images = urls;
};

const handleUploadError = (error) => {
  console.error('Upload error:', error);
  toast.error('Failed to upload images. Please try again.');
};

const submitProduct = async () => {
  console.log('Submit product clicked');
  submitting.value = true;
  
  try {
    // First, upload images if any
    if (imageUploadRef.value && imageUploadRef.value.images?.length > 0) {
      console.log('Uploading images...');
      toast.info('Uploading images...');
      // Explicitly use the return value to ensure we have the URLs
      const uploadedUrls = await imageUploadRef.value.uploadImages();
      console.log('Images uploaded successfully:', uploadedUrls);
      product.value.images = uploadedUrls;
    }

    // Validate that at least one image is uploaded
    if (!product.value.images || product.value.images.length === 0) {
      console.warn('No images uploaded');
      toast.warning('Please upload at least one product image');
      submitting.value = false;
      return;
    }

    // Submit product data
    console.log('Sending product data to backend:', product.value);
    toast.info('Creating product...');
    const response = await api.post('/products', product.value);
    console.log('Product created response:', response);
    
    toast.success('Product added successfully!');
    
    // Redirect to product list after success
    console.log('Redirecting to products page...');
    // Use a shorter timeout and ensure router is available
    setTimeout(() => {
      router.push({ name: 'vendor-products' }); // Use named route for better reliability
    }, 500);
  } catch (error) {
    console.error('Failed to add product:', error);
    const errorMessage = error.response?.data?.error || error.message || 'Failed to add product';
    toast.error(errorMessage);
  } finally {
    submitting.value = false;
  }
};

const goBack = () => {
  router.push('/vendor/products');
};
</script>

<style scoped>
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

        <!-- Product Images Section -->
        <div class="form-section">
          <h2 class="section-title">Product Images</h2>
          <p class="section-description">Upload high-quality images of your product. The first image will be the main display image.</p>
          <ImageUpload
            ref="imageUploadRef"
            v-model="product.images"
            :multiple="true"
            :max-images="5"
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
              <label class="form-label">
                Brand
              </label>
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
              <label class="form-label">
                SKU (Stock Keeping Unit)
              </label>
              <input
                v-model="product.sku"
                type="text"
                placeholder="e.g., PROD-001"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label class="form-label">
                Weight (kg)
              </label>
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
              Add Product
            </span>
            <span v-else class="flex items-center">
              <svg class="animate-spin btn-icon" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading & Saving...
            </span>
          </button>
        </div>
      </form>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import api from '@/utils/api';
import VendorLayout from '@/components/layouts/VendorLayout.vue';
import ImageUpload from '@/components/ImageUpload.vue';

const router = useRouter();
const toast = useToast();

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
const submitting = ref(false);

const handleUploadComplete = (urls) => {
  console.log('Images uploaded:', urls);
  product.value.images = urls;
};

const handleUploadError = (error) => {
  console.error('Upload error:', error);
  toast.error('Failed to upload images. Please try again.');
};

const submitProduct = async () => {
  console.log('Submit product clicked');
  submitting.value = true;
  
  try {
    // First, upload images if any
    if (imageUploadRef.value && imageUploadRef.value.images?.length > 0) {
      console.log('Uploading images...');
      toast.info('Uploading images...');
      // Explicitly use the return value to ensure we have the URLs
      const uploadedUrls = await imageUploadRef.value.uploadImages();
      console.log('Images uploaded successfully:', uploadedUrls);
      product.value.images = uploadedUrls;
    }

    // Validate that at least one image is uploaded
    if (!product.value.images || product.value.images.length === 0) {
      console.warn('No images uploaded');
      toast.warning('Please upload at least one product image');
      submitting.value = false;
      return;
    }

    // Submit product data
    console.log('Sending product data to backend:', product.value);
    toast.info('Creating product...');
    const response = await api.post('/products', product.value);
    console.log('Product created response:', response);
    
    toast.success('Product added successfully!');
    
    // Redirect to product list after success
    console.log('Redirecting to products page...');
    // Use a shorter timeout and ensure router is available
    setTimeout(() => {
      router.push({ name: 'vendor-products' }); // Use named route for better reliability
    }, 500);
  } catch (error) {
    console.error('Failed to add product:', error);
    const errorMessage = error.response?.data?.error || error.message || 'Failed to add product';
    toast.error(errorMessage);
  } finally {
    submitting.value = false;
  }
};

const goBack = () => {
  router.push('/vendor/products');
};
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
