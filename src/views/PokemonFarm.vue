<template>
  <div class="pokemon-farm-container h-screen flex flex-col overflow-hidden bg-gray-50">
    <!-- Header -->
    <header class="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-200 z-30">
      <div class="container mx-auto px-4 py-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span class="text-3xl">🌾</span>
              Pokemon Farm
            </h1>
          </div>

          <!-- Game Time -->
          <div class="text-sm text-gray-600">
            <div class="font-semibold">{{ currentTime }}</div>
            <div class="text-xs">{{ currentSeason }} - {{ currentWeather }}</div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Game Area -->
    <div class="flex h-[calc(100vh-60px)]">
      <!-- 3D Canvas -->
      <div class="flex-1 relative">
        <canvas ref="babylonCanvas" class="w-full h-full"></canvas>

        <!-- Loading Overlay -->
        <div v-if="isLoading" class="absolute inset-0 bg-white/80 flex items-center justify-center">
          <div class="text-center">
            <div
              class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"
            ></div>
            <p class="text-gray-600">Loading farm...</p>
          </div>
        </div>

        <!-- Planting Preview Tooltip -->
        <div
          v-if="hoveredTile && hoveredTile.type === 'empty' && hoveredTile.canPlant && selectedSeed"
          class="absolute bg-green-50/95 backdrop-blur-sm rounded-lg shadow-xl p-2 pointer-events-none z-40"
          :style="{
            left: `${hoveredTile.screenX}px`,
            top: `${hoveredTile.screenY - 60}px`,
            transform: 'translateX(-50%)'
          }"
        >
          <div class="flex items-center gap-2">
            <span class="text-lg">{{ selectedSeed.icon }}</span>
            <div class="text-xs">
              <div class="font-semibold text-gray-800">Plant {{ selectedSeed.displayName }}</div>
              <div class="text-gray-600">Click to plant</div>
            </div>
          </div>
        </div>

        <!-- Crop Info Tooltip -->
        <div
          v-if="hoveredTile && hoveredTile.type === 'crop'"
          class="absolute bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-3 pointer-events-none z-40"
          :style="{
            left: `${hoveredTile.screenX}px`,
            top: `${hoveredTile.screenY - 80}px`
          }"
        >
          <div class="text-sm font-semibold text-gray-800">{{ hoveredTile.cropType.replace(' Seeds', '') }}</div>
          <div v-if="hoveredTile.growth >= 100" class="mt-1">
            <div class="text-green-600 font-bold">Ready to Harvest!</div>
          </div>
          <div v-else class="mt-1 space-y-1">
            <div class="flex items-center gap-2">
              <div class="w-24 bg-gray-200 rounded-full h-2">
                <div 
                  class="bg-green-500 h-full rounded-full transition-all"
                  :style="{ width: `${hoveredTile.growth}%` }"
                ></div>
              </div>
              <span class="text-xs text-gray-600">{{ Math.floor(hoveredTile.growth) }}%</span>
            </div>
            <div class="text-xs text-gray-500">
              Time to harvest: {{ getTimeToHarvest(hoveredTile.growth) }}
            </div>
            <div v-if="!hoveredTile.watered" class="text-xs text-orange-500">
              Needs water 💧
            </div>
          </div>
        </div>

        <!-- Harvest Button -->
        <div
          v-if="hoveredTile && hoveredTile.type === 'crop' && hoveredTile.growth >= 100"
          class="absolute z-50 pointer-events-none"
          :style="{
            left: `${hoveredTile.screenX - 40}px`,
            top: `${hoveredTile.screenY - 120}px`
          }"
        >
          <button
            @click.stop="harvestCrop(hoveredTile.tile)"
            @mousedown.stop
            class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg shadow-lg transition-all transform hover:scale-105 flex items-center gap-1 pointer-events-auto cursor-pointer"
          >
            <span>🌾</span>
            <span class="text-sm font-semibold">Harvest</span>
          </button>
        </div>
        

        <!-- HUD Overlay -->
        <div class="absolute top-4 left-4 space-y-2">
          <!-- Quick Actions -->
          <div class="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div class="flex gap-2">
              <button
                v-for="tool in tools"
                :key="tool.id"
                @click="selectTool(tool.id)"
                :class="[
                  'relative p-2 rounded-lg transition-all',
                  selectedTool === tool.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
                ]"
                :title="tool.name"
              >
                <span class="text-xl">{{ tool.icon }}</span>
                <!-- Show selected seed badge for plant tool -->
                <div
                  v-if="tool.id === 'plant' && selectedTool === 'plant' && selectedSeed"
                  class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <span class="text-xs">{{ selectedSeed.icon }}</span>
                </div>
              </button>
            </div>
            <!-- Selected seed info -->
            <div v-if="selectedTool === 'plant' && selectedSeed" class="mt-2 text-xs text-gray-600">
              <div class="font-medium">{{ selectedSeed.displayName }} ({{ selectedSeed.quantity }})</div>
            </div>
          </div>

          <!-- Selected Pokemon Info -->
          <div v-if="selectedPokemon" class="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div class="flex items-center gap-3">
              <img
                :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${selectedPokemon.species}.png`"
                :alt="selectedPokemon.nickname"
                class="w-12 h-12"
              />
              <div>
                <h3 class="font-semibold text-gray-800">{{ selectedPokemon.nickname }}</h3>
                <div class="flex gap-2 text-xs">
                  <span class="text-red-500">❤️ {{ selectedPokemon.happiness }}/100</span>
                  <span class="text-orange-500">🍖 {{ selectedPokemon.hunger }}/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Seed Selection Menu -->
        <div
          v-if="selectedTool === 'plant' && availableSeeds.length > 0"
          class="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-4 z-40"
        >
          <h3 class="text-sm font-bold text-gray-800 mb-3 text-center">Select Seed to Plant</h3>
          <div class="flex gap-2">
            <button
              v-for="seed in availableSeeds"
              :key="seed.id"
              @click="selectedSeed = seed"
              :class="[
                'relative p-3 rounded-lg transition-all transform hover:scale-105',
                selectedSeed?.id === seed.id
                  ? 'bg-green-100 ring-2 ring-green-500'
                  : 'bg-gray-50 hover:bg-gray-100'
              ]"
            >
              <div class="text-center">
                <div class="text-2xl mb-1">{{ seed.icon }}</div>
                <div class="text-xs font-medium text-gray-700">{{ seed.displayName }}</div>
                <div class="text-xs text-gray-500">x{{ seed.quantity }}</div>
              </div>
              <div
                v-if="selectedSeed?.id === seed.id"
                class="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
              >
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
              </div>
            </button>
          </div>
          <div v-if="selectedSeed" class="mt-3 text-center">
            <div class="text-xs text-gray-600">
              Growth Time: {{ getSeedGrowthTime(selectedSeed.name) }} | 
              Yield: {{ getSeedYield(selectedSeed.name) }}
            </div>
          </div>
        </div>

        <!-- Building Menu and Island Expansion -->
        <div class="absolute top-4 right-4 space-y-2">
          <!-- Island Expansion Button -->
          <div class="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div class="text-center">
              <div class="text-sm font-bold text-gray-800 mb-1">Island Size: {{ farmStore.farm.islandSize }}m</div>
              <div v-if="getNextExpansion" class="text-xs text-gray-600 mb-2">Next: {{ getNextExpansion.name }}</div>
              <div v-else class="text-xs text-green-600 mb-2">Maximum Size Reached!</div>
              <button
                v-if="getNextExpansion"
                @click="expandIsland"
                :disabled="playerData.currency < getNextExpansion.cost"
                :class="[
                  'w-full px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-2',
                  playerData.currency >= getNextExpansion.cost
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                ]"
              >
                <span>🏝️</span>
                <span class="font-semibold">{{ getNextExpansion.cost }} 🪙</span>
              </button>
            </div>
          </div>
          
          <!-- Build Menu Button -->
          <button
            @click="showBuildMenu = !showBuildMenu"
            class="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg hover:shadow-xl transition-all"
          >
            <span class="text-xl">🏗️</span>
          </button>

          <transition name="slide-fade">
            <div
              v-if="showBuildMenu"
              class="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl p-4"
            >
              <h3 class="font-bold text-gray-800 mb-3">Build Menu</h3>
              <div class="space-y-2">
                <button
                  v-for="building in buildings"
                  :key="building.id"
                  @click="selectBuilding(building)"
                  :disabled="playerData.currency < building.cost"
                  :class="[
                    'w-full text-left p-3 rounded-lg transition-all',
                    playerData.currency >= building.cost
                      ? 'bg-gray-50 hover:bg-gray-100'
                      : 'bg-gray-50 opacity-50 cursor-not-allowed',
                  ]"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="text-xl">{{ building.icon }}</span>
                      <span class="font-medium">{{ building.name }}</span>
                    </div>
                    <span class="text-sm text-gray-600">🪙 {{ building.cost }}</span>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">{{ building.description }}</p>
                </button>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <!-- Side Panel -->
      <div class="w-80 bg-white border-l border-gray-200 overflow-y-auto">
        <!-- Farm Overview Tree -->
        <div class="p-4 border-b border-gray-200 bg-gradient-to-br from-green-50 to-blue-50">
          <h2 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>🌳</span> Farm Overview
          </h2>
          <div class="space-y-1 bg-white/50 rounded-lg p-2">
            <!-- Farm Section -->
            <div>
              <button
                @click="treeExpanded.farm = !treeExpanded.farm"
                class="w-full flex items-center gap-2 p-2 rounded hover:bg-green-100/50 text-left transition-colors"
              >
                <span class="text-gray-400 text-xs transition-transform" :class="{ 'rotate-90': treeExpanded.farm }">▶</span>
                <span class="text-2xl">🌾</span>
                <span class="font-medium text-gray-700">Farming Area</span>
                <span class="ml-auto text-sm text-gray-500">{{ farmStats.plantedTiles }}/{{ farmStats.totalTiles }}</span>
              </button>
              <Transition name="tree-expand">
                <div v-if="treeExpanded.farm" class="ml-8 mt-1 space-y-1">
                <div class="flex items-center gap-2 p-1 text-sm text-gray-600">
                  <span>🌱</span>
                  <span>Growing: {{ farmStats.plantedTiles - farmStats.readyToHarvest }}</span>
                </div>
                <div class="flex items-center gap-2 p-1 text-sm text-gray-600">
                  <span>🌾</span>
                  <span>Ready: {{ farmStats.readyToHarvest }}</span>
                </div>
                <div class="flex items-center gap-2 p-1 text-sm text-gray-600">
                  <span>🟫</span>
                  <span>Empty: {{ farmStats.emptyTiles }}</span>
                </div>
              </div>
              </Transition>
            </div>

            <!-- Pokemon Section -->
            <div>
              <button
                @click="treeExpanded.pokemon = !treeExpanded.pokemon"
                class="w-full flex items-center gap-2 p-2 rounded hover:bg-blue-100/50 text-left transition-colors"
              >
                <span class="text-gray-400 text-xs transition-transform" :class="{ 'rotate-90': treeExpanded.pokemon }">▶</span>
                <span class="text-2xl">🎯</span>
                <span class="font-medium text-gray-700">Pokemon</span>
                <span class="ml-auto text-sm text-gray-500">{{ myPokemon.length }}</span>
              </button>
              <Transition name="tree-expand">
                <div v-if="treeExpanded.pokemon" class="ml-8 mt-1 space-y-1">
                <div
                  v-for="pokemon in myPokemon"
                  :key="pokemon.id"
                  @click="selectPokemon(pokemon)"
                  class="flex items-center gap-2 p-1 text-sm text-gray-600 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <img
                    :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.species}.png`"
                    :alt="pokemon.nickname"
                    class="w-6 h-6"
                  />
                  <span>{{ pokemon.nickname }}</span>
                  <span class="ml-auto text-xs">Lv.{{ pokemon.level }}</span>
                </div>
              </div>
              </Transition>
            </div>

            <!-- Buildings Section -->
            <div>
              <button
                @click="treeExpanded.buildings = !treeExpanded.buildings"
                class="w-full flex items-center gap-2 p-2 rounded hover:bg-orange-100/50 text-left transition-colors"
              >
                <span class="text-gray-400 text-xs transition-transform" :class="{ 'rotate-90': treeExpanded.buildings }">▶</span>
                <span class="text-2xl">🏠</span>
                <span class="font-medium text-gray-700">Buildings</span>
                <span class="ml-auto text-sm text-gray-500">{{ farmBuildings.length + 2 }}</span>
              </button>
              <Transition name="tree-expand">
                <div v-if="treeExpanded.buildings" class="ml-8 mt-1 space-y-1">
                <div class="flex items-center gap-2 p-1 text-sm text-gray-600">
                  <span>🏠</span>
                  <span>Farmhouse</span>
                </div>
                <div class="flex items-center gap-2 p-1 text-sm text-gray-600">
                  <span>🪧</span>
                  <span>Farm Sign</span>
                </div>
                <div
                  v-for="building in farmBuildings"
                  :key="building.id"
                  class="flex items-center gap-2 p-1 text-sm text-gray-600"
                >
                  <span>{{ building.icon }}</span>
                  <span>{{ building.name }}</span>
                </div>
              </div>
              </Transition>
            </div>

            <!-- Resources Section -->
            <div>
              <button
                @click="treeExpanded.resources = !treeExpanded.resources"
                class="w-full flex items-center gap-2 p-2 rounded hover:bg-purple-100/50 text-left transition-colors"
              >
                <span class="text-gray-400 text-xs transition-transform" :class="{ 'rotate-90': treeExpanded.resources }">▶</span>
                <span class="text-2xl">📦</span>
                <span class="font-medium text-gray-700">Resources</span>
              </button>
              <Transition name="tree-expand">
                <div v-if="treeExpanded.resources" class="ml-8 mt-1 space-y-2">
                <!-- Currency -->
                <div class="flex items-center gap-2 p-1 text-sm text-gray-600">
                  <span>🪙</span>
                  <span>Coins: {{ playerData.currency }}</span>
                </div>
                
                <!-- Seeds -->
                <div class="border-t pt-1">
                  <div class="flex items-center gap-2 p-1 text-sm font-medium text-gray-700">
                    <span>🌱</span>
                    <span>Seeds ({{ totalSeeds }})</span>
                  </div>
                  <div class="ml-4 space-y-1">
                    <div v-if="farmStore.resources.seeds.wheat > 0" class="flex items-center gap-2 text-xs text-gray-600">
                      <span>🌾</span>
                      <span>Wheat: {{ farmStore.resources.seeds.wheat }}</span>
                    </div>
                    <div v-if="farmStore.resources.seeds.tomato > 0" class="flex items-center gap-2 text-xs text-gray-600">
                      <span>🍅</span>
                      <span>Tomato: {{ farmStore.resources.seeds.tomato }}</span>
                    </div>
                    <div v-if="farmStore.resources.seeds.berries > 0" class="flex items-center gap-2 text-xs text-gray-600">
                      <span>🫐</span>
                      <span>Berries: {{ farmStore.resources.seeds.berries }}</span>
                    </div>
                    <div v-if="farmStore.resources.seeds.oranBerry > 0" class="flex items-center gap-2 text-xs text-gray-600">
                      <span>🔵</span>
                      <span>Oran Berry: {{ farmStore.resources.seeds.oranBerry }}</span>
                    </div>
                    <div v-if="farmStore.resources.seeds.pechaBerry > 0" class="flex items-center gap-2 text-xs text-gray-600">
                      <span>🟣</span>
                      <span>Pecha Berry: {{ farmStore.resources.seeds.pechaBerry }}</span>
                    </div>
                    <div v-if="farmStore.resources.seeds.cheriBerry > 0" class="flex items-center gap-2 text-xs text-gray-600">
                      <span>🔴</span>
                      <span>Cheri Berry: {{ farmStore.resources.seeds.cheriBerry }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- Food -->
                <div class="border-t pt-1">
                  <div class="flex items-center gap-2 p-1 text-sm font-medium text-gray-700">
                    <span>🍖</span>
                    <span>Food ({{ totalFood }})</span>
                  </div>
                  <div class="ml-4 space-y-1">
                    <div v-if="farmStore.resources.items.pokemonFood > 0" class="flex items-center gap-2 text-xs text-gray-600">
                      <span>🍖</span>
                      <span>Pokemon Food: {{ farmStore.resources.items.pokemonFood }}</span>
                    </div>
                    <div v-if="farmStore.resources.items.tomato > 0" class="flex items-center gap-2 text-xs text-gray-600">
                      <span>🍅</span>
                      <span>Tomatoes: {{ farmStore.resources.items.tomato }}</span>
                    </div>
                    <div v-if="farmStore.resources.items.oranBerry > 0" class="flex items-center gap-2 text-xs text-gray-600">
                      <span>🔵</span>
                      <span>Oran Berries: {{ farmStore.resources.items.oranBerry }}</span>
                    </div>
                    <div v-if="farmStore.resources.items.pechaBerry > 0" class="flex items-center gap-2 text-xs text-gray-600">
                      <span>🟣</span>
                      <span>Pecha Berries: {{ farmStore.resources.items.pechaBerry }}</span>
                    </div>
                    <div v-if="farmStore.resources.items.cheriBerry > 0" class="flex items-center gap-2 text-xs text-gray-600">
                      <span>🔴</span>
                      <span>Cheri Berries: {{ farmStore.resources.items.cheriBerry }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- Other items -->
                <div v-if="farmStore.resources.items.fertilizer > 0" class="border-t pt-1">
                  <div class="flex items-center gap-2 p-1 text-sm text-gray-600">
                    <span>💩</span>
                    <span>Fertilizer: {{ farmStore.resources.items.fertilizer }}</span>
                  </div>
                </div>
              </div>
              </Transition>
            </div>
          </div>
        </div>
        <!-- Inventory -->
        <div class="p-4 border-b border-gray-200">
          <h2 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>🎒</span> Inventory
          </h2>
          <div class="grid grid-cols-4 gap-2">
            <div
              v-for="item in inventory"
              :key="item.id"
              class="bg-gray-50 rounded-lg p-2 text-center hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <span class="text-2xl">{{ item.icon }}</span>
              <div class="text-xs text-gray-600">{{ item.quantity }}</div>
            </div>
          </div>
        </div>

        <!-- Pokemon List -->
        <div class="p-4 border-b border-gray-200">
          <h2 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>🎯</span> My Pokemon
          </h2>
          <div class="space-y-2">
            <div
              v-for="pokemon in myPokemon"
              :key="pokemon.id"
              @click="selectPokemon(pokemon)"
              :class="[
                'bg-gray-50 rounded-lg p-3 cursor-pointer transition-all',
                selectedPokemon?.id === pokemon.id ? 'ring-2 ring-blue-500' : 'hover:bg-gray-100',
              ]"
            >
              <div class="flex items-center gap-3">
                <img
                  :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.species}.png`"
                  :alt="pokemon.nickname"
                  class="w-10 h-10"
                />
                <div class="flex-1">
                  <h4 class="font-medium text-gray-800">{{ pokemon.nickname }}</h4>
                  <div class="flex gap-3 text-xs text-gray-600">
                    <span>Lv.{{ pokemon.level }}</span>
                    <span>{{ pokemon.location || 'In PC' }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <button
                    v-if="pokemon.location !== 'farm' && pokemon.location !== 'Farm'"
                    @click.stop="movePokemonToFarm(pokemon)"
                    class="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded transition-colors"
                    title="Move to Farm"
                  >
                    🌾
                  </button>
                  <button
                    v-else
                    @click.stop="movePokemonToPC(pokemon)"
                    class="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
                    title="Move to PC"
                  >
                    📦
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Farm Stats -->
        <div class="p-4 border-b border-gray-200">
          <h2 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>📊</span> Farm Status
          </h2>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between text-gray-600">
              <span>Total Tiles:</span>
              <span class="font-medium">{{ farmStats.totalTiles }}</span>
            </div>
            <div class="flex justify-between text-gray-600">
              <span>Planted:</span>
              <span class="font-medium text-green-600">{{ farmStats.plantedTiles }}</span>
            </div>
            <div class="flex justify-between text-gray-600">
              <span>Ready to Harvest:</span>
              <span class="font-medium text-yellow-600">{{ farmStats.readyToHarvest }}</span>
            </div>
            <div class="flex justify-between text-gray-600">
              <span>Empty Tiles:</span>
              <span class="font-medium">{{ farmStats.emptyTiles }}</span>
            </div>
          </div>
        </div>

        <!-- Quests -->
        <div class="p-4">
          <h2 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>📋</span> Daily Quests
          </h2>
          <div class="space-y-2">
            <div v-for="quest in dailyQuests" :key="quest.id" class="bg-gray-50 rounded-lg p-3">
              <h4 class="font-medium text-gray-800 text-sm">{{ quest.title }}</h4>
              <div class="mt-1">
                <div class="bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    class="bg-green-500 h-full transition-all duration-300"
                    :style="{ width: `${(quest.progress / quest.target) * 100}%` }"
                  ></div>
                </div>
                <div class="flex justify-between text-xs text-gray-600 mt-1">
                  <span>{{ quest.progress }}/{{ quest.target }}</span>
                  <span>🪙 {{ quest.reward }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import { usePlayerStore } from '@/stores/player';
import { useFarmStore } from '@/stores/farm';
import { useToast } from '@/composables/useToast';

const playerStore = usePlayerStore();
const farmStore = useFarmStore();
const toast = useToast();

// Initialize stores
playerStore.initializeFirebase();
farmStore.initializeFirebase();

// Refs
const babylonCanvas = ref(null);
const isLoading = ref(true);
const loadError = ref(null);
let engine = null;
let scene = null;
let camera = null;
let ground = null;
let selectedTile = null;
let resizeHandler = null;
let cropGrowthInterval = null;

// Tree UI state
const treeExpanded = ref({
  farm: true,
  pokemon: false,
  buildings: false,
  resources: false
});

// Game State
const playerData = computed(() => ({
  currency: farmStore.resources.currency,
  level: playerStore.player.level,
  experience: playerStore.player.exp,
}));

const selectedTool = ref('select');
const selectedPokemon = ref(null);
const showBuildMenu = ref(false);
const hoveredTile = ref(null);
const selectedSeed = ref(null);
const currentTime = computed(() => {
  const time = farmStore.gameTime;
  return `Day ${time.day}, ${time.hour}:${time.minute.toString().padStart(2, '0')}`;
});

const currentSeason = computed(() => {
  return farmStore.gameTime.season.charAt(0).toUpperCase() + farmStore.gameTime.season.slice(1);
});

const currentWeather = computed(() => {
  return farmStore.gameTime.weather.charAt(0).toUpperCase() + farmStore.gameTime.weather.slice(1);
});

// Tools
const tools = [
  { id: 'select', name: 'Select', icon: '👆' },
  { id: 'plant', name: 'Plant Seeds', icon: '🌱' },
  { id: 'water', name: 'Water', icon: '💧' },
  { id: 'harvest', name: 'Harvest', icon: '🌾' },
  { id: 'pet', name: 'Pet Pokemon', icon: '🤚' },
  { id: 'feed', name: 'Feed Pokemon', icon: '🍖' },
];

// Buildings
const buildings = [
  {
    id: 'coop',
    name: 'Pokemon Coop',
    icon: '🏠',
    cost: 500,
    description: 'House for small Pokemon',
  },
  {
    id: 'barn',
    name: 'Pokemon Barn',
    icon: '🏚️',
    cost: 1000,
    description: 'House for large Pokemon',
  },
  { id: 'field', name: 'Crop Field', icon: '🌾', cost: 200, description: 'Plant crops here' },
  { id: 'pond', name: 'Pond', icon: '💧', cost: 300, description: 'Water-type Pokemon habitat' },
];

// Inventory with Pokemon-specific foods
const inventory = computed(() => {
  const items = [
    {
      id: 1,
      type: 'seed',
      name: 'Wheat Seeds',
      icon: '🌾',
      quantity: farmStore.resources.seeds.wheat || 10,
    },
    {
      id: 2,
      type: 'seed',
      name: 'Berry Seeds',
      icon: '🫐',
      quantity: farmStore.resources.seeds.berries || 20,
    },
    {
      id: 3,
      type: 'seed',
      name: 'Oran Berry Seeds',
      icon: '🔵',
      quantity: farmStore.resources.seeds.oranBerry || 0,
    },
    {
      id: 4,
      type: 'seed',
      name: 'Pecha Berry Seeds',
      icon: '🟣',
      quantity: farmStore.resources.seeds.pechaBerry || 0,
    },
    {
      id: 5,
      type: 'seed',
      name: 'Cheri Berry Seeds',
      icon: '🔴',
      quantity: farmStore.resources.seeds.cheriBerry || 0,
    },
    {
      id: 11,
      type: 'seed',
      name: 'Tomato Seeds',
      icon: '🍅',
      quantity: farmStore.resources.seeds.tomato || 15,
    },
    {
      id: 6,
      type: 'food',
      name: 'Pokemon Food',
      icon: '🍖',
      quantity: farmStore.resources.items.pokemonFood || 50,
    },
    {
      id: 7,
      type: 'food',
      name: 'Oran Berry',
      icon: '🔵',
      quantity: farmStore.resources.items.oranBerry || 0,
    },
    {
      id: 8,
      type: 'food',
      name: 'Pecha Berry',
      icon: '🟣',
      quantity: farmStore.resources.items.pechaBerry || 0,
    },
    {
      id: 9,
      type: 'food',
      name: 'Cheri Berry',
      icon: '🔴',
      quantity: farmStore.resources.items.cheriBerry || 0,
    },
    {
      id: 10,
      type: 'item',
      name: 'Fertilizer',
      icon: '💩',
      quantity: farmStore.resources.items.fertilizer || 10,
    },
    {
      id: 12,
      type: 'food',
      name: 'Tomato',
      icon: '🍅',
      quantity: farmStore.resources.items.tomato || 0,
    },
  ];
  
  // Filter out items with 0 quantity for cleaner display
  return items.filter(item => item.quantity > 0);
});

// Pokemon
const myPokemon = computed(() => farmStore.allUserPokemon);
const farmPokemon = computed(() => farmStore.farmPokemon);

// Available seeds for planting
const availableSeeds = computed(() => {
  return inventory.value
    .filter(item => item.type === 'seed' && item.quantity > 0)
    .map(seed => ({
      ...seed,
      displayName: seed.name.replace(' Seeds', '')
    }));
});

// Farm statistics
const farmStats = computed(() => {
  const size = farmStore.farm.farmingArea || { startX: 5, endX: 15, startZ: 8, endZ: 23 };
  const width = size.endX - size.startX;
  const height = size.endZ - size.startZ;
  const stats = {
    totalTiles: width * height,
    plantedTiles: 0,
    readyToHarvest: 0,
    emptyTiles: 0
  };
  
  if (scene) {
    // Only count arable tiles (farming area)
    for (let x = size.startX; x < size.endX; x++) {
      for (let z = size.startZ; z < size.endZ; z++) {
        const tile = scene.getMeshByName(`tile_${x}_${z}`);
        if (tile && tile.metadata && tile.metadata.arable) {
          if (tile.metadata.type === 'crop') {
            stats.plantedTiles++;
            if (tile.metadata.growth >= 100) {
              stats.readyToHarvest++;
            }
          } else if (tile.metadata.type === 'empty') {
            stats.emptyTiles++;
          }
        }
      }
    }
  } else {
    stats.emptyTiles = stats.totalTiles;
  }
  
  return stats;
});

// Computed properties for tree UI
const totalSeeds = computed(() => {
  const seeds = farmStore.resources.seeds;
  return Object.values(seeds).reduce((sum, quantity) => sum + (quantity || 0), 0);
});

const totalFood = computed(() => {
  const items = farmStore.resources.items;
  const foodItems = ['pokemonFood', 'oranBerry', 'pechaBerry', 'cheriBerry', 'tomato'];
  return foodItems.reduce((sum, item) => sum + (items[item] || 0), 0);
});

const farmBuildings = computed(() => {
  // Return user-placed buildings from farmStore
  return farmStore.farm.buildings.filter(building => 
    building.type !== 'house' && building.type !== 'sign'
  );
});

// Quests
const dailyQuests = ref([
  { id: 1, title: 'Plant 5 Crops', progress: 2, target: 5, reward: 100 },
  { id: 2, title: 'Feed 3 Pokemon', progress: 1, target: 3, reward: 50 },
  { id: 3, title: 'Harvest 10 Crops', progress: 0, target: 10, reward: 200 },
]);

// Methods
const selectTool = toolId => {
  selectedTool.value = toolId;
  // Auto-select first available seed when switching to plant tool
  if (toolId === 'plant' && availableSeeds.value.length > 0) {
    selectedSeed.value = availableSeeds.value[0];
  }
};

// Get seed growth time
const getSeedGrowthTime = (seedName) => {
  const growthTimes = {
    'Wheat': '50s',
    'Tomato': '60s',
    'Berry': '40s',
    'Oran Berry': '45s',
    'Pecha Berry': '45s',
    'Cheri Berry': '45s',
    'Pokemon Food Plant': '70s'
  };
  const name = seedName.replace(' Seeds', '');
  return growthTimes[name] || '50s';
};

// Get seed yield info
const getSeedYield = (seedName) => {
  const yields = {
    'Wheat': '50 coins',
    'Tomato': '3-6 tomatoes',
    'Berry': '2-4 berries',
    'Oran Berry': '2-4 berries',
    'Pecha Berry': '2-4 berries',
    'Cheri Berry': '2-4 berries',
    'Pokemon Food Plant': '4-8 food'
  };
  const name = seedName.replace(' Seeds', '');
  return yields[name] || '2-4 items';
};

const selectBuilding = building => {
  if (playerData.value.currency >= building.cost) {
    selectedTool.value = 'build';
    // Store selected building for placement
    showBuildMenu.value = false;
    toast.info('Building Selected', `Click on the map to place ${building.name}`);
  }
};

const selectPokemon = pokemon => {
  selectedPokemon.value = pokemon;
  // Focus camera on Pokemon if on farm
  if (pokemon.location === 'Farm' && scene) {
    // TODO: Move camera to Pokemon position
  }
};

// Move Pokemon to farm
const movePokemonToFarm = async (pokemon) => {
  try {
    // Find a random position on the farm
    const x = (Math.random() - 0.5) * 10;
    const z = (Math.random() - 0.5) * 10;
    
    // Update Pokemon location
    const result = await farmStore.movePokemon(pokemon.id, 'farm', x, z);
    if (result.success) {
      toast.success('Pokemon Moved!', `${pokemon.nickname} is now on the farm!`);
      
      // Create mesh for the newly added Pokemon
      if (scene) {
        createPokemonMeshes();
      }
    } else {
      toast.error('Failed', result.message);
    }
  } catch (error) {
    console.error('Error moving Pokemon to farm:', error);
    toast.error('Error', 'Failed to move Pokemon to farm');
  }
};

// Move Pokemon to PC
const movePokemonToPC = async (pokemon) => {
  try {
    const result = await farmStore.movePokemon(pokemon.id, 'PC');
    if (result.success) {
      toast.success('Pokemon Moved!', `${pokemon.nickname} is now in the PC!`);
      
      // Remove Pokemon mesh from scene
      if (scene) {
        const pokemonMesh = scene.getMeshByName(`pokemon_${pokemon.id}`);
        if (pokemonMesh) {
          pokemonMesh.dispose();
        }
        const shadowMesh = scene.getMeshByName(`shadow_${pokemon.id}`);
        if (shadowMesh) {
          shadowMesh.dispose();
        }
      }
    } else {
      toast.error('Failed', result.message);
    }
  } catch (error) {
    console.error('Error moving Pokemon to PC:', error);
    toast.error('Error', 'Failed to move Pokemon to PC');
  }
};

// Initialize Babylon.js
const initBabylon = () => {
  if (!babylonCanvas.value) {
    console.error('Canvas element not found');
    return;
  }

  try {
    // Check WebGL support
    if (!BABYLON.Engine.isSupported()) {
      throw new Error('WebGL is not supported in this browser');
    }

    // Create engine
    engine = new BABYLON.Engine(babylonCanvas.value, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      adaptToDeviceRatio: true,
    });

    // Create scene
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.8, 0.9, 1); // Light blue sky

    // Create camera
    camera = new BABYLON.ArcRotateCamera(
      'camera',
      Math.PI / 4,
      Math.PI / 3,
      20,
      new BABYLON.Vector3(0, 0, 0),
      scene
    );
    camera.attachControl(babylonCanvas.value, true);
    
    // Camera distance limits
    camera.lowerRadiusLimit = 10;
    camera.upperRadiusLimit = 50;
    
    // Camera angle limits - prevent viewing from below
    camera.lowerBetaLimit = 0.1; // Minimum angle (almost horizontal)
    camera.upperBetaLimit = Math.PI / 2 - 0.1; // Maximum angle (almost top-down)
    
    // Optional: Set panning limits to keep camera focused on farm
    camera.panningSensibility = 100; // Lower = more sensitive panning

    // Create light - brighter for cartoon style
    const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 1.2;
    light.specular = new BABYLON.Color3(0.2, 0.2, 0.2);
    
    // Add ambient light for softer shadows
    scene.ambientColor = new BABYLON.Color3(0.3, 0.3, 0.3);

    // Create ground based on island size (hidden, just for reference)
    const islandSize = farmStore.farm.islandSize || 50;
    ground = BABYLON.MeshBuilder.CreateGround(
      'ground',
      { width: islandSize, height: islandSize, subdivisions: 50 },
      scene
    );
    ground.isVisible = false; // Hide the main ground
    
    // Create sea around the island
    // createSea();
    
    // Create beach/sand around island edges
    // createBeach();

    // Create grid for tiles
    createFarmGrid();

    // Add some basic objects
    createFarmObjects();

    // Create Pokemon
    createPokemonMeshes();

    // Set up interactions
    setupInteractions();

    // Render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Handle resize
    resizeHandler = () => {
      if (engine) engine.resize();
    };
    window.addEventListener('resize', resizeHandler);

    // Set loading to false when done
    isLoading.value = false;
  } catch (error) {
    console.error('Error initializing Babylon.js:', error);
    toast.error('3D Engine Error', 'Failed to initialize 3D environment');
    isLoading.value = false;
  }
};

// Create sea around the island
const createSea = () => {
  // Create a large water plane
  const sea = BABYLON.MeshBuilder.CreateGround(
    'sea',
    { width: 200, height: 200, subdivisions: 32 },
    scene
  );
  sea.position.y = -0.5; // Slightly below ground level
  
  // Create water material - bright cartoon style
  const waterMaterial = new BABYLON.StandardMaterial('waterMat', scene);
  waterMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.9);
  waterMaterial.specularColor = new BABYLON.Color3(0.4, 0.7, 1);
  waterMaterial.specularPower = 32;
  waterMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.3, 0.4);
  waterMaterial.alpha = 0.9;
  waterMaterial.backFaceCulling = false;
  sea.material = waterMaterial;
  
  // Animate water
  let time = 0;
  scene.registerBeforeRender(() => {
    time += 0.01;
    if (sea && !sea.isDisposed()) {
      sea.position.y = -0.5 + Math.sin(time) * 0.05;
    }
  });
  
  // Add some waves using vertex data animation
  const vertexData = BABYLON.VertexData.ExtractFromMesh(sea);
  const positions = vertexData.positions;
  const originalPositions = [...positions];
  
  scene.registerBeforeRender(() => {
    if (sea && !sea.isDisposed() && positions) {
      for (let i = 0; i < positions.length; i += 3) {
        const x = originalPositions[i];
        const z = originalPositions[i + 2];
        const waveHeight = Math.sin(time + x * 0.05) * 0.1 + Math.cos(time * 0.7 + z * 0.05) * 0.1;
        positions[i + 1] = waveHeight;
      }
      sea.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
    }
  });
};

// Create beach around island
const createBeach = () => {
  const beachWidth = 3;
  const islandSize = (farmStore.farm.islandSize || 50) / 2; // Half of ground size
  
  // Create beach ring
  for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
    for (let r = islandSize - beachWidth; r < islandSize; r += 0.5) {
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      
      const beach = BABYLON.MeshBuilder.CreateSphere(
        `beach_${angle}_${r}`,
        { diameter: 1, segments: 4 },
        scene
      );
      beach.position.x = x;
      beach.position.y = -0.3;
      beach.position.z = z;
      beach.scaling = new BABYLON.Vector3(2, 0.2, 2);
      
      const beachMaterial = new BABYLON.StandardMaterial(`beachMat_${angle}_${r}`, scene);
      beachMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.8, 0.6);
      beachMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
      beach.material = beachMaterial;
    }
  }
  
  // Add some rocks and shells
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = islandSize - Math.random() * beachWidth;
    
    const rock = BABYLON.MeshBuilder.CreateSphere(
      `beachRock_${i}`,
      { diameter: 0.3 + Math.random() * 0.3, segments: 4 },
      scene
    );
    rock.position.x = Math.cos(angle) * distance;
    rock.position.y = -0.1;
    rock.position.z = Math.sin(angle) * distance;
    rock.scaling.y = 0.5;
    
    const rockMaterial = new BABYLON.StandardMaterial(`beachRockMat_${i}`, scene);
    rockMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    rock.material = rockMaterial;
  }
};

const createFarmGrid = () => {
  const islandSize = farmStore.farm.islandSize || 50;
  const gridSize = Math.ceil(islandSize / 1.5); // Grid size based on island size
  const tileSize = 1;
  
  // Use dynamic farming area from store with fallback
  const size = farmStore.farm.farmingArea || { startX: 5, endX: 15, startZ: 8, endZ: 23 };
  const farmAreaStartX = size.startX;
  const farmAreaEndX = size.endX;
  const farmAreaStartZ = size.startZ;
  const farmAreaEndZ = size.endZ;

  for (let x = 0; x < gridSize; x++) {
    for (let z = 0; z < gridSize; z++) {
      // Check if this tile is in the farming area
      const isArableLand = x >= farmAreaStartX && x < farmAreaEndX && 
                          z >= farmAreaStartZ && z < farmAreaEndZ;
      
      // Create all tiles, not just arable ones
      const tile = BABYLON.MeshBuilder.CreateBox(
        `tile_${x}_${z}`,
        { width: tileSize * 0.98, height: 0.1, depth: tileSize * 0.98 },
        scene
      );
      tile.position.x = x - gridSize / 2 + 0.5;
      tile.position.y = 0.05;
      tile.position.z = z - gridSize / 2 + 0.5;
      tile.isPickable = true;
      
      if (isArableLand) {
        tile.metadata = { x, z, type: 'empty', arable: true };
        // Arable land - rich brown soil color with slight variation
        const tileMaterial = new BABYLON.StandardMaterial(`tileMat_${x}_${z}`, scene);
        const variation = Math.random() * 0.1;
        tileMaterial.diffuseColor = new BABYLON.Color3(0.55 + variation, 0.4 + variation, 0.25);
        tileMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        tileMaterial.emissiveColor = new BABYLON.Color3(0.05, 0.025, 0);
        tile.material = tileMaterial;
      } else {
        tile.metadata = { x, z, type: 'grass', arable: false };
        // Grass tiles with variation
        const tileMaterial = new BABYLON.StandardMaterial(`tileMat_${x}_${z}`, scene);
        const variation = Math.random() * 0.1;
        tileMaterial.diffuseColor = new BABYLON.Color3(0.4 + variation, 0.75 + variation, 0.25);
        tileMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        tileMaterial.emissiveColor = new BABYLON.Color3(0.05, 0.1, 0.02);
        tile.material = tileMaterial;
      }
    }
  }
  
  // Create a border around the farming area
  createFarmAreaBorder(farmAreaStartX, farmAreaEndX, farmAreaStartZ, farmAreaEndZ, gridSize);
  
  // Add a sign for the farming area
  createFarmSign(-10 + farmAreaStartX, -10 + farmAreaStartZ);
  
  // Add a path leading to the farming area
  createFarmPath(farmAreaStartX, farmAreaStartZ, gridSize);
  
};

// Create a border fence around the farming area
const createFarmAreaBorder = (startX, endX, startZ, endZ, gridSize) => {
  const fenceHeight = 0.8;
  const postSize = 0.1;
  
  // Create fence posts and rails
  for (let x = startX; x <= endX; x++) {
    // Front fence
    if (x % 2 === 0 || x === startX || x === endX) {
      const post = BABYLON.MeshBuilder.CreateBox(
        `fencePost_${x}_${startZ}`,
        { width: postSize, height: fenceHeight, depth: postSize },
        scene
      );
      post.position.x = x - gridSize / 2 + 0.5;
      post.position.y = fenceHeight / 2;
      post.position.z = startZ - gridSize / 2;
      
      const postMaterial = new BABYLON.StandardMaterial(`fencePostMat_${x}_${startZ}`, scene);
      postMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.3, 0.2);
      post.material = postMaterial;
    }
    
    // Back fence
    if (x % 2 === 0 || x === startX || x === endX) {
      const post = BABYLON.MeshBuilder.CreateBox(
        `fencePost_${x}_${endZ}`,
        { width: postSize, height: fenceHeight, depth: postSize },
        scene
      );
      post.position.x = x - gridSize / 2 + 0.5;
      post.position.y = fenceHeight / 2;
      post.position.z = endZ - gridSize / 2;
      
      const postMaterial = new BABYLON.StandardMaterial(`fencePostMat_${x}_${endZ}`, scene);
      postMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.3, 0.2);
      post.material = postMaterial;
    }
  }
  
  // Side fences
  for (let z = startZ; z <= endZ; z++) {
    if (z % 2 === 0 || z === startZ || z === endZ) {
      // Left fence
      const leftPost = BABYLON.MeshBuilder.CreateBox(
        `fencePost_${startX}_${z}`,
        { width: postSize, height: fenceHeight, depth: postSize },
        scene
      );
      leftPost.position.x = startX - gridSize / 2;
      leftPost.position.y = fenceHeight / 2;
      leftPost.position.z = z - gridSize / 2 + 0.5;
      
      const leftPostMaterial = new BABYLON.StandardMaterial(`fencePostMat_${startX}_${z}`, scene);
      leftPostMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.3, 0.2);
      leftPost.material = leftPostMaterial;
      
      // Right fence
      const rightPost = BABYLON.MeshBuilder.CreateBox(
        `fencePost_${endX}_${z}`,
        { width: postSize, height: fenceHeight, depth: postSize },
        scene
      );
      rightPost.position.x = endX - gridSize / 2;
      rightPost.position.y = fenceHeight / 2;
      rightPost.position.z = z - gridSize / 2 + 0.5;
      
      const rightPostMaterial = new BABYLON.StandardMaterial(`fencePostMat_${endX}_${z}`, scene);
      rightPostMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.3, 0.2);
      rightPost.material = rightPostMaterial;
    }
  }
};

// Create a sign for the farming area
const createFarmSign = (x, z) => {
  // Sign post
  const post = BABYLON.MeshBuilder.CreateCylinder(
    'signPost',
    { height: 1.5, diameter: 0.15 },
    scene
  );
  post.position.x = x - 1;
  post.position.y = 0.75;
  post.position.z = z - 1;
  
  const postMaterial = new BABYLON.StandardMaterial('signPostMat', scene);
  postMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.3, 0.2);
  post.material = postMaterial;
  
  // Sign board
  const sign = BABYLON.MeshBuilder.CreateBox(
    'signBoard',
    { width: 1.5, height: 0.8, depth: 0.1 },
    scene
  );
  sign.position.x = x - 1;
  sign.position.y = 1.3;
  sign.position.z = z - 1;
  sign.rotation.y = Math.PI / 4;
  
  const signMaterial = new BABYLON.StandardMaterial('signMat', scene);
  signMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.4, 0.3);
  signMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.08, 0.06);
  sign.material = signMaterial;
  
  // Sign text (using a plane with texture or just visual indicator)
  const textPlane = BABYLON.MeshBuilder.CreatePlane(
    'signText',
    { width: 1.2, height: 0.6 },
    scene
  );
  textPlane.position.x = x - 1;
  textPlane.position.y = 1.3;
  textPlane.position.z = z - 1.06;
  textPlane.rotation.y = Math.PI / 4;
  
  const textMaterial = new BABYLON.StandardMaterial('signTextMat', scene);
  textMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.1, 0);
  textMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.2, 0.1);
  textPlane.material = textMaterial;
};

// Create a path to the farming area
const createFarmPath = (farmStartX, farmStartZ, gridSize) => {
  // Create a dirt path from the house to the farm
  const pathWidth = 2;
  
  // Path from house area to farm entrance
  for (let i = 0; i < 10; i++) {
    for (let w = 0; w < pathWidth; w++) {
      const pathTile = BABYLON.MeshBuilder.CreateBox(
        `pathTile_${i}_${w}`,
        { width: 0.98, height: 0.08, depth: 0.98 },
        scene
      );
      pathTile.position.x = 3 - i * 0.8 + w;
      pathTile.position.y = 0.04;
      pathTile.position.z = -8 + i * 1.2;
      
      const pathMaterial = new BABYLON.StandardMaterial(`pathMat_${i}_${w}`, scene);
      pathMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.6, 0.4);
      pathMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.08, 0.04);
      pathTile.material = pathMaterial;
    }
  }
  
  // Add some decorative rocks around the path
  for (let i = 0; i < 5; i++) {
    const rock = BABYLON.MeshBuilder.CreateSphere(
      `rock_${i}`,
      { diameter: 0.3 + Math.random() * 0.2, segments: 6 },
      scene
    );
    rock.position.x = 2 - i * 1.5 + (Math.random() - 0.5) * 0.5;
    rock.position.y = 0.15;
    rock.position.z = -7 + i * 2 + (Math.random() - 0.5) * 0.5;
    rock.scaling.y = 0.7;
    
    const rockMaterial = new BABYLON.StandardMaterial(`rockMat_${i}`, scene);
    rockMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    rock.material = rockMaterial;
  }
};

// Get next expansion info
const getNextExpansion = computed(() => {
  const expansionLevels = {
    0: { level: 1, cost: 1000, size: 60, name: 'Small Expansion' },
    1: { level: 2, cost: 2500, size: 70, name: 'Medium Expansion' },
    2: { level: 3, cost: 5000, size: 80, name: 'Large Expansion' },
    3: { level: 4, cost: 10000, size: 90, name: 'Huge Expansion' },
    4: { level: 5, cost: 20000, size: 100, name: 'Maximum Expansion' }
  };
  
  const currentLevel = farmStore.farm.expansions ? farmStore.farm.expansions.length : 0;
  return expansionLevels[currentLevel] || null;
});

const createFarmObjects = () => {
  // Create a simple house (place it outside the farming area)
  const house = BABYLON.MeshBuilder.CreateBox('house', { width: 3, height: 2, depth: 3 }, scene);
  house.position.x = 5;
  house.position.y = 1;
  house.position.z = -8;

  const houseMaterial = new BABYLON.StandardMaterial('houseMat', scene);
  houseMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.5, 0.3);
  houseMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.05, 0.02);
  house.material = houseMaterial;
  
  // Add a roof
  const roof = BABYLON.MeshBuilder.CreateBox('roof', { width: 3.5, height: 0.5, depth: 3.5 }, scene);
  roof.position.x = 5;
  roof.position.y = 2.5;
  roof.position.z = -8;
  
  const roofMaterial = new BABYLON.StandardMaterial('roofMat', scene);
  roofMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2);
  roofMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.02, 0.02);
  roof.material = roofMaterial;

  // Create trees around the farm (outside farming area)
  const treePositions = [
    { x: -8, z: -5 },
    { x: -6, z: 8 },
    { x: 8, z: -7 },
    { x: 10, z: 5 },
    { x: -10, z: 2 },
    { x: 12, z: -3 },
    { x: -12, z: -8 }
  ];
  
  treePositions.forEach((pos, i) => {
    const trunk = BABYLON.MeshBuilder.CreateCylinder(
      `trunk${i}`,
      { height: 2, diameter: 0.5 },
      scene
    );
    trunk.position.x = pos.x;
    trunk.position.y = 1;
    trunk.position.z = pos.z;

    const trunkMaterial = new BABYLON.StandardMaterial(`trunkMat${i}`, scene);
    trunkMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.15);
    trunkMaterial.emissiveColor = new BABYLON.Color3(0.05, 0.02, 0);
    trunk.material = trunkMaterial;

    const leaves = BABYLON.MeshBuilder.CreateSphere(`leaves${i}`, { diameter: 2.5, segments: 8 }, scene);
    leaves.position = trunk.position.clone();
    leaves.position.y += 2;

    const leavesMaterial = new BABYLON.StandardMaterial(`leavesMat${i}`, scene);
    leavesMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.8, 0.3);
    leavesMaterial.emissiveColor = new BABYLON.Color3(0.05, 0.15, 0.05);
    leaves.material = leavesMaterial;
  });
};

const createPokemonMeshes = () => {
  // Clear existing Pokemon meshes
  scene.meshes.forEach(mesh => {
    if (mesh.name.startsWith('pokemon_') || mesh.name.startsWith('shadow_')) {
      mesh.dispose();
    }
  });

  // Create Pokemon with sprite billboards
  farmPokemon.value.forEach((pokemon, index) => {
    if (pokemon.location === 'farm' || pokemon.location === 'Farm') {
      try {
        // Create a plane for the Pokemon sprite
        const pokemonPlane = BABYLON.MeshBuilder.CreatePlane(
          `pokemon_${pokemon.id}`,
          { size: 1.5 },
          scene
        );
        
        // Position the Pokemon
        pokemonPlane.position.x = pokemon.x || index * 3 - 3;
        pokemonPlane.position.y = 0.75;
        pokemonPlane.position.z = pokemon.z || 2;
        
        // Make it always face the camera
        pokemonPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        
        // Create material with Pokemon sprite texture
        const pokemonMaterial = new BABYLON.StandardMaterial(`pokemonMat_${pokemon.id}`, scene);
        const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.species}.png`;
        
        pokemonMaterial.diffuseTexture = new BABYLON.Texture(spriteUrl, scene);
        pokemonMaterial.diffuseTexture.hasAlpha = true;
        pokemonMaterial.useAlphaFromDiffuseTexture = true;
        pokemonMaterial.backFaceCulling = false;
        pokemonMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        pokemonMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        
        pokemonPlane.material = pokemonMaterial;
        pokemonPlane.metadata = { pokemon, sprite: pokemonPlane };
        
        // Create shadow
        const shadow = BABYLON.MeshBuilder.CreateDisc(
          `shadow_${pokemon.id}`,
          { radius: 0.4 },
          scene
        );
        shadow.position.x = pokemonPlane.position.x;
        shadow.position.y = 0.01;
        shadow.position.z = pokemonPlane.position.z;
        shadow.rotation.x = Math.PI / 2;
        
        const shadowMaterial = new BABYLON.StandardMaterial(`shadowMat_${pokemon.id}`, scene);
        shadowMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        shadowMaterial.alpha = 0.3;
        shadow.material = shadowMaterial;
        
        // Pokemon animations
        let wanderTarget = { x: pokemonPlane.position.x, z: pokemonPlane.position.z };
        let moveTimer = 0;
        
        scene.registerBeforeRender(() => {
          if (pokemonPlane && !pokemonPlane.isDisposed()) {
            // Idle bounce animation
            pokemonPlane.position.y = 0.75 + Math.sin(Date.now() * 0.002 + index) * 0.05;
            
            // Random wandering
            moveTimer++;
            if (moveTimer > 300 + Math.random() * 300) {
              moveTimer = 0;
              wanderTarget = {
                x: (Math.random() - 0.5) * 8,
                z: (Math.random() - 0.5) * 8
              };
            }
            
            // Move towards target
            const speed = 0.005;
            const dx = wanderTarget.x - pokemonPlane.position.x;
            const dz = wanderTarget.z - pokemonPlane.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance > 0.1) {
              pokemonPlane.position.x += (dx / distance) * speed;
              pokemonPlane.position.z += (dz / distance) * speed;
              
              // Update shadow position
              if (shadow && !shadow.isDisposed()) {
                shadow.position.x = pokemonPlane.position.x;
                shadow.position.z = pokemonPlane.position.z;
              }
              
              // Update Pokemon's stored position
              pokemon.x = pokemonPlane.position.x;
              pokemon.z = pokemonPlane.position.z;
            }
          }
        });
      } catch (error) {
        console.error(`Error creating Pokemon mesh for ${pokemon.nickname}:`, error);
      }
    }
  });
};

