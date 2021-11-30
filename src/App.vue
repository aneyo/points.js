<script setup lang="ts">
import "./style/reset.css";
import "./style/main.scss";
import "./style/icons.css";
import "equal-vue/dist/style.css";

import { useStore } from "./store";
import Welcome from "./pages/Welcome.vue";
import Home from "./pages/Home.vue";
import { onMounted, ref } from "vue-demi";

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
</script>

<template>
  <div class="loading" v-if="loading">
    <it-loading />
  </div>

  <Welcome v-if="!loading && !store.token"></Welcome>
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
