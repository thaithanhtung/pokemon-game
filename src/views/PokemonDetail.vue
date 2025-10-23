<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePokemonStore } from '@/stores/pokemon';
import { getTypeColor, formatPokemonId, pokeAPI } from '@/services/pokeapi';
import PokemonDetailSkeleton from '@/components/PokemonDetailSkeleton.vue';

const route = useRoute();
const router = useRouter();
const pokemonStore = usePokemonStore();

const pokemon = ref(null);
const species = ref(null);
const evolutionChain = ref(null);
const isLoading = ref(true);
const error = ref(null);
const activeTab = ref('about');
const pokemonForms = ref([]);
const selectedForm = ref(null);
const loadingForm = ref(false);
const abilityDetails = ref({});
const moveDetails = ref({});
const showAllTMMoves = ref(false);
const showAllEggMoves = ref(false);
const loadingMoves = ref(false);

const pokemonId = computed(() => route.params.id);
const formattedId = computed(() => {
  // Use species ID for National Dex number, not form ID
  if (species.value?.id) {
    return formatPokemonId(species.value.id);
  }
  return pokemon.value ? formatPokemonId(pokemon.value.id) : '';
});

const typeEffectiveness = {
  normal: { fighting: 2, ghost: 0 },
  fighting: { flying: 2, psychic: 2, fairy: 2, rock: 0.5, bug: 0.5, dark: 0.5 },
  flying: { rock: 2, electric: 2, ice: 2, fighting: 0.5, ground: 0, bug: 0.5, grass: 0.5 },
  poison: { ground: 2, psychic: 2, fighting: 0.5, poison: 0.5, bug: 0.5, grass: 0.5, fairy: 0.5 },
  ground: { water: 2, grass: 2, ice: 2, poison: 0.5, rock: 0.5, electric: 0 },
  rock: {
    fighting: 2,
    ground: 2,
    steel: 2,
    water: 2,
    grass: 2,
    normal: 0.5,
    flying: 0.5,
    poison: 0.5,
    fire: 0.5,
  },
  bug: { flying: 2, rock: 2, fire: 2, fighting: 0.5, ground: 0.5, grass: 0.5 },
  ghost: { ghost: 2, dark: 2, normal: 0, fighting: 0, poison: 0.5, bug: 0.5 },
  steel: {
    fire: 2,
    fighting: 2,
    ground: 2,
    normal: 0.5,
    grass: 0.5,
    ice: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 0.5,
    dragon: 0.5,
    steel: 0.5,
    fairy: 0.5,
    poison: 0,
  },
  fire: {
    ground: 2,
    rock: 2,
    water: 2,
    fire: 0.5,
    grass: 0.5,
    ice: 0.5,
    bug: 0.5,
    steel: 0.5,
    fairy: 0.5,
  },
  water: { grass: 2, electric: 2, water: 0.5, fire: 0.5, ice: 0.5, steel: 0.5 },
  grass: {
    flying: 2,
    poison: 2,
    bug: 2,
    fire: 2,
    ice: 2,
    ground: 0.5,
    water: 0.5,
    grass: 0.5,
    electric: 0.5,
  },
  electric: { ground: 2, electric: 0.5, flying: 0.5, steel: 0.5 },
  psychic: { bug: 2, ghost: 2, dark: 2, fighting: 0.5, psychic: 0.5 },
  ice: { fighting: 2, rock: 2, steel: 2, fire: 2, ice: 0.5 },
  dragon: { ice: 2, dragon: 2, fairy: 2, fire: 0.5, water: 0.5, electric: 0.5, grass: 0.5 },
  dark: { fighting: 2, bug: 2, fairy: 2, ghost: 0.5, dark: 0.5, psychic: 0 },
  fairy: { poison: 2, steel: 2, fighting: 0.5, bug: 0.5, dark: 0.5, dragon: 0 },
};

const statNames = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
};

const getStatPercentage = baseStat => {
  const maxStat = 255;
  return (baseStat / maxStat) * 100;
};

const getStatBarColor = statName => {
  const colors = {
    hp: '#FF5959',
    attack: '#F5AC78',
    defense: '#FAE078',
    'special-attack': '#9DB7F5',
    'special-defense': '#A7DB8D',
    speed: '#FA92B2',
  };
  return colors[statName] || '#68A090';
};

const calculateMinMaxStats = (baseStat, statName) => {
  const level = 100;
  let min, max;

  if (statName === 'hp') {
    min = Math.floor(((2 * baseStat + 0 + 0) * level) / 100) + level + 10;
    max = Math.floor(((2 * baseStat + 31 + 252 / 4) * level) / 100) + level + 10;
  } else {
    min = Math.floor((((2 * baseStat + 0 + 0) * level) / 100 + 5) * 0.9);
    max = Math.floor((((2 * baseStat + 31 + 252 / 4) * level) / 100 + 5) * 1.1);
  }

  return { min, max };
};