const setupInteractions = () => {
  if (!scene) return;

  scene.onPointerObservable.add(pointerInfo => {
    if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
      const pickResult = scene.pick(scene.pointerX, scene.pointerY);

      if (pickResult.hit && pickResult.pickedMesh) {
        const mesh = pickResult.pickedMesh;

        // Handle tile clicks
        if (mesh.name.startsWith('tile_')) {
          handleTileClick(mesh);
        }
        // Handle Pokemon clicks
        else if (mesh.name.startsWith('pokemon_')) {
          handlePokemonClick(mesh);
        }
      }
    }
    // Handle hover
    else if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) {
      const pickResult = scene.pick(scene.pointerX, scene.pointerY);
      
      if (pickResult.hit && pickResult.pickedMesh) {
        const mesh = pickResult.pickedMesh;
        
        // Handle tile hover
        if (mesh.name.startsWith('tile_') && mesh.metadata) {
          // Convert 3D position to screen coordinates
          const screenCoords = BABYLON.Vector3.Project(
            mesh.position,
            BABYLON.Matrix.Identity(),
            scene.getTransformMatrix(),
            camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight())
          );
          
          if (mesh.metadata.type === 'crop') {
            hoveredTile.value = {
              tile: mesh,
              type: mesh.metadata.type,
              cropType: mesh.metadata.cropType,
              growth: mesh.metadata.growth,
              watered: mesh.metadata.watered,
              screenX: screenCoords.x,
              screenY: screenCoords.y
            };
          } else if (mesh.metadata.type === 'empty' && mesh.metadata.arable && selectedTool.value === 'plant') {
            // Show planting preview only for arable empty tiles
            hoveredTile.value = {
              tile: mesh,
              type: 'empty',
              canPlant: true,
              screenX: screenCoords.x,
              screenY: screenCoords.y
            };
            // Add hover effect
            mesh.material.emissiveColor = new BABYLON.Color3(0.2, 0.4, 0.2);
          } else {
            hoveredTile.value = null;
            // Remove hover effect
            if (mesh.metadata.type === 'empty' && mesh.metadata.arable) {
              mesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
            }
          }
        } else {
          hoveredTile.value = null;
        }
      } else {
        hoveredTile.value = null;
      }
    }
  });
};

