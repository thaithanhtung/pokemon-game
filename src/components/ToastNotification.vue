<template>
  <Transition name="toast">
    <div
      v-if="visible"
      :class="[
        'fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px]',
        typeClasses,
      ]"
    >
      <span class="text-2xl">{{ icon }}</span>
      <div class="flex-1">
        <p class="font-semibold">{{ message }}</p>
        <p v-if="description" class="text-sm opacity-90">{{ description }}</p>
      </div>
      <button @click="close" class="text-white/80 hover:text-white transition-colors">✕</button>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
  message: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'info',
    validator: value => ['success', 'error', 'warning', 'info'].includes(value),
  },
  duration: {
    type: Number,
    default: 3000,
  },
});

const emit = defineEmits(['close']);

const visible = ref(false);

const typeClasses = computed(() => {
  const classes = {
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    warning: 'bg-yellow-600 text-white',
    info: 'bg-blue-600 text-white',
  };
  return classes[props.type];
});

const icon = computed(() => {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };
  return icons[props.type];
});

const close = () => {
  visible.value = false;
  setTimeout(() => emit('close'), 300);
};

onMounted(() => {
  visible.value = true;
  if (props.duration > 0) {
    setTimeout(close, props.duration);
  }
});
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
