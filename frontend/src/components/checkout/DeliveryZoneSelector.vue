<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Region Selector -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Region</label>
        <select
          v-model="selectedRegion"
          @change="handleRegionChange"
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select Region</option>
          <option v-for="region in regions" :key="region.id" :value="region.id">
            {{ region.name }}
          </option>
        </select>
      </div>

      <!-- District Selector -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">District *</label>
        <select
          v-model="address.district"
          @change="handleDistrictChange"
          :disabled="!selectedRegion"
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
        >
          <option value="">Select District</option>
          <option v-for="district in availableDistricts" :key="district" :value="district">
            {{ district }}
          </option>
        </select>
      </div>
    </div>

    <!-- Zone Selector (Kampala/Wakiso only) -->
    <div v-if="hasZones">
      <label class="block text-sm font-medium text-gray-700 mb-1">Zone / Area *</label>
      <select
        v-model="address.zone"
        @change="handleZoneChange"
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">Select Zone</option>
        <option v-for="zone in availableZones" :key="zone.name" :value="zone.name">
          {{ zone.name }}
        </option>
      </select>
      <p v-if="address.zone" class="mt-1 text-sm text-green-600">
        Delivery Fee: {{ formatCurrency(currentFee) }}
      </p>
    </div>

    <!-- Manual Zone Input (Upcountry) -->
    <div v-else-if="address.district">
      <label class="block text-sm font-medium text-gray-700 mb-1">Town / Village *</label>
      <input
        type="text"
        v-model="address.zone"
        placeholder="e.g. Town Center, Main Street"
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
      />
      <p class="mt-1 text-sm text-gray-500">
        Standard Upcountry Delivery: {{ formatCurrency(currentFee) }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { formatCurrency } from '@/utils/helpers';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
    default: () => ({ district: '', zone: '' })
  }
});

const emit = defineEmits(['update:modelValue', 'fee-change']);

const address = ref({ ...props.modelValue });
const selectedRegion = ref('');
const currentFee = ref(0);

// Data
const regions = [
  { id: 'central', name: 'Central (Kampala & Environs)' },
  { id: 'western', name: 'Western Uganda' },
  { id: 'eastern', name: 'Eastern Uganda' },
  { id: 'northern', name: 'Northern Uganda' }
];

const districts = {
  central: ['Kampala', 'Wakiso', 'Mukono', 'Entebbe', 'Mpigi', 'Luweero'],
  western: ['Mbarara', 'Fort Portal', 'Kabale', 'Kasese', 'Hoima', 'Masindi'],
  eastern: ['Jinja', 'Mbale', 'Soroti', 'Tororo', 'Iganga'],
  northern: ['Gulu', 'Lira', 'Arua', 'Kitgum']
};

// Kampala Zones with specific fees
const kampalaZones = [
  { name: 'Central Business District', fee: 3000 },
  { name: 'Nakawa', fee: 4000 },
  { name: 'Ntinda', fee: 4000 },
  { name: 'Bugolobi', fee: 4000 },
  { name: 'Kololo', fee: 3000 },
  { name: 'Kawempe', fee: 5000 },
  { name: 'Bwaise', fee: 5000 },
  { name: 'Makindye', fee: 5000 },
  { name: 'Rubaga', fee: 5000 },
  { name: 'Kansanga', fee: 5000 },
  { name: 'Ggaba', fee: 6000 },
  { name: 'Munyonyo', fee: 6000 },
  { name: 'Nansana', fee: 7000 },
  { name: 'Kira', fee: 7000 },
  { name: 'Namugongo', fee: 8000 },
  { name: 'Entebbe Road', fee: 10000 }
];

// Standard fees
const FEES = {
  KAMPALA_DEFAULT: 5000,
  WAKISO_DEFAULT: 8000,
  MUKONO_DEFAULT: 10000,
  ENTEBBE_DEFAULT: 15000,
  UPCOUNTRY_DEFAULT: 15000
};

// Computed
const availableDistricts = computed(() => {
  return selectedRegion.value ? districts[selectedRegion.value] : [];
});

const hasZones = computed(() => {
  return ['Kampala', 'Wakiso'].includes(address.value.district);
});

const availableZones = computed(() => {
  if (address.value.district === 'Kampala' || address.value.district === 'Wakiso') {
    return kampalaZones;
  }
  return [];
});

// Methods
const handleRegionChange = () => {
  address.value.district = '';
  address.value.zone = '';
  calculateFee();
};

const handleDistrictChange = () => {
  address.value.zone = '';
  calculateFee();
};

const handleZoneChange = () => {
  calculateFee();
};

const calculateFee = () => {
  let fee = 0;
  const d = address.value.district;
  const z = address.value.zone;

  if (!d) {
    fee = 0;
  } else if (d === 'Kampala' || d === 'Wakiso') {
    // Check if specific zone selected
    const zoneObj = kampalaZones.find(item => item.name === z);
    if (zoneObj) {
      fee = zoneObj.fee;
    } else {
      fee = d === 'Kampala' ? FEES.KAMPALA_DEFAULT : FEES.WAKISO_DEFAULT;
    }
  } else if (d === 'Mukono') {
    fee = FEES.MUKONO_DEFAULT;
  } else if (d === 'Entebbe') {
    fee = FEES.ENTEBBE_DEFAULT;
  } else {
    // Upcountry
    fee = FEES.UPCOUNTRY_DEFAULT;
  }

  currentFee.value = fee;
  emit('update:modelValue', address.value);
  emit('fee-change', fee);
};

// Watch for external changes
watch(() => props.modelValue, (newVal) => {
  if (newVal.district !== address.value.district || newVal.zone !== address.value.zone) {
    address.value = { ...newVal };
    
    // Try to auto-select region based on district
    if (address.value.district && !selectedRegion.value) {
      for (const [reg, dists] of Object.entries(districts)) {
        if (dists.includes(address.value.district)) {
          selectedRegion.value = reg;
          break;
        }
      }
    }
    calculateFee();
  }
}, { deep: true });

onMounted(() => {
  // Initial setup if props provided
  if (address.value.district) {
     for (const [reg, dists] of Object.entries(districts)) {
        if (dists.includes(address.value.district)) {
          selectedRegion.value = reg;
          break;
        }
      }
      calculateFee();
  }
});

</script>
