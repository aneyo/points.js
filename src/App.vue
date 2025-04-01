<script setup lang="ts">
import "./style/reset.css";
import "./style/main.scss";
import "./style/icons.css";
import "equal-vue/dist/style.css";
import "./style/theme.scss";
import "./style/components.scss";

import { useStore } from "./store";
import Home from "./pages/Home.vue";
import { onMounted, ref, watch } from "vue-demi";
import Landing from "./pages/Landing.vue";

const store = useStore();
const loading = ref(true);

onMounted(async () => {
  loading.value = true;

  await store.load();
  if (!store.token) return (loading.value = false);

  try {
    await store.fetchUser();
  } catch {
    await store.reset(false);
  }

  loading.value = false;
});

watch(
  () => store.config?.theme,
  () => {
    const theme = store.config?.theme ?? "auto";
    document.documentElement.setAttribute("theme", theme);
  },
  { immediate: true }
);
</script>

<template>
  <div class="loading" v-if="loading">
    <it-loading />
  </div>

  <Landing v-if="!loading && !store.token"></Landing>
  <Home v-if="!loading && store.token && store.channel"></Home>
</template>

<style lang="scss" scoped>
.loading {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
