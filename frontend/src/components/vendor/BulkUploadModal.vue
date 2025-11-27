<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto" @click.self="close">
    <div class="flex items-center justify-center min-h-screen px-4">
      <div class="fixed inset-0 bg-black opacity-50"></div>
      
      <div class="relative bg-white rounded-lg shadow-xl max-w-4xl w-full p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold">Bulk Upload Products</h3>
          <button @click="close" class="text-gray-500 hover:text-gray-700">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Step 1: File Upload -->
        <div v-if="step === 1">
          <div class="mb-4">
            <p class="text-sm text-gray-600 mb-4">
              Upload a CSV file with your products. Download the 
              <button @click="downloadTemplate" class="text-blue-600 hover:underline">sample template</button> 
              to see the required format.
            </p>
            
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                ref="fileInput"
                type="file"
                accept=".csv"
                @change="handleFileSelect"
                class="hidden"
              />
              
              <div v-if="!selectedFile">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p class="mt-2 text-sm text-gray-600">
                  <button @click="$refs.fileInput.click()" class="text-blue-600 hover:underline">
                    Click to upload
                  </button> or drag and drop
                </p>
                <p class="text-xs text-gray-500">CSV files only (max 5MB)</p>
              </div>
              
              <div v-else class="flex items-center justify-center">
                <svg class="h-8 w-8 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-sm">{{ selectedFile.name }}</span>
                <button @click="clearFile" class="ml-4 text-red-600 hover:underline text-sm">Remove</button>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3">
            <button @click="close" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button 
              @click="parseFile" 
              :disabled="!selectedFile || uploading"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ uploading ? 'Processing...' : 'Next' }}
            </button>
          </div>
        </div>

        <!-- Step 2: Preview & Confirm -->
        <div v-if="step === 2">
          <div class="mb-4">
            <p class="text-sm text-gray-600 mb-2">
              Preview of products to be uploaded ({{ parsedProducts.length }} products)
            </p>
            
            <!-- Errors -->
            <div v-if="parseErrors.length > 0" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 class="font-semibold text-red-800 mb-2">Validation Errors:</h4>
              <ul class="text-sm text-red-700 list-disc list-inside max-h-32 overflow-y-auto">
                <li v-for="(error, index) in parseErrors" :key="index">{{ error }}</li>
              </ul>
            </div>

            <!-- Preview Table -->
            <div class="max-h-96 overflow-y-auto border rounded-lg">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50 sticky top-0">
                  <tr>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="(product, index) in parsedProducts" :key="index">
                    <td class="px-4 py-2 text-sm">{{ product.name }}</td>
                    <td class="px-4 py-2 text-sm">{{ formatCurrency(product.price) }}</td>
                    <td class="px-4 py-2 text-sm">{{ product.category }}</td>
                    <td class="px-4 py-2 text-sm">{{ product.stock }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="flex justify-end gap-3">
            <button @click="step = 1" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Back
            </button>
            <button 
              @click="uploadProducts" 
              :disabled="parsedProducts.length === 0 || uploading"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ uploading ? 'Uploading...' : `Upload ${parsedProducts.length} Products` }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/utils/api'
import { useToast } from 'vue-toastification'

const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close', 'success'])

const toast = useToast()
const step = ref(1)
const selectedFile = ref(null)
const parsedProducts = ref([])
const parseErrors = ref([])
const uploading = ref(false)
const fileInput = ref(null)

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX'
  }).format(amount)
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }
    selectedFile.value = file
  }
}

const clearFile = () => {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const parseFile = async () => {
  if (!selectedFile.value) return
  
  uploading.value = true
  try {
    const text = await selectedFile.value.text()
    const lines = text.trim().split('\n')
    
    if (lines.length < 2) {
      toast.error('CSV must contain headers and at least one product')
      return
    }

    // Simple client-side parsing for preview
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const products = []
    const errors = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      if (values.length !== headers.length) continue

      const product = {}
      headers.forEach((header, index) => {
        product[header] = values[index]
      })
      
      if (product.name && product.price && product.category && product.stock) {
        products.push({
          name: product.name,
          price: parseFloat(product.price),
          category: product.category,
          stock: parseInt(product.stock)
        })
      } else {
        errors.push(`Line ${i + 1}: Missing required fields`)
      }
    }

    parsedProducts.value = products
    parseErrors.value = errors
    step.value = 2
  } catch (error) {
    toast.error('Failed to parse CSV file')
    console.error(error)
  } finally {
    uploading.value = false
  }
}

const uploadProducts = async () => {
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)

    const response = await api.post('/vendor/products/bulk-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    toast.success(response.data.message)
    emit('success')
    close()
  } catch (error) {
    toast.error(error.response?.data?.error || 'Upload failed')
    if (error.response?.data?.errors) {
      parseErrors.value = error.response.data.errors
    }
  } finally {
    uploading.value = false
  }
}

const downloadTemplate = () => {
  const template = `name,description,price,category,stock,sku,images
"Sample Product 1","A great product description",29999,electronics,100,SKU001,https://example.com/image1.jpg|https://example.com/image2.jpg
"Sample Product 2","Another product",49999,clothing,50,SKU002,https://example.com/image3.jpg`

  const blob = new Blob([template], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'product-template.csv'
  a.click()
  window.URL.revokeObjectURL(url)
}

const close = () => {
  step.value = 1
  selectedFile.value = null
  parsedProducts.value = []
  parseErrors.value = []
  emit('close')
}
</script>
