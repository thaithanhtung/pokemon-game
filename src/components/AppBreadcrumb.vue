<template>
  <nav class="app-breadcrumb" v-if="breadcrumbs.length > 0">
    <ol>
      <li v-for="(crumb, index) in breadcrumbs" :key="index">
        <router-link 
          v-if="index < breadcrumbs.length - 1" 
          :to="{ name: crumb.name }"
          class="breadcrumb-link"
        >
          <span class="breadcrumb-icon">{{ crumb.icon }}</span>
          <span class="breadcrumb-title">{{ crumb.title }}</span>
        </router-link>
        <span v-else class="breadcrumb-current">
          <span class="breadcrumb-icon">{{ crumb.icon }}</span>
          <span class="breadcrumb-title">{{ crumb.title }}</span>
        </span>
        <span v-if="index < breadcrumbs.length - 1" class="breadcrumb-separator">
          <i class="fas fa-chevron-right"></i>
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const breadcrumbs = computed(() => {
  const crumbs = [];
  
  // Always add home
  crumbs.push({
    name: 'pokedex',
    title: 'Home',
    icon: '🏠'
  });
  
  // Add parent route if exists
  if (route.matched.length > 1) {
    route.matched.forEach((matchedRoute, index) => {
      // Skip the first one as it's usually the layout
      if (index === 0 && !matchedRoute.meta?.title) return;
      
      // Skip if no meta title
      if (!matchedRoute.meta?.title) return;
      
      // Skip if it's a redirect route
      if (matchedRoute.redirect) return;
      
      crumbs.push({
        name: matchedRoute.name,
        title: matchedRoute.meta.title,
        icon: matchedRoute.meta.icon || '📄'
      });
    });
  } else if (route.meta?.title) {
    // Add current route
    crumbs.push({
      name: route.name,
      title: route.meta.title,
      icon: route.meta.icon || '📄'
    });
  }
  
  // Remove duplicates
  const uniqueCrumbs = crumbs.filter((crumb, index, self) =>
    index === self.findIndex((c) => c.name === crumb.name)
  );
  
  return uniqueCrumbs;
});
</script>

<style scoped>
.app-breadcrumb {
  background: white;
  padding: 12px 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.app-breadcrumb ol {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.app-breadcrumb li {
  display: flex;
  align-items: center;
  gap: 8px;
}

.breadcrumb-link {
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  color: #666;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.breadcrumb-link:hover {
  background: #f5f5f5;
  color: #333;
}

.breadcrumb-current {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #333;
  font-weight: 600;
  padding: 6px 12px;
  font-size: 0.9rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 6px;
}

.breadcrumb-icon {
  font-size: 1rem;
}

.breadcrumb-separator {
  color: #ccc;
  font-size: 0.8rem;
}

/* Responsive */
@media (max-width: 768px) {
  .app-breadcrumb {
    padding: 10px 15px;
    margin-bottom: 15px;
  }
  
  .breadcrumb-link,
  .breadcrumb-current {
    padding: 4px 8px;
    font-size: 0.85rem;
  }
  
  .breadcrumb-title {
    display: none;
  }
  
  .breadcrumb-link:last-child .breadcrumb-title,
  .breadcrumb-current .breadcrumb-title {
    display: inline;
  }
}
</style>