const formatHeight = height => {
  const meters = height / 10;
  const feet = meters * 3.28084;
  const feetOnly = Math.floor(feet);
  const inches = Math.round((feet - feetOnly) * 12);
  return `${meters} m (${feetOnly}'${inches.toString().padStart(2, '0')}")`;
};

const formatWeight = weight => {
  const kg = weight / 10;
  const lbs = (kg * 2.20462).toFixed(1);
  return `${kg} kg (${lbs} lbs)`;
};

const getEVYield = () => {
  if (!pokemon.value) return '';
  const evs = pokemon.value.stats
    .filter(stat => stat.effort > 0)
    .map(stat => `${stat.effort} ${statNames[stat.stat.name]}`)
    .join(', ');
  return evs || 'None';
};

const getCatchRate = () => {
  if (!species.value) return 'Unknown';
  const rate = species.value.capture_rate;
  const percentage = ((rate / 255) * 100).toFixed(1);
  return `${rate} (${percentage}%)`;
};

const getGrowthRate = () => {
  if (!species.value) return 'Unknown';
  return species.value.growth_rate.name.replace('-', ' ');
};

const getBaseHappiness = () => {
  if (!species.value) return 'Unknown';
  return species.value.base_happiness;
};

const getEggGroups = () => {
  if (!species.value) return 'Unknown';
  return species.value.egg_groups
    .map(group => group.name.charAt(0).toUpperCase() + group.name.slice(1))
    .join(', ');
};

const getHatchSteps = () => {
  if (!species.value) return 'Unknown';
  const cycles = species.value.hatch_counter;
  const minSteps = (cycles + 1) * 255;
  const maxSteps = (cycles + 1) * 257;
  return `${minSteps.toLocaleString()}–${maxSteps.toLocaleString()} (${cycles} cycles)`;
};

const getGenderRatio = () => {
  if (!species.value) return 'Unknown';
  if (species.value.gender_rate === -1) return 'Genderless';
  const femaleRate = (species.value.gender_rate / 8) * 100;
  const maleRate = 100 - femaleRate;
  return `${maleRate}% male, ${femaleRate}% female`;
};

const getFlavorText = () => {
  if (!species.value) return '';
  const englishEntry = species.value.flavor_text_entries.find(
    entry => entry.language.name === 'en'
  );
  return englishEntry ? englishEntry.flavor_text.replace(/\f/g, ' ') : '';
};

const getGenus = () => {
  if (!species.value) return '';
  const englishGenus = species.value.genera.find(genus => genus.language.name === 'en');
  return englishGenus ? englishGenus.genus : '';
};

const getCombinedTypeEffectiveness = () => {
  if (!pokemon.value) return {};

  const types = pokemon.value.types.map(t => t.type.name);
  const combined = {};

  Object.keys(typeEffectiveness).forEach(attackingType => {
    let multiplier = 1;
    types.forEach(defendingType => {
      if (
        typeEffectiveness[defendingType] &&
        typeEffectiveness[defendingType][attackingType] !== undefined
      ) {
        multiplier *= typeEffectiveness[defendingType][attackingType];
      }
    });
    if (multiplier !== 1) {
      combined[attackingType] = multiplier;
    }
  });

  return combined;
};

const groupedTypeEffectiveness = computed(() => {
  const effectiveness = getCombinedTypeEffectiveness();
  const groups = {
    '0×': [],
    '0.25×': [],
    '0.5×': [],
    '2×': [],
    '4×': [],
  };

  Object.entries(effectiveness).forEach(([type, multiplier]) => {
    if (multiplier === 0) groups['0×'].push(type);
    else if (multiplier === 0.25) groups['0.25×'].push(type);
    else if (multiplier === 0.5) groups['0.5×'].push(type);
    else if (multiplier === 2) groups['2×'].push(type);
    else if (multiplier === 4) groups['4×'].push(type);
  });

  return Object.entries(groups).filter(([, types]) => types.length > 0);
});

