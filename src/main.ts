import './assets/main.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { initializeFirebase } from './firebase/init';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Initialize Firebase before mounting the app
initializeFirebase().then(() => {
  console.log('Firebase initialized, mounting app...');
  app.mount('#app-vue');
});