const handleTileClick = tile => {
  if (!tile || !tile.metadata) return;

  const tool = selectedTool.value;

  // Always allow harvesting ready crops regardless of selected tool
  if (tile.metadata.type === 'crop' && tile.metadata.growth >= 100) {
    harvestCrop(tile);
    return;
  }

  switch (tool) {
    case 'plant':
      if (tile.metadata.type === 'empty') {
        plantCrop(tile);
      }
      break;
    case 'water':
      if (tile.metadata.type === 'crop') {
        waterCrop(tile);
      }
      break;
    case 'harvest':
      if (tile.metadata.type === 'crop' && tile.metadata.growth >= 100) {
        harvestCrop(tile);
      }
      break;
  }
};

const handlePokemonClick = pokemonMesh => {
  const tool = selectedTool.value;
  const pokemon = pokemonMesh.metadata.pokemon;

  switch (tool) {
    case 'select':
      selectPokemon(pokemon);
      break;
    case 'pet':
      petPokemon(pokemon);
      break;
    case 'feed':
      feedPokemon(pokemon);
      break;
  }
};

const plantCrop = tile => {
  if (!scene || !tile) return;

  // Check if tile is arable
  if (!tile.metadata.arable) {
    toast.error('Invalid Location', 'You can only plant crops in the farming area!');
    return;
  }

  // Use selected seed or fallback to first available
  let seedItem = selectedSeed.value;
  if (!seedItem || seedItem.quantity <= 0) {
    seedItem = inventory.value.find(item => item.type === 'seed' && item.quantity > 0);
  }
  
  if (!seedItem) {
    toast.error('No Seeds', 'You need seeds to plant crops!');
    return;
  }

  // Plant the crop
  tile.metadata.type = 'crop';
  tile.metadata.cropType = seedItem.name;
  tile.metadata.growth = 0;
  tile.metadata.watered = false;
  tile.metadata.isPokemonFood = seedItem.name.includes('Berry') || seedItem.name.includes('Pokemon Food');

  // Update tile appearance
  tile.material.diffuseColor = new BABYLON.Color3(0.4, 0.3, 0.1);

  // Create crop mesh based on type
  let cropMesh;
  if (seedItem.name.includes('Tomato')) {
    // Create tomato plant
    cropMesh = BABYLON.MeshBuilder.CreateSphere(
      `crop_${tile.metadata.x}_${tile.metadata.z}`,
      { diameter: 0.4, segments: 8 },
      scene
    );
    cropMesh.position = tile.position.clone();
    cropMesh.position.y += 0.2;

    const cropMaterial = new BABYLON.StandardMaterial(
      `cropMat_${tile.metadata.x}_${tile.metadata.z}`,
      scene
    );
    cropMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.1, 0.1); // Red tomato
    cropMesh.material = cropMaterial;
    
    // Add green stem
    const stem = BABYLON.MeshBuilder.CreateCylinder(
      `stem_${tile.metadata.x}_${tile.metadata.z}`,
      { height: 0.2, diameter: 0.05 },
      scene
    );
    stem.position = cropMesh.position.clone();
    stem.position.y += 0.15;
    stem.parent = cropMesh;
    
    const stemMaterial = new BABYLON.StandardMaterial(
      `stemMat_${tile.metadata.x}_${tile.metadata.z}`,
      scene
    );
    stemMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.2);
    stem.material = stemMaterial;
  } else if (seedItem.name.includes('Berry')) {
    // Create berry bush
    cropMesh = BABYLON.MeshBuilder.CreateSphere(
      `crop_${tile.metadata.x}_${tile.metadata.z}`,
      { diameter: 0.3, segments: 8 },
      scene
    );
    cropMesh.position = tile.position.clone();
    cropMesh.position.y += 0.2;

    const cropMaterial = new BABYLON.StandardMaterial(
      `cropMat_${tile.metadata.x}_${tile.metadata.z}`,
      scene
    );
    
    // Different colors for different berries with emissive glow
    if (seedItem.name.includes('Oran')) {
      cropMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.5, 0.9); // Blue
      cropMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.2, 0.4);
    } else if (seedItem.name.includes('Pecha')) {
      cropMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.3, 0.9); // Pink
      cropMaterial.emissiveColor = new BABYLON.Color3(0.4, 0.1, 0.4);
    } else if (seedItem.name.includes('Cheri')) {
      cropMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.3, 0.3); // Red
      cropMaterial.emissiveColor = new BABYLON.Color3(0.4, 0.1, 0.1);
    } else {
      cropMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.7); // Purple
      cropMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.1, 0.3);
    }
    
    cropMesh.material = cropMaterial;
  } else {
    // Regular crop
    cropMesh = BABYLON.MeshBuilder.CreateBox(
      `crop_${tile.metadata.x}_${tile.metadata.z}`,
      { width: 0.3, height: 0.2, depth: 0.3 },
      scene
    );
    cropMesh.position = tile.position.clone();
    cropMesh.position.y += 0.2;

    const cropMaterial = new BABYLON.StandardMaterial(
      `cropMat_${tile.metadata.x}_${tile.metadata.z}`,
      scene
    );
    cropMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.2);
    cropMesh.material = cropMaterial;
  }

  // Store crop info in metadata
  cropMesh.metadata = { 
    cropType: seedItem.name,
    growth: 0,
    isPokemonFood: tile.metadata.isPokemonFood
  };

  // Start growth animation
  let growthScale = 0.1;
  scene.registerBeforeRender(() => {
    if (cropMesh && !cropMesh.isDisposed() && tile.metadata.growth < 100) {
      growthScale = 0.1 + (tile.metadata.growth / 100) * 0.9;
      cropMesh.scaling = new BABYLON.Vector3(growthScale, growthScale, growthScale);
    }
  });

  // Decrease seed count based on seed type
  const seedKey = seedItem.name.toLowerCase().replace(' seeds', '').replace(' ', '');
  if (farmStore.resources.seeds[seedKey] !== undefined) {
    farmStore.resources.seeds[seedKey]--;
  } else if (seedItem.name.includes('Wheat')) {
    farmStore.resources.seeds.wheat--;
  } else if (seedItem.name.includes('Tomato')) {
    if (!farmStore.resources.seeds.tomato) farmStore.resources.seeds.tomato = 15;
    farmStore.resources.seeds.tomato--;
  } else if (seedItem.name.includes('Berry') && !seedItem.name.includes('Oran') && !seedItem.name.includes('Pecha') && !seedItem.name.includes('Cheri')) {
    farmStore.resources.seeds.berries--;
  }

  // Update quest progress
  updateQuestProgress('plant', 1);

  toast.success('Planted!', `${seedItem.name} planted successfully!`);
};

