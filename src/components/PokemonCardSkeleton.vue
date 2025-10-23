<template>
  <div class="pokemon-card-skeleton bg-white rounded-lg shadow-md p-4">
    <div class="skeleton-number h-4 w-12 bg-gray-200 rounded animate-pulse mb-2"></div>
    <div class="skeleton-image-container flex justify-center mb-3">
      <div class="skeleton-image w-24 h-24 bg-gray-200 rounded-full animate-pulse"></div>
    </div>
    <div class="skeleton-name-container flex flex-col items-center gap-2 mt-2">
      <div class="skeleton-name h-6 w-24 bg-gray-200 rounded mx-auto mb-2 animate-pulse"></div>
      <div class="skeleton-types flex gap-2 justify-center">
        <div class="skeleton-type h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
        <div class="skeleton-type h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pokemon-card-skeleton {
  min-height: 210px;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
