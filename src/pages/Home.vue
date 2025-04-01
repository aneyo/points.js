<script lang="ts" setup>
import {
  ref,
  computed,
  watch,
  inject,
  onMounted,
  onBeforeMount,
} from "vue-demi";
import { useStore, Reward } from "../store";
import copy from "copy-to-clipboard";
import SoundSelect from "../components/SoundSelect.vue";

const message: any = inject("$message");

const store = useStore();
const name = computed(
  () => store.channel!.display_name || store.channel!.login
);

const token = ref(store.token + "");
const volume = ref(store.config!.volume * 100);
const rewardObject = ref<null | Reward>(null);

watch(
  () => volume.value,
  () => {
    store.config!.volume = volume.value / 100;
  }
);

watch(
  () => token.value,
  () => {
    if (validators.token.value) store.token = token.value;
  }
);

watch(
  () => store.config,
  async () => {
    await store.save();
  },
  { deep: true }
);

watch(
  () => rewardObject.value,
  () => {
    if (store.config == null) return;
    if (rewardObject.value == null) {
      store.config.reward = undefined;
      return;
    }
    store.config.reward = rewardObject.value.id;
  }
);

const volumeIcon = computed(() => {
  switch (true) {
    case volume.value >= 80:
      return "volume_up";

    case volume.value >= 40:
      return "volume_down";

    case volume.value > 0:
      return "volume_mute";

    default:
      return "volume_off";
  }
});

const validators = {
  token: computed(
    () => typeof token.value === "string" && token.value.trim() !== ""
  ),
  list: computed(
    () =>
      typeof store.config?.list === "string" && store.config.list.trim() !== ""
  ),
  reward: computed(
    () =>
      typeof store.config?.reward === "string" &&
      store.config.reward.trim() !== ""
  ),
};

const isValid = computed(
  () =>
    validators.list.value && validators.reward.value && validators.token.value
);

const generatedLink = computed(() => {
  const head = "https://aneyo.github.io/points.js/widget#";
  const params = new URLSearchParams();

  params.set("l", store.config!.list);
  params.set("c", store.channel!.login);
  params.set("v", store.config!.volume.toString());
  params.set("r", store.config!.reward!);

  // positions
  if (store.config?.pos.h == "left") params.set("left", "");
  else params.set("right", "");
  if (store.config?.pos.v == "top") params.set("top", "");
  else params.set("bottom", "");

  const visibleLink = head + params.toString();

  params.set("t", store.token!);

  return [visibleLink, head + params.toString()];
});

const showDialog = ref(false);

function copyLink() {
  if (copy(generatedLink.value[1]))
    message.success({ text: "Ссылка скопирована!", duration: 1500 });
}

async function logout() {
  const name = store.channel!.login;
  await store.reset();
  message.success({ text: `Вы вышли из аккаунта @${name}!`, duration: 1500 });
}

onBeforeMount(() => {
  store.config!.pos ??= { v: "top", h: "right" };
});
</script>

<template>
  <div class="editor">
    <div class="user">
      <it-avatar
        :src="store.channel!.profile_image_url"
        :text="name"
        size="60px"
      />
      <div class="message">Привет, {{ name }}!</div>

      <it-tooltip content="Выйти из аккаунта">
        <it-button text icon="logout" @click="logout" />
      </it-tooltip>
    </div>

    <it-input
      label-top="Список звуков"
      prefix-icon="summarize"
      placeholder="https://gist.githubusercontent.com/aneyo/4566b18ed624ac7c2b28daaedc28c7dd/raw/points.txt"
      v-model.trim="store.config!.list"
      :status="validators.list.value ? null : 'danger'"
      :message="validators.list.value ? null : 'Нужно указать ссылку на лист!'"
    />

    <SoundSelect :token="token" v-model:selected="rewardObject" />

    <span class="it-input-label" style="margin-bottom: -0.5rem">
      Где показывать награды
    </span>
    <div style="display: flex; gap: 0.3rem; align-items: center">
      <it-select v-model="store.config!.pos.h" :options="['left', 'right']">
        <template v-slot:selected-option="{ props }">
          {{ store.config!.pos.h == "left" ? "Слева" : "Справа" }}
        </template>
        <template v-slot:option="{ props, option }">
          {{ option == "left" ? "Слева" : "Справа" }}
        </template>
      </it-select>
      <span>+</span>
      <it-select v-model="store.config!.pos.v" :options="['top', 'bottom']">
        <template v-slot:selected-option="{ props }">
          {{ store.config!.pos.v == "top" ? "Сверху" : "Снизу" }}
        </template>
        <template v-slot:option="{ props, option }">
          {{ option == "top" ? "Сверху" : "Снизу" }}
        </template>
      </it-select>
    </div>

    <span class="it-input-label volume-label">
      <it-icon :name="volumeIcon" />
      <span>Громкость звуков</span>
    </span>
    <it-slider
      v-model="volume"
      numbers
      :min="0"
      :step="1"
      :stepPoints="true"
      :max="100"
    />
  </div>

  <div class="action" v-if="isValid && !showDialog">
    <div class="container">
      <it-button icon="reply" block @click="showDialog = true">
        <span>Генерировать ссылку</span>
      </it-button>
    </div>
  </div>

  <it-modal v-model="showDialog">
    <template #image>
      <img src="https://c.tenor.com/krxN3ycuDygAAAAC/happy-anime.gif" />
    </template>

    <template #body>
      <div class="modal">
        <div class="modal-buttons">
          <it-button
            pulse
            block
            type="primary"
            icon="content_copy"
            @click="copyLink"
          >
            <span>Копировать ссылку</span>
          </it-button>
          <it-button @click="showDialog = false">Закрыть</it-button>
        </div>
      </div>
    </template>
  </it-modal>
</template>

<style lang="scss" scoped>
.editor {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  padding: 2rem 0 5rem 0;

  & > .user {
    gap: 1rem;
    display: flex;
    align-items: center;

    & > .message {
      flex: 1;
      font-size: 1.2rem;
      font-weight: 600;
    }

    & > .it-avatar {
      user-select: none;
    }
  }

  & > .volume-label {
    margin-top: 1rem !important;
    margin-bottom: 0 !important;

    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
}

.action {
  position: fixed;
  left: 0;
  bottom: 1rem;

  width: 100%;

  display: flex;
  justify-content: center;

  & > .container {
    flex: 1;
    max-width: 900px;
    margin: 0 2rem;

    height: 3rem;

    & > .it-btn {
      height: 100%;
      display: flex;
      align-items: center;
    }
  }
}

.modal {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  & > .modal-buttons {
    display: flex;
    gap: 0.5rem;
  }
}
</style>