const waterCrop = tile => {
  if (!tile.metadata.watered) {
    tile.metadata.watered = true;
    tile.material.diffuseColor = new BABYLON.Color3(0.3, 0.2, 0.1);
    toast.info('Watered!', 'Crop has been watered');
  }
};

const harvestCrop = tile => {
  if (!scene || !tile) return;
  
  console.log('Harvesting crop:', tile.metadata);

  const cropMesh = scene.getMeshByName(`crop_${tile.metadata.x}_${tile.metadata.z}`);
  const cropType = tile.metadata.cropType;
  
  if (!cropType) {
    console.error('No crop type found for tile:', tile.metadata);
    return;
  }
  
  // Add harvest to inventory based on crop type
  if (cropType.includes('Tomato')) {
    // Add tomatoes to inventory
    let harvestAmount = Math.floor(Math.random() * 4) + 3; // 3-6 tomatoes
    if (!farmStore.resources.items.tomato) farmStore.resources.items.tomato = 0;
    farmStore.resources.items.tomato += harvestAmount;
    farmStore.resources.currency += 30;
    toast.success('Harvested!', `You got ${harvestAmount} Tomatoes! 🍅 +30 coins`);
  } else if (tile.metadata.isPokemonFood) {
    // Add berries or Pokemon food to inventory
    let harvestAmount = Math.floor(Math.random() * 3) + 2; // 2-4 items
    
    if (cropType.includes('Oran Berry')) {
      if (!farmStore.resources.items.oranBerry) farmStore.resources.items.oranBerry = 0;
      farmStore.resources.items.oranBerry += harvestAmount;
      toast.success('Harvested!', `You got ${harvestAmount} Oran Berries! 🔵`);
    } else if (cropType.includes('Pecha Berry')) {
      if (!farmStore.resources.items.pechaBerry) farmStore.resources.items.pechaBerry = 0;
      farmStore.resources.items.pechaBerry += harvestAmount;
      toast.success('Harvested!', `You got ${harvestAmount} Pecha Berries! 🟣`);
    } else if (cropType.includes('Cheri Berry')) {
      if (!farmStore.resources.items.cheriBerry) farmStore.resources.items.cheriBerry = 0;
      farmStore.resources.items.cheriBerry += harvestAmount;
      toast.success('Harvested!', `You got ${harvestAmount} Cheri Berries! 🔴`);
    } else if (cropType.includes('Pokemon Food')) {
      farmStore.resources.items.pokemonFood += harvestAmount * 2;
      toast.success('Harvested!', `You got ${harvestAmount * 2} Pokemon Food! 🍖`);
    } else if (cropType.includes('Berry')) {
      // Generic berries become random berry types
      const berryTypes = ['oranBerry', 'pechaBerry', 'cheriBerry'];
      const randomBerry = berryTypes[Math.floor(Math.random() * berryTypes.length)];
      if (!farmStore.resources.items[randomBerry]) farmStore.resources.items[randomBerry] = 0;
      farmStore.resources.items[randomBerry] += harvestAmount;
      toast.success('Harvested!', `You got ${harvestAmount} berries!`);
    }
    
    // Small coin bonus for Pokemon food
    farmStore.resources.currency += 20;
  } else {
    // Regular crops give more coins
    farmStore.resources.currency += 50;
    toast.success('Harvested!', 'You earned 50 coins! 🪙');
  }

  // Reset tile
  tile.metadata.type = 'empty';
  tile.metadata.isPokemonFood = false;
  tile.metadata.cropType = null;
  tile.metadata.growth = 0;
  tile.metadata.watered = false;
  tile.material.diffuseColor = new BABYLON.Color3(0.4, 0.3, 0.2); // Brown soil color for arable land

  // Remove crop mesh and stem if exists
  if (cropMesh) {
    // Remove stem for tomatoes
    const stem = scene.getMeshByName(`stem_${tile.metadata.x}_${tile.metadata.z}`);
    if (stem) stem.dispose();
    cropMesh.dispose();
  }

  // Update quest progress
  updateQuestProgress('harvest', 1);

  // Check if any Pokemon are nearby and hungry
  checkNearbyHungryPokemon(tile.position);
  
  // Save farm data
  farmStore.saveFarmData();
};

