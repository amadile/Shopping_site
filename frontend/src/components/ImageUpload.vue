<template>
  <div class="image-upload-container">
    <!-- Upload Area -->
    <div
      class="upload-area"
      :class="{ 'drag-over': isDragging, 'has-images': images.length > 0 }"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        :multiple="multiple"
        accept="image/*"
        class="hidden-input"
        @change="handleFileSelect"
      />
      
      <div v-if="images.length === 0" class="upload-prompt">
        <svg class="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p class="upload-text">
          <span class="upload-text-bold">Click to upload</span> or drag and drop
        </p>
        <p class="upload-hint">PNG, JPG, GIF up to 5MB</p>
      </div>

      <div v-else class="images-grid">
        <div v-for="(image, index) in images" :key="index" class="image-preview-card">
          <img :src="image.preview" :alt="`Preview ${index + 1}`" class="preview-image" />
          <button
            type="button"
            class="remove-button"
            @click.stop="removeImage(index)"
            :disabled="uploading"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div v-if="image.uploading" class="upload-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: image.progress + '%' }"></div>
            </div>
            <span class="progress-text">{{ image.progress }}%</span>
          </div>
          <div v-if="image.uploaded" class="upload-success">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        
        <!-- Add More Button -->
        <div v-if="multiple && images.length < maxImages" class="add-more-card" @click.stop="triggerFileInput">
          <svg class="add-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Add More</span>
        </div>
      </div>
    </div>

    <!-- Error Messages -->
    <div v-if="error" class="error-message">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ error }}</span>
    </div>

    <!-- Image Guidelines -->
    <div class="guidelines">
      <p class="guidelines-title">Image Guidelines:</p>
      <ul class="guidelines-list">
        <li>Use high-quality images (minimum 800x800px recommended)</li>
        <li>First image will be the main product image</li>
        <li>Maximum file size: 5MB per image</li>
        <li>Supported formats: JPG, PNG, GIF, WebP</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';
import api from '@/utils/api';

const props = defineProps({
  multiple: {
    type: Boolean,
    default: true
  },
  maxImages: {
    type: Number,
    default: 5
  },
  modelValue: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue', 'upload-complete', 'upload-error']);

const fileInput = ref(null);
const images = ref([]);
const isDragging = ref(false);
const uploading = ref(false);
const error = ref('');

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleDragOver = (e) => {
  isDragging.value = true;
};

const handleDragLeave = (e) => {
  isDragging.value = false;
};

const handleDrop = (e) => {
  isDragging.value = false;
  const files = Array.from(e.dataTransfer.files);
  processFiles(files);
};

const handleFileSelect = (e) => {
  const files = Array.from(e.target.files);
  processFiles(files);
};

const validateFile = (file) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!validTypes.includes(file.type)) {
    return 'Invalid file type. Please upload JPG, PNG, GIF, or WebP images.';
  }

  if (file.size > maxSize) {
    return 'File size exceeds 5MB limit.';
  }

  return null;
};

const processFiles = (files) => {
  error.value = '';
  
  if (!props.multiple && files.length > 1) {
    error.value = 'Only one image is allowed.';
    return;
  }

  if (images.value.length + files.length > props.maxImages) {
    error.value = `Maximum ${props.maxImages} images allowed.`;
    return;
  }

  files.forEach(file => {
    const validationError = validateFile(file);
    if (validationError) {
      error.value = validationError;
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = {
        file,
        preview: e.target.result,
        uploading: false,
        uploaded: false,
        progress: 0,
        url: null
      };
      images.value.push(imageData);
    };
    reader.readAsDataURL(file);
  });
};

const removeImage = (index) => {
  images.value.splice(index, 1);
  updateModelValue();
};

const uploadImages = async () => {
  uploading.value = true;
  error.value = '';
  const uploadedUrls = [];

  try {
    for (let i = 0; i < images.value.length; i++) {
      const image = images.value[i];
      
      if (image.uploaded) {
        uploadedUrls.push(image.url);
        continue;
      }

      image.uploading = true;
      
      const formData = new FormData();
      formData.append('image', image.file);

      try {
        const response = await api.post('/upload/image', formData, {
          headers: {
            'Content-Type': undefined
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            image.progress = progress;
          }
        });

        image.url = response.data.imageUrl;
        image.uploaded = true;
        image.uploading = false;
        uploadedUrls.push(response.data.imageUrl);
      } catch (err) {
        console.error('Upload failed for image:', err.response?.data || err.message);
        image.uploading = false;
        error.value = `Failed to upload image ${i + 1}: ${err.response?.data?.error || err.message}`;
        emit('upload-error', err);
        throw err;
      }
    }

    updateModelValue();
    emit('upload-complete', uploadedUrls);
    return uploadedUrls;
  } catch (err) {
    console.error('Upload error:', err);
    throw err;
  } finally {
    uploading.value = false;
  }
};

const updateModelValue = () => {
  const urls = images.value.filter(img => img.uploaded).map(img => img.url);
  emit('update:modelValue', urls);
};

const reset = () => {
  images.value = [];
  error.value = '';
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// Expose methods for parent component
defineExpose({
  uploadImages,
  reset,
  images
});
</script>

<style scoped>
.image-upload-container {
  width: 100%;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f9fafb;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area:hover {
  border-color: #10b981;
  background: #f0fdf4;
}

.upload-area.drag-over {
  border-color: #10b981;
  background: #d1fae5;
  transform: scale(1.02);
}

.upload-area.has-images {
  padding: 1.5rem;
  min-height: auto;
}

.hidden-input {
  display: none;
}

.upload-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.upload-icon {
  width: 48px;
  height: 48px;
  color: #9ca3af;
}

.upload-text {
  font-size: 0.875rem;
  color: #6b7280;
}

.upload-text-bold {
  font-weight: 600;
  color: #10b981;
}

.upload-hint {
  font-size: 0.75rem;
  color: #9ca3af;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  width: 100%;
}

.image-preview-card {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e5e7eb;
  background: white;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-button {
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

.remove-button:hover {
  background: #dc2626;
  transform: scale(1.1);
}

.remove-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.remove-button svg {
  width: 16px;
  height: 16px;
}

.upload-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  padding: 0.5rem;
}

.progress-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.progress-fill {
  height: 100%;
  background: #10b981;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: white;
  font-weight: 600;
}

.upload-success {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.9);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-success svg {
  width: 16px;
  height: 16px;
}

.add-more-card {
  aspect-ratio: 1;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.3s;
  background: #f9fafb;
}

.add-more-card:hover {
  border-color: #10b981;
  background: #f0fdf4;
}

.add-icon {
  width: 32px;
  height: 32px;
  color: #10b981;
}

.add-more-card span {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.875rem;
}

.error-message svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.guidelines {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #bae6fd;
}

.guidelines-title {
  font-weight: 600;
  color: #0369a1;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.guidelines-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.guidelines-list li {
  font-size: 0.8125rem;
  color: #075985;
  padding-left: 1.25rem;
  position: relative;
  margin-bottom: 0.25rem;
}

.guidelines-list li::before {
  content: "•";
  position: absolute;
  left: 0.5rem;
  color: #0ea5e9;
}
</style>
