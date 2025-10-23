<template>
  <div class="pokemon-detail-skeleton bg-white rounded-lg shadow-lg overflow-hidden">
    <div class="skeleton-header p-8 bg-gray-200 relative">
      <div class="flex flex-col md:flex-row items-center justify-between">
        <div class="text-center md:text-left mb-6 md:mb-0">
          <div class="h-10 w-48 bg-gray-300 rounded mb-2 animate-pulse"></div>
          <div class="h-6 w-32 bg-gray-300 rounded mb-2 animate-pulse"></div>
          <div class="h-8 w-20 bg-gray-300 rounded mt-2 animate-pulse"></div>
          <div class="flex gap-3 mt-4 justify-center md:justify-start">
            <div class="h-8 w-20 bg-gray-300 rounded-full animate-pulse"></div>
            <div class="h-8 w-20 bg-gray-300 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div class="skeleton-image w-64 h-64 bg-gray-300 rounded-full animate-pulse"></div>
      </div>
    </div>

    <div class="skeleton-tabs flex border-b">
      <div class="h-12 w-24 bg-gray-200 animate-pulse"></div>
      <div class="h-12 w-32 bg-gray-200 animate-pulse"></div>
      <div class="h-12 w-28 bg-gray-200 animate-pulse"></div>
      <div class="h-12 w-24 bg-gray-200 animate-pulse"></div>
    </div>

    <div class="skeleton-content p-8">
      <div class="space-y-4">
        <div class="h-4 bg-gray-200 rounded animate-pulse"></div>
        <div class="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
        <div class="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div class="space-y-3">
          <div class="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div class="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div class="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div class="h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div class="space-y-3">
          <div class="h-6 w-24 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div class="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div class="h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