const petPokemon = pokemon => {
  pokemon.happiness = Math.min(100, pokemon.happiness + 5);
  toast.success('Happy Pokemon!', `${pokemon.nickname} is happy! ❤️ +5`);
};

const feedPokemon = pokemon => {
  const foodItem = inventory.value.find(item => item.name === 'Pokemon Food');
  if (!foodItem || foodItem.quantity === 0) {
    toast.error('No Food', 'You need Pokemon Food!');
    return;
  }

  pokemon.hunger = Math.min(100, pokemon.hunger + 20);
  foodItem.quantity--;

  // Update quest progress
  updateQuestProgress('feed', 1);

  toast.success('Fed!', `${pokemon.nickname} has been fed! 🍖 +20`);
};

const expandIsland = async () => {
  const nextExpansion = getNextExpansion.value;
  if (!nextExpansion) {
    toast.info('Maximum Size', 'Your island has reached maximum size!');
    return;
  }
  
  if (playerData.value.currency < nextExpansion.cost) {
    toast.error('Insufficient Funds', `You need ${nextExpansion.cost} coins to expand your island!`);
    return;
  }
  
  // Show confirmation dialog
  if (confirm(`Expand island to ${nextExpansion.size}m diameter for ${nextExpansion.cost} coins?`)) {
    const result = await farmStore.expandIsland(nextExpansion.level);
    
    if (result.success) {
      toast.success('Island Expanded!', `Your island has grown to ${nextExpansion.size}m diameter!`);
      
      // Recreate the entire scene with new island size
      // First, dispose of old meshes
      scene.meshes.forEach(mesh => {
        if (mesh.name !== 'camera') {
          mesh.dispose();
        }
      });
      
      // Recreate everything with new size
      const islandSize = farmStore.farm.islandSize || 50;
      ground = BABYLON.MeshBuilder.CreateGround(
        'ground',
        { width: islandSize, height: islandSize, subdivisions: 50 },
        scene
      );
      
      const grassMaterial = new BABYLON.StandardMaterial('grass', scene);
      grassMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.7, 0.3);
      grassMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
      ground.material = grassMaterial;
      
      // Recreate all elements
      createSea();
      createBeach();
      createFarmGrid();
      createFarmObjects();
      createPokemonMeshes();
      
      // Adjust camera distance for larger island
      const newCameraDistance = islandSize * 0.8;
      camera.radius = newCameraDistance;
      camera.lowerRadiusLimit = newCameraDistance;
      camera.upperRadiusLimit = newCameraDistance;
    } else {
      toast.error('Expansion Failed', result.message);
    }
  }
};

