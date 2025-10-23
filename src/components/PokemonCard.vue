<script setup>
import { computed } from 'vue';
import { getTypeColor, formatPokemonId } from '@/services/pokeapi';
import { useRouter } from 'vue-router';

const props = defineProps({
  pokemon: {
    type: Object,
    required: true,
  },
});

const router = useRouter();

const formattedId = computed(() => formatPokemonId(props.pokemon.id));

const goToDetail = () => {
  router.push(`/pokemon/${props.pokemon.id}`);
};
</script>

<template>
  <div
    @click="goToDetail"
    class="pokemon-card bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
  >
    <div class="pokemon-number text-gray-500 text-sm mb-2">{{ formattedId }}</div>
    <div class="pokemon-image-container flex justify-center mb-3">
      <img
        :src="pokemon.sprite"
        :alt="pokemon.name"
        class="pokemon-image w-24 h-24 object-contain"
        loading="lazy"
      />
    </div>
    <h3 class="pokemon-name text-lg font-semibold text-center mb-2 capitalize">
      {{ pokemon.name }}
    </h3>
    <div class="pokemon-types flex gap-2 justify-center">
      <span
        v-for="type in pokemon.types"
        :key="type"
        class="type-badge px-3 py-1 rounded-full text-white text-sm capitalize"
        :style="{ backgroundColor: getTypeColor(type) }"
      >
        {{ type }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.pokemon-card {
  transition: transform 0.2s ease-in-out;
}

.pokemon-card:hover {
  transform: translateY(-4px);
}

.pokemon-image {
  image-rendering: crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: -webkit-optimize-contrast;
}

.type-badge {
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.025em;
}
</style>