const formatFormName = (formName, baseName) => {
  if (!formName || formName === baseName) return 'Normal';

  const formSuffix = formName.replace(baseName + '-', '');

  const formNames = {
    mega: 'Mega',
    'mega-x': 'Mega X',
    'mega-y': 'Mega Y',
    alola: 'Alolan',
    galar: 'Galarian',
    hisui: 'Hisuian',
    paldea: 'Paldean',
    gmax: 'Gigantamax',
    eternamax: 'Eternamax',
    primal: 'Primal',
    origin: 'Origin',
    therian: 'Therian',
    white: 'White',
    black: 'Black',
    sunshine: 'Sunshine',
    rainy: 'Rainy',
    snowy: 'Snowy',
    sandy: 'Sandy',
    trash: 'Trash',
    heat: 'Heat',
    wash: 'Wash',
    frost: 'Frost',
    fan: 'Fan',
    mow: 'Mow',
    hangry: 'Hangry',
    dusk: 'Dusk',
    dawn: 'Dawn',
    ultra: 'Ultra',
  };

  return (
    formNames[formSuffix] ||
    formSuffix
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  );
};

const loadAbilityDetails = async abilities => {
  for (const ability of abilities) {
    if (!abilityDetails.value[ability.ability.name]) {
      try {
        const response = await pokeAPI.getAbility(ability.ability.name);
        const englishEffect = response.effect_entries.find(e => e.language.name === 'en');
        const englishFlavorText = response.flavor_text_entries.find(e => e.language.name === 'en');

        abilityDetails.value[ability.ability.name] = {
          effect: englishEffect?.effect || '',
          shortEffect: englishEffect?.short_effect || '',
          flavorText: englishFlavorText?.flavor_text || '',
        };
      } catch (error) {
        console.error(`Failed to load ability ${ability.ability.name}:`, error);
      }
    }
  }
};

const loadMoveDetails = async moveName => {
  if (!moveDetails.value[moveName]) {
    try {
      const response = await pokeAPI.getMove(moveName);
      moveDetails.value[moveName] = {
        type: response.type.name,
        damageClass: response.damage_class.name,
        power: response.power,
        accuracy: response.accuracy,
        pp: response.pp,
        priority: response.priority,
        effectChance: response.effect_chance,
        description:
          response.effect_entries.find(e => e.language.name === 'en')?.short_effect || '',
      };
    } catch (error) {
      console.error(`Failed to load move ${moveName}:`, error);
      moveDetails.value[moveName] = { type: 'normal' };
    }
  }
  return moveDetails.value[moveName];
};

const loadMovesForDisplay = async moves => {
  loadingMoves.value = true;
  const movePromises = moves.map(move => loadMoveDetails(move.name));
  await Promise.all(movePromises);
  loadingMoves.value = false;
};

const loadPokemonData = async () => {
  try {
    isLoading.value = true;
    error.value = null;

    const quickInfo = pokemonStore.getPokemonById(pokemonId.value);
    if (quickInfo) {
      pokemon.value = {
        id: quickInfo.id,
        name: quickInfo.name,
        types: quickInfo.types.map(type => ({ type: { name: type } })),
        sprites: {
          other: {
            'official-artwork': {
              front_default: quickInfo.sprite,
            },
          },
        },
      };
    }

    const detailsData = await pokemonStore.loadPokemonDetails(pokemonId.value);
    pokemon.value = detailsData;

    // For form Pokemon (ID > 10000), we need to get the species from the Pokemon data
    let speciesId = pokemonId.value;
    if (pokemon.value.species) {
      speciesId = pokemon.value.species.url.split('/').filter(Boolean).pop();
    }

    species.value = pokemonStore.getPokemonSpecies(speciesId);
    evolutionChain.value = pokemonStore.getEvolutionChain(speciesId);

    // Load forms if available
    if (species.value && species.value.varieties && species.value.varieties.length > 1) {
      pokemonForms.value = species.value.varieties.map(variety => ({
        name: variety.pokemon.name,
        url: variety.pokemon.url,
        isDefault: variety.is_default,
        displayName: formatFormName(variety.pokemon.name, species.value.name),
      }));

      // Set current form as selected
      selectedForm.value =
        pokemonForms.value.find(form => form.name === pokemon.value.name) ||
        pokemonForms.value.find(form => form.isDefault);
    } else {
      // Single form Pokemon
      pokemonForms.value = [
        {
          name: pokemon.value.name,
          url: `https://pokeapi.co/api/v2/pokemon/${pokemon.value.id}/`,
          isDefault: true,
          displayName: 'Normal',
        },
      ];
      selectedForm.value = pokemonForms.value[0];
    }

    // Load ability details
    if (pokemon.value.abilities) {
      await loadAbilityDetails(pokemon.value.abilities);
    }

    // Load evolution data
    await loadEvolutions();

    // Load initial move details after pokemon is loaded
    try {
      if (pokemon.value && pokemon.value.moves && groupedMoves.value) {
        const moves = groupedMoves.value;
        const initialMoves = [
          ...moves.levelUp.slice(0, 15),
          ...moves.machine.slice(0, 10),
          ...moves.egg.slice(0, 10),
        ];
        await loadMovesForDisplay(initialMoves);
      }
    } catch (moveError) {
      console.error('Error loading move details:', moveError);
      // Don't fail the entire load if moves fail
    }
  } catch (err) {
    error.value = 'Failed to load Pokémon data: ' + (err.message || 'Unknown error');
    console.error('Error loading Pokemon:', err);
    console.error('Error details:', {
      pokemonId: pokemonId.value,
      errorMessage: err.message,
      errorStack: err.stack,
    });
  } finally {
    isLoading.value = false;
  }
};

