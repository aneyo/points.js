<script lang="ts" setup>
import { ApiClient } from "@twurple/api";
import { StaticAuthProvider } from "@twurple/auth";
import { ref, watch } from "vue";
import { Reward, useStore } from "../store";

const options = ref<Reward[]>([]);

const store = useStore();

const model = defineModel<Reward | null | undefined>("selected", {
  default: null,
});
const { token } = defineProps({ token: String });

const isLoading = ref(true);
watch(
  () => token,
  async () => {
    console.log("token!", token);
    if (token == null || store.channel == null) return;
    isLoading.value = true;

    try {
      const auth = new StaticAuthProvider(
        "loh6hmf1odxlkqbgmv7b22lw4bl5rm",
        token
      );
      const api = new ApiClient({ authProvider: auth });

      options.value = (
        await api.channelPoints.getCustomRewards(store.channel.id)
      ).map((r) => ({
        id: r.id,
        name: r.title,
        description: r.prompt,
        enabled: r.isEnabled && !r.isPaused,
        color: r.backgroundColor,
        cost: r.cost,
        icon: r.getImageUrl(2),
      }));

      model.value = options.value.find((v) => v.id === store.config?.reward);
    } catch (error) {
      console.error(error);
      return;
    }
    isLoading.value = false;
  },
  {
    immediate: true,
  }
);
</script>

<template>
  <it-select
    v-model="model"
    :options="options"
    :disabled="isLoading"
    track-by="id"
    index="id"
    :class="{ selected: model?.id != null }"
  >
    <template v-slot:label-top="{ props }"> Награда для звуков </template>

    <template v-slot:placeholder="{ props }">
      <div class="items-center" :style="{ display: 'flex' }">
        <span>{{
          isLoading ? "Загружаем награды..." : "Выберите награду..."
        }}</span>
      </div>
    </template>

    <template v-slot:selected-option="{ props }">
      <div class="reward-option">
        <img :src="model!.icon" :style="{ '--bg': model!.color }" />
        <div class="info">
          <div class="title">{{ model!.name }}</div>
          <div class="price">
            {{ Intl.NumberFormat().format(model!.cost) }}p
          </div>
        </div>
      </div>
    </template>

    <template v-slot:option="{ props, option }">
      <div class="reward-option">
        <img :src="option.icon" :style="{ '--bg': option.color }" />
        <div class="info">
          <div class="title">{{ option.name }}</div>
          <div class="price">
            {{ Intl.NumberFormat().format(option.cost) }}p
          </div>
        </div>
      </div>
    </template>
  </it-select>
</template>

<style lang="scss" scoped>
.reward-option {
  display: flex;
  gap: 0.5rem;
  z-index: 100;
  position: relative;
  align-items: center;

  & > img {
    width: 1.5rem;
    height: 1.5rem;
    padding: 0.5rem;
    background-color: var(--bg, #e4e4e4);
    border-radius: 0.3rem;
  }
  & > .info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    & > .title {
      font-size: 0.9rem;
    }

    & > .price {
      opacity: 0.5;
      font-size: 0.7rem;
    }
  }

  &.compact {
    & > img {
      width: 1rem;
      height: 1rem;
      padding: 0.2rem;
    }
  }
}

:global(.selected .it-select-selection) {
  padding: 0.5rem;
  height: 3.5rem;
}
</style>
