<script lang="ts" setup>
import { ref, computed, watch, inject } from "vue-demi";
import { useStore } from "../store";
import copy from "copy-to-clipboard";

const message: any = inject("$message");

const store = useStore();
const name = computed(
  () => store.channel!.display_name || store.channel!.login
);

const token = ref(store.token + "");
const volume = ref(store.config!.volume * 100);

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
  token: computed(() => token.value !== ""),
  list: computed(() => store.config!.list !== ""),
  rewardRandom: computed(
    () =>
      store.config!.reward.random.trim() !== "" &&
      store.config!.reward.choose.trim() !== store.config!.reward.random.trim()
  ),
  rewardSelect: computed(
    () =>
      !store.config!.reward.useBoth ||
      (store.config!.reward.choose.trim() !== "" &&
        store.config!.reward.choose.trim() !==
          store.config!.reward.random.trim())
  ),
};

const validatorMessages = {
  rewardRandom: computed(() => {
    switch (true) {
      case store.config!.reward.random.trim() === "":
        return "Название награды не может быть пустым!";

      case store.config!.reward.useBoth &&
        store.config!.reward.choose.trim() ===
          store.config!.reward.random.trim():
        return "Название этой награды не может совподать с названием другой!";

      default:
        return null;
    }
  }),

  rewardSelect: computed(() => {
    if (!store.config!.reward.useBoth) return null;

    switch (true) {
      case store.config!.reward.choose.trim() === "":
        return "Название награды не может быть пустым!";

      case store.config!.reward.choose.trim() ===
        store.config!.reward.random.trim():
        return "Название этой награды не может совподать с названием другой!";

      default:
        return null;
    }
  }),
};

const isValid = computed(
  () =>
    validators.list.value &&
    validators.rewardRandom.value &&
    validators.rewardSelect.value &&
    validators.token.value
);

const generatedLink = computed(() => {
  const head = "https://aneyo.github.io/points.js/widget#";
  const params = new URLSearchParams();

  params.set("l", store.config!.list);
  params.set("c", store.channel!.login);
  params.set("v", store.config!.volume.toString());

  params.set("r", store.config!.reward.random);
  if (store.config!.reward.useBoth)
    params.set("e", store.config!.reward.choose);

  params.set("R", store.config!.show.rewards ? "1" : "0");
  params.set(
    "S",
    store.config!.show.sounds
      ? store.config!.show.inlineSound
        ? "2"
        : "1"
      : "0"
  );

  if (!store.config!.random) params.set("fixed", "");

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
      label-top="API Токен"
      placeholder="Twitch API Токен"
      prefix-icon="vpn_key"
      type="password"
      v-model.trim="token"
      :status="validators.token.value ? null : 'danger'"
      :message="validators.token.value ? null : 'Токен не может быть пустым!'"
    />

    <it-input
      label-top="Список звуков"
      prefix-icon="summarize"
      placeholder="https://gist.githubusercontent.com/aneyo/4566b18ed624ac7c2b28daaedc28c7dd/raw/points.txt"
      v-model.trim="store.config!.list"
      :status="validators.list.value ? null : 'danger'"
      :message="validators.list.value ? null : 'Нужно указать ссылку на лист!'"
    />

    <it-checkbox
      type="primary"
      label="Перемешивать порядок звуков"
      sub-label="При каждом перезапуске порядок звуков будет перемешиватся, полезно для награды выборочных звуков"
      v-model="store.config!.random"
    />

    <it-input
      label-top="Название награды"
      prefix-icon="star_rate"
      placeholder="Название награды, которая будет использоваться для воспроизвидения случайных звуков"
      v-model.trim="store.config!.reward.random"
      :status="validatorMessages.rewardRandom.value ? 'danger' : null"
      :message="validatorMessages.rewardRandom.value"
    />

    <it-input
      label-top="Название награды для выборочного звука"
      prefix-icon="star_half"
      placeholder="Название награды, которая будет использоваться для воспроизвидения выборочных звуков"
      v-if="store.config!.reward.useBoth"
      v-model.trim="store.config!.reward.choose"
      :status="validatorMessages.rewardSelect.value ? 'danger' : null"
      :message="validatorMessages.rewardSelect.value"
    />

    <it-checkbox
      type="primary"
      label="Использовать награду для выборочных звуков"
      v-model="store.config!.reward.useBoth"
    />

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

    <it-divider />

    <it-checkbox
      type="primary"
      label="Показывать активированные награды"
      sub-label="В правом нижнем углу виджета будут показываться все активированные награды, за исключением наград звуков"
      v-model="store.config!.show.rewards"
    />

    <it-checkbox
      type="primary"
      label="Показывать активированные звуки"
      sub-label="В правом нижнем углу виджета будут показываться все активированные звуки"
      v-model="store.config!.show.sounds"
    />

    <it-checkbox
      type="primary"
      label="Показывать звуки в одну линию"
      sub-label="Только один звук за раз будет показан"
      :disabled="!store.config!.show.sounds"
      v-model="store.config!.show.inlineSound"
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
        <it-input prefix-icon="link" v-model="generatedLink[0]" disabled />
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
