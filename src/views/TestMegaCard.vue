<template>
  <div class="min-h-screen bg-gray-900 p-8">
    <h1 class="text-3xl font-bold text-white mb-8 text-center">Mega Pokemon Card Styles</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
      <!-- Regular Epic Card -->
      <div class="text-center">
        <h2 class="text-white mb-4">Regular Epic Card</h2>
        <div class="flex justify-center">
          <BattleCard :card="regularCard" size="large" />
        </div>
      </div>
      
      <!-- Mega Pokemon Card -->
      <div class="text-center">
        <h2 class="text-white mb-4">Mega Pokemon Card</h2>
        <div class="flex justify-center">
          <BattleCard :card="megaCard" size="large" />
        </div>
      </div>
      
      <!-- Legendary Card -->
      <div class="text-center">
        <h2 class="text-white mb-4">Legendary Card</h2>
        <div class="flex justify-center">
          <BattleCard :card="legendaryCard" size="large" />
        </div>
      </div>
    </div>
    
    <div class="mt-12 text-center">
      <router-link to="/" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
        Back to Home
      </router-link>
    </div>
  </div>
</template>

<script setup>
import BattleCard from '@/components/BattleCard.vue';

const regularCard = {
  id: 'pokemon_94',
  uid: 'pokemon_94_test',
  pokemonId: 94,
  name: 'Gengar',
  type: 'pokemon',
  pokemonType: 'ghost',
  rarity: 'E',
  level: 3,
  hp: 90,
  maxHp: 90,
  atk: 65,
  def: 60,
  spd: 110,
  energy: 3,
  image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/94.png',
  skills: [
    {
      name: 'Shadow Ball',
      damage: 80,
      energy: 3,
      description: 'A ghostly sphere attack'
    }
  ]
};

const megaCard = {
  id: 'pokemon_10079',
  uid: 'pokemon_10079_test',
  pokemonId: 10079,
  name: 'Mega Gengar',
  type: 'pokemon',
  pokemonType: 'ghost',
  rarity: 'E',
  category: 'mega',
  level: 5,
  hp: 120,
  maxHp: 120,
  atk: 95,
  def: 80,
  spd: 130,
  energy: 4,
  image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/10079.png',
  skills: [
    {
      name: 'Shadow Ball',
      damage: 80,
      energy: 3,
      description: 'A ghostly sphere attack'
    }
  ]
};

const legendaryCard = {
  id: 'pokemon_150',
  uid: 'pokemon_150_test',
  pokemonId: 150,
  name: 'Mewtwo',
  type: 'pokemon',
  pokemonType: 'psychic',
  rarity: 'L',
  level: 1,
  hp: 106,
  maxHp: 106,
  atk: 110,
  def: 90,
  spd: 130,
  energy: 4,
  image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png',
  skills: [
    {
      name: 'Psychic',
      damage: 90,
      energy: 3,
      description: 'A powerful psychic attack'
    }
  ]
};
</script>