const updateQuestProgress = (type, amount) => {
  dailyQuests.value.forEach(quest => {
    if (type === 'plant' && quest.title.includes('Plant')) {
      quest.progress = Math.min(quest.target, quest.progress + amount);
    } else if (type === 'feed' && quest.title.includes('Feed')) {
      quest.progress = Math.min(quest.target, quest.progress + amount);
    } else if (type === 'harvest' && quest.title.includes('Harvest')) {
      quest.progress = Math.min(quest.target, quest.progress + amount);
    }

    // Check if quest completed
    if (quest.progress >= quest.target && !quest.completed) {
      quest.completed = true;
      playerData.value.currency += quest.reward;
      toast.success('Quest Complete!', `You earned ${quest.reward} coins!`);
    }
  });
};

// Lifecycle
onMounted(async () => {
  try {
    isLoading.value = true;
    loadError.value = null;

    // Initialize farm data with error handling
    try {
      await farmStore.loadFarmData();
      console.log('Farm data loaded successfully');
    } catch (farmError) {
      console.error('Failed to load farm data:', farmError);
      toast.error('Farm Error', 'Failed to load your farm. Using default data.');
      loadError.value = 'Failed to load farm data';
    }

    // Wait for DOM to be ready
    await nextTick();

    // Initialize Babylon scene with a small delay
    setTimeout(() => {
      try {
        initBabylon();
      } catch (babylonError) {
        console.error('Failed to initialize 3D scene:', babylonError);
        toast.error('3D Error', 'Failed to load 3D environment. Please refresh.');
        loadError.value = 'Failed to initialize 3D scene';
        isLoading.value = false;
      }
    }, 100);

    // Start game time
    setInterval(() => {
      try {
        farmStore.updateGameTime();
      } catch (timeError) {
        console.error('Error updating game time:', timeError);
      }
    }, 10000); // Update every 10 seconds
    
    // Start crop growth timer
    cropGrowthInterval = setInterval(() => {
      updateCropGrowth();
    }, 2000); // Update every 2 seconds for faster testing
  } catch (error) {
    console.error('Critical error in onMounted:', error);
    toast.error('Loading Error', 'Failed to initialize game. Please refresh the page.');
    loadError.value = error.message;
    isLoading.value = false;
  }
});

