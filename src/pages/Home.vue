<script lang="ts" setup>
import {
  ref,
  computed,
  watch,
  inject,
  onMounted,
  onBeforeMount,
} from "vue-demi";
import { useStore, Reward, generateRootedLink } from "../store";
import copy from "copy-to-clipboard";
import SoundSelect from "../components/SoundSelect.vue";
import ThemeButton from "../components/ThemeButton.vue";

const message: any = inject("$message");

const store = useStore();
const channelLink = computed(() => "https://twitch.tv/" + store.channel!.login);
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
  const head = generateRootedLink("widget.html#");
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
    message({
      type: "success",
      text: "Ссылка скопирована!",
      duration: 5000,
    });
}

async function logout() {
  const name = store.channel!.login;
  await store.reset();
  message.success({ text: `Вы вышли из аккаунта ${name}!`, duration: 1500 });
}

onBeforeMount(() => {
  store.config!.pos ??= { v: "top", h: "right" };
});

const greeting = computed(() => {
  const date = new Date();
  const month = date.getMonth();
  const day = date.getDate();

  if (month == 11 && day > 30) return ["С новым годом", "!!!!"];
  if (month == 1 && day == 14) return ["Я тебя люблю", " <3"];
  if (month == 3 && day == 1) return ["Привет", " :)"];

  const hour = date.getHours();
  if (hour < 4) return ["Доброй ночи", "!"];
  if (hour < 12) return ["Доброе утро", "!"];
  if (hour < 18) return ["Добрый день", "!"];
  return ["Добрый вечер", "!"];
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
      <div class="message">
        {{ greeting[0] }},
        <a class="accent" target="_blank" rel="noreferrer" :href="channelLink">
          {{ name }} </a
        ><span>{{ greeting[1] }}</span>
      </div>

      <div style="display: flex; gap: 0.2rem">
        <ThemeButton />
        <button class="top-button" @click="logout">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="1.2rem"
            viewBox="0 -960 960 960"
            width="1.2rem"
            fill="currentColor"
          >
            <path
              d="M202.87-111.87q-37.78 0-64.39-26.61t-26.61-64.39v-554.26q0-37.78 26.61-64.39t64.39-26.61h233.54q19.16 0 32.33 13.17 13.17 13.18 13.17 32.33t-13.17 32.33q-13.17 13.17-32.33 13.17H202.87v554.26h233.54q19.16 0 32.33 13.17 13.17 13.18 13.17 32.33t-13.17 32.33q-13.17 13.17-32.33 13.17H202.87ZM674.56-434.5H403.59q-19.16 0-32.33-13.17-13.17-13.18-13.17-32.33t13.17-32.33q13.17-13.17 32.33-13.17h270.97L605.07-595q-12.68-12.67-12.68-31.07 0-18.39 12.68-31.82 12.67-13.68 31.7-14.06 19.03-.38 32.71 13.3L816.3-511.83q13.44 13.68 13.44 31.83t-13.44 31.83L669.48-301.35q-13.44 13.68-32.21 13.3-18.77-.38-32.2-14.06-12.68-13.43-12.3-32.21.38-18.77 13.06-31.44l68.73-68.74Z"
            />
          </svg>
        </button>
      </div>
    </div>

    <it-input
      label-top="Список звуков"
      prefix-icon="summarize"
      placeholder="https://gist.githubusercontent.com/aneyo/4566b18ed624ac7c2b28daaedc28c7dd/raw/points.txt"
      v-model.trim="store.config!.list"
      :status="validators.list.value ? null : 'danger'"
      :message="
        validators.list.value ? null : 'Нужно указать ссылку на список звуков!'
      "
    />

    <SoundSelect :token="token" v-model:selected="rewardObject" />

    <span class="it-input-label" style="margin-bottom: -0.5rem">
      Где показывать награды
    </span>
    <div
      style="
        display: flex;
        gap: 0.3rem;
        align-items: center;
        margin-bottom: -1rem;
      "
    >
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

    <div
      style="display: flex; gap: 1rem; align-items: center; margin-top: -0.8rem"
    >
      <it-slider
        v-model="volume"
        :min="0"
        :step="1"
        :max="100"
        style="flex: 1"
      />

      <div style="min-width: 5rem; flex: 0">
        <it-input type="number" v-model.number="volume" suffix="%" />
      </div>
    </div>
  </div>

  <div class="action" v-if="isValid && !showDialog">
    <div class="container">
      <it-button icon="copy" block @click="copyLink">
        <span>Скопировать ссылку на виджет</span>
      </it-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.accent {
  color: var(--md-sys-color-primary);
}

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

  width: 100vw;
  z-index: 200;

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

      border: none;
      box-shadow: 0 19px 38px rgba(0, 0, 0, 0.3),
        0 15px 12px rgba(0, 0, 0, 0.22);
      color: var(--md-extended-color-custom-color-on-color);
      background-color: var(--md-extended-color-custom-color-color);

      &::before {
        position: absolute;
        content: "";
        inset: 0;
        height: 100%;
        width: 100%;
        background-color: var(--md-extended-color-custom-color-color-container);
        opacity: 0;
        transition: all 0.2s;
      }

      overflow: hidden;
      &:hover::before,
      &:focus::before {
        opacity: 0.2;
      }
      &:active::before {
        opacity: 0.4;
      }
    }
  }
}

.top-button {
  font-size: 0.5rem;
  padding: 0.5rem 0.5rem;
  border-radius: 0.2rem;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;

  background-color: transparent;
  color: var(--md-sys-color-primary);

  cursor: pointer;
  position: relative;
  overflow: hidden;
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    transition: all 0.2s;
    background-color: var(--md-sys-color-primary);
    opacity: 0;
  }

  &:hover,
  &:focus,
  &:active {
    &::before {
      opacity: 0.08;
    }
  }
  &:active::before {
    opacity: 0.1;
  }
}
</style>