const goBack = () => {
  router.push('/pokedex');
};

const navigateToPokemon = id => {
  router.push(`/pokemon/${id}`);
};

const switchForm = async form => {
  if (loadingForm.value || form.name === selectedForm.value?.name) return;

  try {
    loadingForm.value = true;
    selectedForm.value = form;

    // Use the form name directly since it's the correct identifier
    const formData = await pokemonStore.loadPokemonDetails(form.name);

    // Update pokemon data while keeping species information
    pokemon.value = formData;
  } catch (error) {
    console.error('Error loading form:', error);
    // Revert to previous form on error
    selectedForm.value = pokemonForms.value.find(f => f.name === pokemon.value.name);
  } finally {
    loadingForm.value = false;
  }
};

const goToPrevious = () => {
  // Use species ID for navigation, not form ID
  const currentSpeciesId = species.value?.id || parseInt(pokemonId.value);
  const prevId = Math.max(1, currentSpeciesId - 1);
  router.push(`/pokemon/${prevId}`);
};

const goToNext = () => {
  // Use species ID for navigation, not form ID
  const currentSpeciesId = species.value?.id || parseInt(pokemonId.value);
  const nextId = currentSpeciesId + 1;
  router.push(`/pokemon/${nextId}`);
};

const getEvolutionData = async chain => {
  const evolutions = [];

  const processChain = async chainData => {
    const speciesId = chainData.species.url.split('/').filter(Boolean).pop();
    const pokemonData =
      pokemonStore.getPokemonById(speciesId) || (await loadEvolutionPokemon(speciesId));

    evolutions.push({
      id: speciesId,
      name: chainData.species.name,
      trigger: chainData.evolution_details[0]?.trigger?.name || null,
      minLevel: chainData.evolution_details[0]?.min_level || null,
      types: pokemonData?.types || [],
    });

    if (chainData.evolves_to.length > 0) {
      for (const evolution of chainData.evolves_to) {
        await processChain(evolution);
      }
    }
  };

  if (chain) {
    await processChain(chain.chain);
  }

  return evolutions;
};

const loadEvolutionPokemon = async id => {
  try {
    const data = await pokeAPI.getPokemonByName(id);
    return {
      id: data.id,
      name: data.name,
      types: data.types.map(t => t.type.name),
    };
  } catch (error) {
    console.error(`Failed to load evolution pokemon ${id}:`, error);
    return null;
  }
};

const formatEvolutionTrigger = trigger => {
  const triggers = {
    'level-up': 'Level up',
    trade: 'Trade',
    'use-item': 'Use item',
    shed: 'Empty spot in party',
    spin: 'Spin',
    'tower-of-darkness': 'Tower of Darkness',
    'tower-of-waters': 'Tower of Waters',
    'three-critical-hits': '3 critical hits',
    'take-damage': 'Take damage',
  };
  return triggers[trigger] || trigger.replace('-', ' ');
};

const getDamageClassIcon = damageClass => {
  const icons = {
    physical: '💥',
    special: '✨',
    status: '📊',
  };
  return icons[damageClass] || '—';
};

const expandTMMoves = async () => {
  showAllTMMoves.value = true;
  await loadMovesForDisplay(groupedMoves.value.machine);
};

const expandEggMoves = async () => {
  showAllEggMoves.value = true;
  await loadMovesForDisplay(groupedMoves.value.egg);
};

const evolutions = ref([]);

const loadEvolutions = async () => {
  if (!evolutionChain.value) return;
  try {
    evolutions.value = await getEvolutionData(evolutionChain.value);
  } catch (error) {
    console.error('Error loading evolution data:', error);
    evolutions.value = [];
  }
};

watch(evolutionChain, async newChain => {
  if (newChain) {
    await loadEvolutions();
  }
});

