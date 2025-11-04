<template>
  <nav class="app-navigation">
    <!-- Mobile Menu Toggle -->
    <button
      @click="isMenuOpen = !isMenuOpen"
      class="mobile-menu-toggle"
      aria-label="Toggle navigation menu"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>

    <!-- Navigation Menu -->
    <div class="navigation-wrapper" :class="{ 'is-open': isMenuOpen }">
      <div class="navigation-header">
        <h2>Navigation</h2>
        <button @click="isMenuOpen = false" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- User Info Section -->
      <div class="user-info-section">
        <div class="user-avatar">
          <img
            :src="playerStore.player?.avatar || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'"
            :alt="playerStore.player?.name || 'Trainer'"
            @error="handleAvatarError"
          />
        </div>
        <div class="user-details">
          <div class="user-name">{{ playerStore.player?.name || 'Trainer' }}</div>
          <div class="user-level"><span>⭐</span> Level {{ playerStore.player?.level || 1 }}</div>
        </div>
        <div class="user-stats">
          <div class="stat-item">
            <span class="stat-icon">💎</span>
            <span class="stat-value">{{ playerStore.player?.gems || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">🪙</span>
            <span class="stat-value">{{ playerStore.player?.coins || 0 }}</span>
          </div>
        </div>
      </div>

      <div class="navigation-content">
        <!-- Main Features -->
        <div class="nav-group">
          <h3>
            <span class="group-icon">{{ navigationGroups.main.icon }}</span>
            {{ navigationGroups.main.title }}
          </h3>
          <ul>
            <li v-for="route in getGroupRoutes('main')" :key="route.name">
              <router-link
                :to="{ name: route.name }"
                @click="isMenuOpen = false"
                :class="{ active: $route.name === route.name }"
              >
                <span class="route-icon">{{ route.icon }}</span>
                <span class="route-title">{{ route.title }}</span>
                <span v-if="route.description" class="route-description">{{
                  route.description
                }}</span>
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Games -->
        <div class="nav-group">
          <h3>
            <span class="group-icon">{{ navigationGroups.games.icon }}</span>
            {{ navigationGroups.games.title }}
          </h3>
          <ul>
            <li v-for="route in getGroupRoutes('games')" :key="route.name">
              <router-link
                :to="{ name: route.name }"
                @click="isMenuOpen = false"
                :class="{ active: $route.name === route.name }"
              >
                <span class="route-icon">{{ route.icon }}</span>
                <span class="route-title">{{ route.title }}</span>
                <span v-if="route.description" class="route-description">{{
                  route.description
                }}</span>
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Card Clash Submenu -->
        <div class="nav-group" v-if="isInCardClash">
          <h3>
            <span class="group-icon">{{ navigationGroups.cardClash.icon }}</span>
            {{ navigationGroups.cardClash.title }}
          </h3>
          <ul>
            <li v-for="route in getGroupRoutes('cardClash')" :key="route.name">
              <router-link
                :to="{ name: route.name }"
                @click="isMenuOpen = false"
                :class="{ active: $route.name === route.name }"
              >
                <span class="route-icon">{{ route.icon }}</span>
                <span class="route-title">{{ route.title }}</span>
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Admin (if user has access) -->
        <div class="nav-group" v-if="showAdminRoutes">
          <h3>
            <span class="group-icon">{{ navigationGroups.admin.icon }}</span>
            {{ navigationGroups.admin.title }}
          </h3>
          <ul>
            <li v-for="route in getGroupRoutes('admin')" :key="route.name">
              <router-link
                :to="{ name: route.name }"
                @click="isMenuOpen = false"
                :class="{ active: $route.name === route.name }"
              >
                <span class="route-icon">{{ route.icon }}</span>
                <span class="route-title">{{ route.title }}</span>
                <span v-if="route.description" class="route-description">{{
                  route.description
                }}</span>
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Other -->
        <div class="nav-group">
          <h3>
            <span class="group-icon">{{ navigationGroups.other.icon }}</span>
            {{ navigationGroups.other.title }}
          </h3>
          <ul>
            <li v-for="route in getGroupRoutes('other')" :key="route.name">
              <router-link
                :to="{ name: route.name }"
                @click="isMenuOpen = false"
                :class="{ active: $route.name === route.name }"
              >
                <span class="route-icon">{{ route.icon }}</span>
                <span class="route-title">{{ route.title }}</span>
                <span v-if="route.description" class="route-description">{{
                  route.description
                }}</span>
              </router-link>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Overlay for mobile -->
    <div
      class="navigation-overlay"
      :class="{ 'is-open': isMenuOpen }"
      @click="isMenuOpen = false"
    ></div>
  </nav>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { navigationGroups, getRoutesByGroup, canAccessRoute } from '@/router';
import { usePlayerStore } from '@/stores/player';

const route = useRoute();
const playerStore = usePlayerStore();
const isMenuOpen = ref(false);

watch(playerStore.player, newPlayer => {
  console.log('Player updated:', newPlayer);
});

// Handle avatar error
const handleAvatarError = event => {
  // Use Pikachu sprite as fallback
  event.target.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png';
};

// Check if current route is in card clash section
const isInCardClash = computed(() => {
  return route.name?.toString().startsWith('card-clash');
});

// Check if admin routes should be shown
const showAdminRoutes = computed(() => {
  return canAccessRoute('admin-marketplace');
});

// Get routes for a specific group
function getGroupRoutes(groupName) {
  return getRoutesByGroup(groupName).filter(route => route && canAccessRoute(route.name));
}
</script>

<style scoped>
.app-navigation {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1000;
}

/* Mobile Menu Toggle */
.mobile-menu-toggle {
  width: 50px;
  height: 50px;
  background: white;
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.3s ease;
}

.mobile-menu-toggle:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.mobile-menu-toggle span {
  width: 24px;
  height: 3px;
  background: #333;
  border-radius: 2px;
  transition: all 0.3s ease;
}

/* Navigation Wrapper */
.navigation-wrapper {
  position: fixed;
  top: 0;
  left: -320px;
  width: 300px;
  height: 100vh;
  background: white;
  box-shadow: 2px 0 20px rgba(0, 0, 0, 0.1);
  transition: left 0.3s ease;
  overflow-y: auto;
  z-index: 999;
}

.navigation-wrapper.is-open {
  left: 0;
}

/* Navigation Header */
.navigation-header {
  position: sticky;
  top: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
}

.navigation-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: background 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* User Info Section */
.user-info-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-details {
  text-align: center;
  color: white;
}

.user-name {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 5px;
}

.user-level {
  font-size: 0.9rem;
  opacity: 0.9;
  display: flex;
  align-items: center;
  gap: 5px;
  justify-content: center;
}

.user-stats {
  display: flex;
  gap: 20px;
  background: rgba(255, 255, 255, 0.2);
  padding: 10px 20px;
  border-radius: 10px;
  backdrop-filter: blur(10px);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
}

.stat-icon {
  font-size: 1.2rem;
}

.stat-value {
  font-weight: 600;
  font-size: 1.1rem;
}

/* Navigation Content */
.navigation-content {
  padding: 20px;
}

/* Nav Groups */
.nav-group {
  margin-bottom: 30px;
}

.nav-group h3 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 15px;
  font-size: 1.1rem;
  color: #333;
  padding-bottom: 10px;
  border-bottom: 2px solid #f0f0f0;
}

.group-icon {
  font-size: 1.3rem;
}

.nav-group ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-group li {
  margin-bottom: 5px;
}

.nav-group a {
  display: flex;
  flex-direction: column;
  padding: 12px 15px;
  border-radius: 10px;
  text-decoration: none;
  color: #333;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.nav-group a:hover {
  background: #f5f5f5;
  border-color: #e0e0e0;
  transform: translateX(5px);
}

.nav-group a.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.nav-group a.active .route-description {
  color: rgba(255, 255, 255, 0.8);
}

.route-icon {
  font-size: 1.2rem;
  margin-bottom: 5px;
}

.route-title {
  font-weight: 600;
  font-size: 0.95rem;
}

.route-description {
  font-size: 0.8rem;
  color: #666;
  margin-top: 2px;
}

/* Navigation Overlay */
.navigation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 998;
}

.navigation-overlay.is-open {
  opacity: 1;
  visibility: visible;
}

/* Desktop Styles */
@media (min-width: 768px) {
  .mobile-menu-toggle span:first-child {
    width: 28px;
  }

  .mobile-menu-toggle span:last-child {
    width: 20px;
  }

  .navigation-wrapper {
    width: 320px;
    left: -340px;
  }
}

/* Animations */
@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.nav-group {
  animation: slideIn 0.4s ease-out;
  animation-fill-mode: both;
}

.nav-group:nth-child(1) {
  animation-delay: 0.1s;
}
.nav-group:nth-child(2) {
  animation-delay: 0.2s;
}
.nav-group:nth-child(3) {
  animation-delay: 0.3s;
}
.nav-group:nth-child(4) {
  animation-delay: 0.4s;
}
.nav-group:nth-child(5) {
  animation-delay: 0.5s;
}
</style>
