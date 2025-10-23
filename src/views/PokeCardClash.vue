<template>
  <FirebaseAuth>
    <router-view />
    <!-- Debug Component (only in development) -->
    <!-- <FirebaseDebug v-if="isDev" /> -->
  </FirebaseAuth>
</template>

<script setup>
import { computed } from 'vue';
import FirebaseAuth from '@/components/FirebaseAuth.vue';
</script>
