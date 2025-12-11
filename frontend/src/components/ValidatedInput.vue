<template>
  <div class="form-group">
    <label v-if="label" :for="id" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    
    <div class="relative">
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        @input="handleInput"
        @blur="handleBlur"
        @keypress="handleKeyPress"
        :placeholder="placeholder"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :class="[
          'w-full px-4 py-2.5 border rounded-lg transition-all duration-200',
          'focus:outline-none focus:ring-2',
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
            : valid && touched
            ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
            : 'border-gray-300 focus:border-green-500 focus:ring-green-200',
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white',
          icon ? 'pl-10' : '',
          showValidIcon && valid && touched ? 'pr-10' : ''
        ]"
      />
      
      <!-- Icon -->
      <div v-if="icon" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        <component :is="icon" class="h-5 w-5" />
      </div>
      
      <!-- Validation Icon -->
      <div v-if="showValidIcon && touched" class="absolute right-3 top-1/2 transform -translate-y-1/2">
        <CheckCircleIcon v-if="valid" class="h-5 w-5 text-green-500" />
        <XCircleIcon v-else-if="error" class="h-5 w-5 text-red-500" />
      </div>
    </div>
    
    <!-- Error Message -->
    <transition name="fade">
      <p v-if="error && touched" class="mt-1 text-sm text-red-600 flex items-center">
        <ExclamationCircleIcon class="h-4 w-4 mr-1" />
        {{ error }}
      </p>
    </transition>
    
    <!-- Help Text -->
    <p v-if="helpText && !error" class="mt-1 text-sm text-gray-500">
      {{ helpText }}
    </p>
    
    <!-- Password Strength Indicator -->
    <div v-if="type === 'password' && showStrength && modelValue" class="mt-2">
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs text-gray-600">Password Strength:</span>
        <span :class="[
          'text-xs font-medium',
          strengthColor === 'red' ? 'text-red-600' : '',
          strengthColor === 'orange' ? 'text-orange-600' : '',
          strengthColor === 'yellow' ? 'text-yellow-600' : '',
          strengthColor === 'green' ? 'text-green-600' : ''
        ]">
          {{ strengthLabel }}
        </span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div
          :class="[
            'h-2 rounded-full transition-all duration-300',
            strengthColor === 'red' ? 'bg-red-500' : '',
            strengthColor === 'orange' ? 'bg-orange-500' : '',
            strengthColor === 'yellow' ? 'bg-yellow-500' : '',
            strengthColor === 'green' ? 'bg-green-500' : ''
          ]"
          :style="{ width: `${strength}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { CheckCircleIcon, XCircleIcon, ExclamationCircleIcon } from '@heroicons/vue/24/solid'
import { getPasswordStrength } from '@/utils/validation'

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  modelValue: {
    type: [String, Number],
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  autocomplete: {
    type: String,
    default: 'off'
  },
  validator: {
    type: Function,
    default: null
  },
  sanitizer: {
    type: Function,
    default: null
  },
  preventPattern: {
    type: RegExp,
    default: null
  },
  helpText: {
    type: String,
    default: ''
  },
  icon: {
    type: [Object, Function],
    default: null
  },
  showValidIcon: {
    type: Boolean,
    default: true
  },
  showStrength: {
    type: Boolean,
    default: false
  },
  validateOnInput: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'validate'])

const touched = ref(false)
const error = ref('')
const valid = ref(false)

// Password strength
const strength = ref(0)
const strengthLabel = ref('None')
const strengthColor = ref('gray')

// Watch for password strength
watch(() => props.modelValue, (newValue) => {
  if (props.type === 'password' && props.showStrength) {
    const result = getPasswordStrength(newValue)
    strength.value = result.strength
    strengthLabel.value = result.label
    strengthColor.value = result.color
  }
})

// Handle input
function handleInput(event) {
  let value = event.target.value
  
  // Apply sanitizer if provided
  if (props.sanitizer) {
    value = props.sanitizer(value)
  }
  
  emit('update:modelValue', value)
  
  // Validate on input if enabled
  if (props.validateOnInput && touched.value) {
    validate(value)
  }
}

// Handle blur
function handleBlur() {
  touched.value = true
  validate(props.modelValue)
}

// Handle key press (prevent invalid characters)
function handleKeyPress(event) {
  if (props.preventPattern) {
    const char = event.key
    
    // Allow control keys
    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(char)) {
      return true
    }
    
    // Test against pattern
    if (!props.preventPattern.test(char)) {
      event.preventDefault()
      return false
    }
  }
}

// Validate
function validate(value) {
  if (!props.validator) {
    valid.value = true
    error.value = ''
    emit('validate', { valid: true, error: '' })
    return
  }
  
  const result = props.validator(value)
  valid.value = result.valid
  error.value = result.message
  
  emit('validate', result)
}

// Expose validate method
defineExpose({ validate })
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
