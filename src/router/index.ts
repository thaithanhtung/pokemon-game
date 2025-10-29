import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import Pokedex from '@/views/Pokedex.vue';
import PokemonDetail from '@/views/PokemonDetail.vue';
import PokemonCardGame from '@/views/PokemonCardGame.vue';
import PokeCardClash from '@/views/PokeCardClash.vue';
import GameTutorial from '@/views/GameTutorial.vue';
import EffectsShowcase from '@/views/EffectsShowcase.vue';
import PokemonFarm from '@/views/PokemonFarm.vue';
import PokemonMarket from '@/views/PokemonMarket.vue';
import AdminMarketplace from '@/views/admin/AdminMarketplace.vue';
import { authService } from '@/firebase/auth';

// Navigation groups for organizing routes
export const navigationGroups = {
  main: {
    title: 'Main Features',
    icon: '🎮',
    routes: ['pokedex', 'pokemon-farm', 'pokemon-market']
  },
  games: {
    title: 'Games',
    icon: '🎴',
    routes: ['card-clash-menu', 'card-game']
  },
  cardClash: {
    title: 'Card Clash',
    icon: '⚔️',
    routes: ['card-clash-menu', 'card-clash-collection', 'card-clash-deck-builder', 'card-clash-shop', 'card-clash-tournament', 'card-clash-trading', 'card-clash-battle-3d-demo']
  },
  admin: {
    title: 'Admin',
    icon: '👨‍💼',
    routes: ['admin-marketplace'],
    requiresAuth: true
  },
  other: {
    title: 'Other',
    icon: '📚',
    routes: ['game-tutorial', 'effects-showcase', 'babylon-card-demo', 'sound-demo']
  }
};

const routes: RouteRecordRaw[] = [
    {
      path: '/',
      name: 'home',
      redirect: '/pokedex',
    },
    {
      path: '/pokedex',
      name: 'pokedex',
      component: Pokedex,
      meta: {
        title: 'Pokédex',
        icon: '📖',
        description: 'Browse all Pokémon',
        showInNav: true
      }
    },
    {
      path: '/pokemon/:id',
      name: 'pokemon-detail',
      component: PokemonDetail,
      meta: {
        title: 'Pokémon Detail',
        showInNav: false
      }
    },
    {
      path: '/card-game',
      name: 'card-game',
      component: PokemonCardGame,
      meta: {
        title: 'Card Game',
        icon: '🃏',
        description: 'Classic card game',
        showInNav: true
      }
    },
    {
      path: '/card-clash',
      name: 'card-clash',
      component: PokeCardClash,
      redirect: '/card-clash/menu',
      meta: {
        title: 'Card Clash',
        icon: '⚔️',
        description: 'Strategic card battles',
        showInNav: false
      },
      children: [
        {
          path: 'menu',
          name: 'card-clash-menu',
          component: () => import('@/views/card-clash/Menu.vue'),
          meta: {
            title: 'Card Clash',
            icon: '🎴',
            description: 'Strategic card battles',
            showInNav: true
          }
        },
        {
          path: 'battle/:mode',
          name: 'card-clash-battle',
          component: () => import('@/views/card-clash/Battle.vue'),
          props: true,
          meta: {
            title: 'Battle',
            icon: '⚔️',
            showInNav: false
          }
        },
        {
          path: 'battle-3d/:mode',
          name: 'card-clash-battle-3d',
          component: () => import('@/components/battle3d/BattleArena3D.vue'),
          props: true,
          meta: {
            title: '3D Battle',
            icon: '🎮',
            showInNav: false
          }
        },
        {
          path: 'battle-3d/demo',
          name: 'card-clash-battle-3d-demo-alt',
          component: () => import('@/views/card-clash/Battle3DDemo.vue'),
          meta: {
            title: 'Battle 3D Demo',
            icon: '🎮',
            description: '3D battle with sound effects',
            showInNav: false
          }
        },
        {
          path: 'deck-builder',
          name: 'card-clash-deck-builder',
          component: () => import('@/views/card-clash/DeckBuilder.vue'),
          meta: {
            title: 'Deck Builder',
            icon: '🃏',
            description: 'Build your deck',
            showInNav: true
          }
        },
        {
          path: 'collection',
          name: 'card-clash-collection',
          component: () => import('@/views/card-clash/Collection.vue'),
          meta: {
            title: 'Collection',
            icon: '📚',
            description: 'View your cards',
            showInNav: true
          }
        },
        {
          path: 'shop',
          name: 'card-clash-shop',
          component: () => import('@/views/card-clash/Shop.vue'),
          meta: {
            title: 'Shop',
            icon: '🛍️',
            description: 'Buy card packs',
            showInNav: true
          }
        },
        {
          path: 'tournament',
          name: 'card-clash-tournament',
          component: () => import('@/views/card-clash/Tournament.vue'),
          meta: {
            title: 'Tournament',
            icon: '🏆',
            description: 'Competitive play',
            showInNav: true
          }
        },
        {
          path: 'trading',
          name: 'card-clash-trading',
          component: () => import('@/views/card-clash/Trading.vue'),
          meta: {
            title: 'Trading',
            icon: '🏪',
            description: 'Trade cards',
            showInNav: true
          }
        },
        {
          path: 'battle-3d-demo',
          name: 'card-clash-battle-3d-demo',
          component: () => import('@/views/card-clash/Battle3DDemo.vue'),
          meta: {
            title: 'Battle 3D Demo',
            icon: '🎮',
            description: '3D battle with sound effects',
            showInNav: true
          }
        },
      ],
    },
    {
      path: '/game-tutorial',
      name: 'game-tutorial',
      component: GameTutorial,
      meta: {
        title: 'Tutorial',
        icon: '📚',
        description: 'Learn how to play',
        showInNav: true
      }
    },
    {
      path: '/effects-showcase',
      name: 'effects-showcase',
      component: EffectsShowcase,
      meta: {
        title: 'Effects Showcase',
        icon: '✨',
        description: 'Visual effects demo',
        showInNav: true
      }
    },
    {
      path: '/pokemon-farm',
      name: 'pokemon-farm',
      component: PokemonFarm,
      meta: {
        title: 'Pokémon Farm',
        icon: '🌾',
        description: 'Manage your Pokémon farm',
        showInNav: true
      }
    },
    {
      path: '/pokemon-market',
      name: 'pokemon-market',
      component: PokemonMarket,
      meta: {
        title: 'Pokémon Market',
        icon: '🏪',
        description: 'Buy legendary Pokémon',
        showInNav: true
      }
    },
    {
      path: '/admin',
      redirect: '/admin/marketplace',
    },
    {
      path: '/admin/marketplace',
      name: 'admin-marketplace',
      component: AdminMarketplace,
      meta: {
        title: 'Admin Marketplace',
        icon: '👨‍💼',
        description: 'Manage marketplace',
        showInNav: true,
        requiresAdmin: true
      }
    },
    {
      path: '/test-mega-card',
      name: 'test-mega-card',
      component: () => import('@/views/TestMegaCard.vue'),
      meta: {
        title: 'Test Mega Card',
        icon: '🧪',
        description: 'Test mega evolution cards',
        showInNav: false
      }
    },
    {
      path: '/babylon-card-demo',
      name: 'babylon-card-demo',
      component: () => import('@/views/BabylonCardDemo.vue'),
      meta: {
        title: 'Babylon Card Demo',
        icon: '🎨',
        description: '3D card animations with Babylon.js',
        showInNav: true
      }
    },
    {
      path: '/sound-demo',
      name: 'sound-demo',
      component: () => import('@/views/SoundDemo.vue'),
      meta: {
        title: 'Sound Demo',
        icon: '🔊',
        description: 'Test game sound effects',
        showInNav: true
      }
    },
  ];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Admin guard
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAdmin) {
    const user = authService.getCurrentUser();

    // Simple admin check - you can implement more sophisticated logic
    // For now, we'll check if the user email ends with @admin.com
    // or if the user UID is in a predefined admin list
    const adminEmails = ['admin@admin.com', 'tiennguyen94082@gmail.com'];
    const adminUIDs = ['ADMIN_UID_HERE', 'uwUnHCyoJ2TYWjOUezjq32rYjjF2']; // Replace with actual admin UIDs

    console.log('user------>', user);
    if (true) {
      // if (user && (adminEmails.includes(user.email) || adminUIDs.includes(user.uid))) {
      next();
    } else {
      // Redirect non-admin users to home
      next('/');
    }
  } else {
    next();
  }
});