const groupedMoves = computed(() => {
  if (!pokemon.value) return { levelUp: [], machine: [], egg: [] };

  const moves = {
    levelUp: [],
    machine: [],
    egg: [],
  };

  pokemon.value.moves.forEach(move => {
    const versionDetails = move.version_group_details[move.version_group_details.length - 1];

    if (versionDetails.move_learn_method.name === 'level-up') {
      moves.levelUp.push({
        name: move.move.name,
        level: versionDetails.level_learned_at,
      });
    } else if (versionDetails.move_learn_method.name === 'machine') {
      moves.machine.push({
        name: move.move.name,
      });
    } else if (versionDetails.move_learn_method.name === 'egg') {
      moves.egg.push({
        name: move.move.name,
      });
    }
  });

  moves.levelUp.sort((a, b) => a.level - b.level);

  return moves;
});

watch(
  () => route.params.id,
  newId => {
    if (newId) {
      // Reset forms when navigating to a different Pokemon
      pokemonForms.value = [];
      selectedForm.value = null;
      showAllTMMoves.value = false;
      showAllEggMoves.value = false;
      moveDetails.value = {};
      loadPokemonData();
    }
  }
);

onMounted(() => {
  loadPokemonData();
});
</script>

<template>
  <div class="pokemon-detail-container min-h-screen bg-gray-50">
    <div v-if="isLoading && !pokemon" class="container mx-auto px-4 py-8">
      <PokemonDetailSkeleton />
    </div>

    <div v-else-if="error" class="text-center py-16">
      <p class="text-xl text-red-600">{{ error }}</p>
      <button
        @click="goBack"
        class="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Back to Pokédex
      </button>
    </div>

    <div v-else-if="pokemon" class="container mx-auto px-4 py-8 max-w-6xl">
      <!-- Navigation -->
      <div class="flex justify-between items-center mb-[16px]">
        <button
          @click="goBack"
          class="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            ></path>
          </svg>
          Pokédex
        </button>

        <div class="flex gap-4">
          <button
            @click="goToPrevious"
            :disabled="pokemon.id <= 1"
            class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <button
            @click="goToNext"
            class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          >
            Next →
          </button>
        </div>
      </div>

      <!-- Pokemon Header - Keeping your nice design -->
      <div class="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
        <!-- Form Tabs -->
        <div v-if="pokemonForms.length > 1" class="bg-gray-100 border-b">
          <div class="flex overflow-x-auto">
            <button
              v-for="form in pokemonForms"
              :key="form.name"
              @click="switchForm(form)"
              :class="[
                'px-6 py-3 font-medium transition-colors whitespace-nowrap',
                selectedForm?.name === form.name
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200',
              ]"
              :disabled="loadingForm"
            >
              {{ form.displayName }}
            </button>
          </div>
        </div>

        <div
          class="pokemon-header p-8 text-white relative"
          :style="{ backgroundColor: getTypeColor(pokemon.types[0].type.name) }"
        >
          <div class="flex flex-col md:flex-row items-center justify-between">
            <div class="text-center md:text-left mb-6 md:mb-0">
              <h1 class="text-4xl font-bold capitalize mb-2">
                {{ selectedForm && pokemonForms.length > 1 ? selectedForm.displayName + ' ' : ''
                }}{{ species?.name || pokemon.name }}
              </h1>
              <p v-if="species" class="text-xl opacity-90">{{ getGenus() }}</p>
              <p class="text-2xl font-semibold mt-2">{{ formattedId }}</p>
              <div class="flex gap-3 mt-4 justify-center md:justify-start">
                <span
                  v-for="type in pokemon.types"
                  :key="type.type.name"
                  class="px-4 py-2 rounded-full bg-white bg-opacity-30 backdrop-blur-sm capitalize shadow-xl"
                  :style="{ backgroundColor: getTypeColor(type.type.name), opacity: 0.8 }"
                >
                  {{ type.type.name }}
                </span>
              </div>
            </div>
            <div class="pokemon-image relative">
              <img
                :src="
                  pokemon.sprites.other['official-artwork'].front_default ||
                  pokemon.sprites.other.home.front_default ||
                  pokemon.sprites.front_default
                "
                :alt="pokemon.name"
                class="w-64 h-64 object-contain transition-opacity duration-300"
                :class="{ 'opacity-50': loadingForm }"
              />
              <div v-if="loadingForm" class="absolute inset-0 flex items-center justify-center">
                <svg
                  class="animate-spin h-12 w-12 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6" :class="{ 'opacity-75': loadingForm }">
        <!-- Left Column - Pokédex Data -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow p-6 mb-6">
            <h2 class="text-xl font-bold mb-4">Pokédex Data</h2>
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-gray-600">National №</dt>
                <dd class="font-medium">{{ formattedId }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-600">Type</dt>
                <dd class="flex gap-2">
                  <span
                    v-for="type in pokemon.types"
                    :key="type.type.name"
                    class="px-3 py-1 rounded text-white text-sm capitalize"
                    :style="{ backgroundColor: getTypeColor(type.type.name) }"
                  >
                    {{ type.type.name }}
                  </span>
                </dd>
              </div>
              <div v-if="species" class="flex justify-between">
                <dt class="text-gray-600">Species</dt>
                <dd class="font-medium">{{ getGenus() }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-600">Height</dt>
                <dd class="font-medium">{{ formatHeight(pokemon.height) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-600">Weight</dt>
                <dd class="font-medium">{{ formatWeight(pokemon.weight) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-600">Abilities</dt>
                <dd class="text-right">
                  <div v-for="ability in pokemon.abilities" :key="ability.ability.name">
                    <span class="capitalize">{{ ability.ability.name.replace('-', ' ') }}</span>
                    <span v-if="ability.is_hidden" class="text-xs text-gray-500"> (hidden)</span>
                  </div>
                </dd>
              </div>
            </dl>
          </div>

          <!-- Type Effectiveness -->
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-bold mb-4">Type Effectiveness</h2>
            <div class="flex flex-col gap-2">
              <div
                v-for="[multiplier, types] in groupedTypeEffectiveness"
                :key="multiplier"
                class="flex items-center gap-2"
              >
                <span
                  class="text-sm font-medium w-12"
                  :class="{
                    'text-red-600': multiplier === '2×' || multiplier === '4×',
                    'text-green-600': multiplier === '0.5×' || multiplier === '0.25×',
                    'text-gray-500': multiplier === '0×',
                  }"
                  >{{ multiplier }}</span
                >
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="type in types"
                    :key="type"
                    class="px-2 py-1 rounded text-white text-xs capitalize"
                    :style="{ backgroundColor: getTypeColor(type) }"
                  >
                    {{ type }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Training -->
          <div class="bg-white rounded-lg shadow p-6 mb-6">
            <h2 class="text-xl font-bold mb-4">Training</h2>
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-gray-600">EV Yield</dt>
                <dd class="font-medium">{{ getEVYield() }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-600">Catch Rate</dt>
                <dd class="font-medium">{{ getCatchRate() }}</dd>
              </div>
              <div v-if="species" class="flex justify-between">
                <dt class="text-gray-600">Base Happiness</dt>
                <dd class="font-medium">{{ getBaseHappiness() }}</dd>
              </div>
              <div v-if="species" class="flex justify-between">
                <dt class="text-gray-600">Growth Rate</dt>
                <dd class="font-medium capitalize">{{ getGrowthRate() }}</dd>
              </div>
            </dl>
          </div>

          <!-- Breeding -->
          <div v-if="species" class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-bold mb-4">Breeding</h2>
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-gray-600">Egg Groups</dt>
                <dd class="font-medium">{{ getEggGroups() }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-600">Gender</dt>
                <dd class="font-medium">{{ getGenderRatio() }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-600">Egg Cycles</dt>
                <dd class="font-medium text-right">{{ getHatchSteps() }}</dd>
              </div>
            </dl>
          </div>

          <!-- Abilities -->
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-bold mb-4">Abilities</h2>
            <div class="space-y-4">
              <div
                v-for="ability in pokemon.abilities"
                :key="ability.ability.name"
                class="border-b last:border-0 pb-3 last:pb-0"
              >
                <h3 class="font-semibold capitalize mb-1">
                  {{ ability.ability.name.replace('-', ' ') }}
                  <span v-if="ability.is_hidden" class="text-sm text-gray-500 font-normal"
                    >(Hidden Ability)</span
                  >
                </h3>
                <p v-if="abilityDetails[ability.ability.name]" class="text-sm text-gray-700">
                  {{
                    abilityDetails[ability.ability.name].shortEffect ||
                    abilityDetails[ability.ability.name].flavorText
                  }}
                </p>
                <p v-else class="text-sm text-gray-500 italic">Loading ability details...</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column - Stats and Evolution -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Base Stats -->
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-bold mb-4">Base Stats</h2>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="text-left border-b">
                    <th class="pb-2">Stat</th>
                    <th class="pb-2 text-center">Base</th>
                    <th class="pb-2 text-center">Min</th>
                    <th class="pb-2 text-center">Max</th>
                    <th class="pb-2 w-1/3"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="stat in pokemon.stats" :key="stat.stat.name" class="border-b">
                    <td class="py-3 font-medium">{{ statNames[stat.stat.name] }}</td>
                    <td class="py-3 text-center font-bold">{{ stat.base_stat }}</td>
                    <td class="py-3 text-center text-sm text-gray-600">
                      {{ calculateMinMaxStats(stat.base_stat, stat.stat.name).min }}
                    </td>
                    <td class="py-3 text-center text-sm text-gray-600">
                      {{ calculateMinMaxStats(stat.base_stat, stat.stat.name).max }}
                    </td>
                    <td class="py-3">
                      <div class="w-full bg-gray-200 rounded-full h-4">
                        <div
                          class="h-full rounded-full transition-all duration-1000"
                          :style="{
                            width: getStatPercentage(stat.base_stat) + '%',
                            backgroundColor: getStatBarColor(stat.stat.name),
                          }"
                        ></div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td class="py-3 font-bold">Total</td>
                    <td class="py-3 text-center font-bold text-lg">
                      {{ pokemon.stats.reduce((sum, stat) => sum + stat.base_stat, 0) }}
                    </td>
                    <td colspan="3"></td>
                  </tr>
                </tbody>
              </table>
              <p class="text-xs text-gray-500 mt-2">
                Min/Max values are calculated for level 100 Pokémon
              </p>
            </div>
          </div>

          <!-- Evolution Chart -->
          <div v-if="evolutions.length > 1" class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-bold mb-4">Evolution Chart</h2>
            <div class="overflow-x-auto">
              <div class="flex items-center justify-center min-w-max py-4">
                <div v-for="(evo, index) in evolutions" :key="evo.id" class="flex items-center">
                  <!-- Pokemon Card -->
                  <div
                    @click="navigateToPokemon(evo.id)"
                    class="cursor-pointer hover:transform hover:scale-105 transition-all p-4 rounded-lg hover:bg-gray-50 hover:shadow-md text-center"
                  >
                    <img
                      :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${evo.id}.png`"
                      :alt="evo.name"
                      class="w-32 h-32 object-contain mx-auto"
                    />
                    <p class="mt-2 font-semibold capitalize text-lg">{{ evo.name }}</p>
                    <p class="text-sm text-gray-600">{{ formatPokemonId(evo.id) }}</p>
                    <div v-if="evo.types" class="flex gap-1 justify-center mt-2">
                      <span
                        v-for="type in evo.types"
                        :key="type"
                        class="px-2 py-1 rounded text-white text-xs capitalize"
                        :style="{ backgroundColor: getTypeColor(type) }"
                      >
                        {{ type }}
                      </span>
                    </div>
                  </div>

                  <!-- Evolution Arrow -->
                  <div v-if="index < evolutions.length - 1" class="px-4">
                    <div class="flex flex-col items-center">
                      <svg
                        class="w-12 h-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        ></path>
                      </svg>
                      <div class="text-center mt-1">
                        <p
                          v-if="evolutions[index + 1].minLevel"
                          class="text-sm font-medium text-gray-700"
                        >
                          Lv. {{ evolutions[index + 1].minLevel }}
                        </p>
                        <p
                          v-else-if="evolutions[index + 1].trigger"
                          class="text-xs text-gray-600 capitalize"
                        >
                          {{ formatEvolutionTrigger(evolutions[index + 1].trigger) }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Pokédex Entries -->
          <div v-if="species" class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-bold mb-4">Pokédex Entries</h2>
            <p class="text-gray-700">{{ getFlavorText() }}</p>
          </div>

          <!-- Moves -->
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-bold mb-4">Moves</h2>

            <!-- Level-up Moves -->
            <div class="mb-6">
              <h3 class="text-lg font-semibold mb-3">Moves learned by level up</h3>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-left border-b">
                      <th class="pb-2">Level</th>
                      <th class="pb-2">Move</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="move in groupedMoves.levelUp.slice(0, 15)"
                      :key="move.name"
                      class="border-b hover:bg-gray-50"
                    >
                      <td class="py-2">{{ move.level || '—' }}</td>
                      <td class="py-2">
                        <div class="flex items-center gap-2">
                          <span class="capitalize">{{ move.name.replace('-', ' ') }}</span>
                          <span
                            v-if="moveDetails && moveDetails[move.name]"
                            class="px-2 py-0.5 rounded text-white text-xs capitalize"
                            :style="{ backgroundColor: getTypeColor(moveDetails[move.name].type) }"
                          >
                            {{ moveDetails[move.name].type }}
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p v-if="groupedMoves.levelUp.length > 15" class="text-sm text-gray-500 mt-2">
                  And {{ groupedMoves.levelUp.length - 15 }} more...
                </p>
              </div>
            </div>

            <!-- TM Moves -->
            <div v-if="groupedMoves.machine.length > 0" class="mb-6">
              <h3 class="text-lg font-semibold mb-3">Moves learned by TM</h3>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-left border-b">
                      <th class="pb-2">Move</th>
                      <th class="pb-2">Type</th>
                      <th class="pb-2">Cat.</th>
                      <th class="pb-2 text-center">Power</th>
                      <th class="pb-2 text-center">Acc.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="move in showAllTMMoves
                        ? groupedMoves.machine
                        : groupedMoves.machine.slice(0, 10)"
                      :key="move.name"
                      class="border-b hover:bg-gray-50"
                    >
                      <td class="py-2 capitalize">{{ move.name.replace('-', ' ') }}</td>
                      <td class="py-2">
                        <span
                          v-if="moveDetails && moveDetails[move.name]"
                          class="px-2 py-1 rounded text-white text-xs capitalize"
                          :style="{ backgroundColor: getTypeColor(moveDetails[move.name].type) }"
                        >
                          {{ moveDetails[move.name].type }}
                        </span>
                        <span v-else class="text-gray-400">...</span>
                      </td>
                      <td class="py-2">
                        <span v-if="moveDetails && moveDetails[move.name]" class="capitalize">
                          {{ getDamageClassIcon(moveDetails[move.name].damageClass) }}
                        </span>
                      </td>
                      <td class="py-2 text-center">
                        {{
                          moveDetails && moveDetails[move.name]
                            ? moveDetails[move.name].power || '—'
                            : '—'
                        }}
                      </td>
                      <td class="py-2 text-center">
                        {{
                          moveDetails && moveDetails[move.name]
                            ? moveDetails[move.name].accuracy || '—'
                            : '—'
                        }}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <button
                  v-if="groupedMoves.machine.length > 10 && !showAllTMMoves"
                  @click="expandTMMoves"
                  class="text-sm text-blue-600 hover:text-blue-800 mt-2 font-medium"
                >
                  And {{ groupedMoves.machine.length - 10 }} more...
                </button>
                <button
                  v-else-if="showAllTMMoves && groupedMoves.machine.length > 10"
                  @click="showAllTMMoves = false"
                  class="text-sm text-blue-600 hover:text-blue-800 mt-2 font-medium"
                >
                  Show less
                </button>
              </div>
            </div>

            <!-- Egg Moves -->
            <div v-if="groupedMoves.egg.length > 0">
              <h3 class="text-lg font-semibold mb-3">Egg Moves</h3>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-left border-b">
                      <th class="pb-2">Move</th>
                      <th class="pb-2">Type</th>
                      <th class="pb-2">Cat.</th>
                      <th class="pb-2 text-center">Power</th>
                      <th class="pb-2 text-center">Acc.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="move in showAllEggMoves
                        ? groupedMoves.egg
                        : groupedMoves.egg.slice(0, 10)"
                      :key="move.name"
                      class="border-b hover:bg-gray-50"
                    >
                      <td class="py-2 capitalize">{{ move.name.replace('-', ' ') }}</td>
                      <td class="py-2">
                        <span
                          v-if="moveDetails && moveDetails[move.name]"
                          class="px-2 py-1 rounded text-white text-xs capitalize"
                          :style="{ backgroundColor: getTypeColor(moveDetails[move.name].type) }"
                        >
                          {{ moveDetails[move.name].type }}
                        </span>
                        <span v-else class="text-gray-400">...</span>
                      </td>
                      <td class="py-2">
                        <span v-if="moveDetails && moveDetails[move.name]" class="capitalize">
                          {{ getDamageClassIcon(moveDetails[move.name].damageClass) }}
                        </span>
                      </td>
                      <td class="py-2 text-center">
                        {{
                          moveDetails && moveDetails[move.name]
                            ? moveDetails[move.name].power || '—'
                            : '—'
                        }}
                      </td>
                      <td class="py-2 text-center">
                        {{
                          moveDetails && moveDetails[move.name]
                            ? moveDetails[move.name].accuracy || '—'
                            : '—'
                        }}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <button
                  v-if="groupedMoves.egg.length > 10 && !showAllEggMoves"
                  @click="expandEggMoves"
                  class="text-sm text-blue-600 hover:text-blue-800 mt-2 font-medium"
                >
                  And {{ groupedMoves.egg.length - 10 }} more...
                </button>
                <button
                  v-else-if="showAllEggMoves && groupedMoves.egg.length > 10"
                  @click="showAllEggMoves = false"
                  class="text-sm text-blue-600 hover:text-blue-800 mt-2 font-medium"
                >
                  Show less
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pokemon-header {
  background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg opacity='0.1'%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='white' stroke-width='2'/%3E%3C/g%3E%3C/svg%3E");
  background-size: 200px 200px;
  background-position: right center;
  background-repeat: no-repeat;
}

.stat-fill {
  animation: fillBar 1s ease-out;
}

@keyframes fillBar {
  from {
    width: 0;
  }
}
</style>
