<template>
  <div ref="container" :class="['lottie-container', rootClass]"></div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import lottie from 'lottie-web';

const props = defineProps({
  src: { type: String, required: true },
  loop: { type: Boolean, default: false },
  autoplay: { type: Boolean, default: true },
  speed: { type: Number, default: 1 },
  rootClass: { type: String, default: '' },
});

const container = ref(null);
let anim = null;

const load = async () => {
  if (!container.value || !props.src) return;
  try {
    const res = await fetch(props.src, { cache: 'no-store' });
    const json = await res.json();
    if (anim) {
      anim.destroy();
      anim = null;
    }
    anim = lottie.loadAnimation({
      container: container.value,
      renderer: 'svg',
      loop: props.loop,
      autoplay: props.autoplay,
      animationData: json,
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
    });
    anim.setSpeed(props.speed);
    anim.addEventListener('data_failed', () => console.error('Lottie data_failed', props.src));
  } catch (e) {
    console.error('Lottie load error', props.src, e);
  }
};

onMounted(load);

onBeforeUnmount(() => {
  if (anim) {
    anim.destroy();
    anim = null;
  }
});

watch(
  () => props.src,
  () => {
    if (anim) {
      anim.destroy();
      anim = null;
    }
    load();
  }
);
</script>

<style scoped>
.lottie-container {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>