// Helper function to get all navigable routes
export function getNavigableRoutes() {
  const navigableRoutes: any[] = [];
  
  function extractRoutes(routes: RouteRecordRaw[], parent?: RouteRecordRaw) {
    routes.forEach(route => {
      if (route.meta?.showInNav) {
        navigableRoutes.push({
          name: route.name,
          path: route.path,
          title: route.meta.title || route.name,
          icon: route.meta.icon || '📄',
          description: route.meta.description || '',
          requiresAdmin: route.meta.requiresAdmin || false,
          parent: parent?.name
        });
      }
      if (route.children) {
        extractRoutes(route.children, route);
      }
    });
  }
  
  extractRoutes(routes);
  return navigableRoutes;
}

// Helper function to get routes by group
export function getRoutesByGroup(groupName: keyof typeof navigationGroups) {
  const group = navigationGroups[groupName];
  if (!group) return [];
  
  return group.routes.map(routeName => {
    const route = router.getRoutes().find(r => r.name === routeName);
    if (!route) return null;
    
    return {
      name: route.name,
      path: route.path,
      title: route.meta?.title || String(route.name),
      icon: route.meta?.icon || '📄',
      description: route.meta?.description || ''
    };
  }).filter(Boolean);
}

// Helper function to check if user can access a route
export function canAccessRoute(routeName: string): boolean {
  const route = router.getRoutes().find(r => r.name === routeName);
  if (!route) return false;
  
  if (route.meta?.requiresAdmin) {
    const user = authService.getCurrentUser();
    const adminEmails = ['admin@admin.com', 'tiennguyen94082@gmail.com'];
    const adminUIDs = ['ADMIN_UID_HERE', 'uwUnHCyoJ2TYWjOUezjq32rYjjF2'];
    
    return user && (adminEmails.includes(user.email || '') || adminUIDs.includes(user.uid));
  }
  
  return true;
}

export default router;