onUnmounted(() => {
  try {
    // Stop Babylon engine if it exists
    if (engine) {
      engine.stopRenderLoop();

      // Dispose scene if it exists
      if (scene) {
        scene.dispose();
      }

      // Dispose engine
      engine.dispose();
    }

    // Clean up event listeners
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
      resizeHandler = null;
    }
    
    // Clear growth timer
    if (cropGrowthInterval) {
      clearInterval(cropGrowthInterval);
    }

    console.log('PokemonFarm cleanup completed');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
});

// Update crop growth
const updateCropGrowth = () => {
  if (!scene) return;
  
  const size = farmStore.farm.farmingArea || { startX: 5, endX: 15, startZ: 8, endZ: 23 };
  
  // Only check arable tiles in farming area
  for (let x = size.startX; x < size.endX; x++) {
    for (let z = size.startZ; z < size.endZ; z++) {
      const tile = scene.getMeshByName(`tile_${x}_${z}`);
      if (tile && tile.metadata && tile.metadata.arable && tile.metadata.type === 'crop' && tile.metadata.growth < 100) {
        // Increase growth
        let growthRate = 20; // Increased for faster testing
        if (tile.metadata.watered) growthRate += 10;
        if (currentWeather.value === 'Sunny') growthRate += 5;
        
        tile.metadata.growth = Math.min(100, tile.metadata.growth + growthRate);
        
        // Update visual if crop is ready
        if (tile.metadata.growth >= 100) {
          const cropMesh = scene.getMeshByName(`crop_${x}_${z}`);
          if (cropMesh && cropMesh.material) {
            // Make crop glow when ready
            cropMesh.material.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0);
            
            console.log(`Crop ready at ${x},${z} - Growth: ${tile.metadata.growth}%`);
            
            // Add sparkle effect for Pokemon food
            if (tile.metadata.isPokemonFood) {
              createSparkleEffect(cropMesh.position);
            }
          }
        }
      }
    }
  }
};

