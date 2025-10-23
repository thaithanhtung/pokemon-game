<script setup>
import { useRoute } from 'vue-router';
import AppNavigation from '@/components/AppNavigation.vue';
import AppBreadcrumb from '@/components/AppBreadcrumb.vue';

const route = useRoute();
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Side Navigation -->
    <AppNavigation />
    
    <nav class="bg-white shadow-lg sticky top-0 z-40">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-8">
            <router-link to="/" class="flex items-center space-x-2">
              <img src="/favicon.ico" alt="Pokeball" class="w-8 h-8" />
              <span class="font-bold text-xl text-gray-800">Pokédex</span>
            </router-link>

            <div class="hidden md:flex space-x-4">
              <router-link
                to="/pokedex"
                :class="[
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  route.path.startsWith('/pokedex') || route.path.startsWith('/pokemon')
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100',
                ]"
              >
                Pokédex
              </router-link>

              <router-link
                to="/pokemon-farm"
                :class="[
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  route.path === '/pokemon-farm'
                    ? 'bg-green-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100',
                ]"
              >
                Farm
              </router-link>

              <router-link
                to="/pokemon-market"
                :class="[
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  route.path === '/pokemon-market'
                    ? 'bg-yellow-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100',
                ]"
              >
                Market
              </router-link>

              <router-link
                to="/card-clash/menu"
                :class="[
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  route.path.startsWith('/card-clash')
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100',
                ]"
              >
                Card Clash
              </router-link>
            </div>
          </div>

          <div class="md:hidden">
            <div class="flex space-x-2">
              <router-link
                to="/pokedex"
                :class="[
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  route.path.startsWith('/pokedex') || route.path.startsWith('/pokemon')
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100',
                ]"
              >
                Dex
              </router-link>

              <router-link
                to="/card-game"
                :class="[
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  route.path === '/card-game'
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100',
                ]"
              >
                Game
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Breadcrumbs -->
    <div class="container mx-auto px-4 pt-4">
      <AppBreadcrumb />
    </div>

    <router-view />
  </div>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