// Create sparkle effect for ready Pokemon food
const createSparkleEffect = (position) => {
  if (!scene) return;
  
  const sparkle = BABYLON.MeshBuilder.CreateBox(
    `sparkle_${Date.now()}`,
    { size: 0.1 },
    scene
  );
  sparkle.position = position.clone();
  sparkle.position.y += 0.5;
  
  const sparkleMaterial = new BABYLON.StandardMaterial(`sparkleMat_${Date.now()}`, scene);
  sparkleMaterial.emissiveColor = new BABYLON.Color3(1, 1, 0);
  sparkle.material = sparkleMaterial;
  
  // Animate sparkle
  let elapsed = 0;
  scene.registerBeforeRender(() => {
    if (sparkle && !sparkle.isDisposed()) {
      elapsed += 0.016;
      sparkle.rotation.y += 0.1;
      sparkle.scaling.x = sparkle.scaling.y = sparkle.scaling.z = Math.sin(elapsed * 3) * 0.5 + 0.5;
      
      if (elapsed > 2) {
        sparkle.dispose();
      }
    }
  });
};

// Helper function to calculate time to harvest
const getTimeToHarvest = (currentGrowth) => {
  const remainingGrowth = 100 - currentGrowth;
  const growthPerInterval = 5; // Base growth rate
  const intervals = Math.ceil(remainingGrowth / growthPerInterval);
  const seconds = intervals * 5; // 5 seconds per interval
  
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  } else {
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }
};

// Add helper functions for feeding Pokemon
const checkNearbyHungryPokemon = (position) => {
  farmPokemon.value.forEach(pokemon => {
    if ((pokemon.location === 'farm' || pokemon.location === 'Farm') && pokemon.hunger < 50) {
      // Calculate distance
      const dx = (pokemon.x || 0) - position.x;
      const dz = (pokemon.z || 0) - position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      if (distance < 3) {
        // Pokemon is close to harvested food
        toast.info('Hungry Pokemon!', `${pokemon.nickname} looks hungry and interested in the harvest!`);
      }
    }
  });
};

// Visual effect when feeding Pokemon
const createFeedingEffect = (pokemon) => {
  if (!scene) return;
  
  // Find the Pokemon's mesh
  const pokemonMesh = scene.getMeshByName(`pokemon_${pokemon.id}`);
  if (pokemonMesh) {
    // Create heart particles
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const heart = BABYLON.MeshBuilder.CreatePlane(
          `heart_${Date.now()}_${i}`,
          { size: 0.3 },
          scene
        );
        heart.position = pokemonMesh.position.clone();
        heart.position.y += 1.5;
        heart.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        
        const heartMaterial = new BABYLON.StandardMaterial(`heartMat_${Date.now()}_${i}`, scene);
        heartMaterial.diffuseColor = new BABYLON.Color3(1, 0.2, 0.4);
        heartMaterial.emissiveColor = new BABYLON.Color3(1, 0.2, 0.4);
        heart.material = heartMaterial;
        
        // Animate heart floating up
        let elapsed = 0;
        scene.registerBeforeRender(() => {
          if (heart && !heart.isDisposed()) {
            elapsed += 0.016;
            heart.position.y += 0.02;
            heart.scaling.x = heart.scaling.y = 1 - elapsed * 0.5;
            heart.material.alpha = 1 - elapsed;
            
            if (elapsed > 1) {
              heart.dispose();
            }
          }
        });
      }, i * 200);
    }
  }
};
</script>

<style scoped>
.pokemon-farm-container {
  /* @apply h-screen flex flex-col overflow-hidden bg-gray-50; */
}

/* Transitions */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}

/* Tree expand transition */
.tree-expand-enter-active,
.tree-expand-leave-active {
  transition: all 0.2s ease-in-out;
  transform-origin: top;
}

.tree-expand-enter-from,
.tree-expand-leave-to {
  opacity: 0;
  transform: scaleY(0);
}
</style>
