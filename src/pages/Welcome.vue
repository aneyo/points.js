<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from "vue-demi";
import { useStore } from "../store";

const LOGIN_REDIRECT = "https://aneyo.github.io/points.js/callback.html";
const LOGIN_PAGE = `https://id.twitch.tv/oauth2/authorize?response_type=token&redirect_uri=${LOGIN_REDIRECT}&scope=channel:read:redemptions&client_id=loh6hmf1odxlkqbgmv7b22lw4bl5rm&force_verify=true`;

onMounted(() => {
  window.addEventListener("message", onPopupMessage);
});

onUnmounted(() => {
  window.removeEventListener("message", onPopupMessage);
});

const store = useStore();

const waitingForLogin = ref(false);
const loginError = ref("");

function openLoginPage() {
  if (waitingForLogin.value) return;

  loginError.value = "";
  waitingForLogin.value = true;

  const popup = window.open(
    LOGIN_PAGE,
    "Войти с помощью Twitch",
    "toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, copyhistory=no, height=700, width=700"
  );

  if (popup) popup.focus();
}

function onPopupMessage(e: MessageEvent) {
  const [success, data] = e.data as [success: boolean, data: string];

  if (e.origin !== window.origin) return;
  (e.source as Window).close();

  if (!success) {
    loginError.value = data || "Неизвестная ошибка!";
    waitingForLogin.value = false;
  } else validateToken(data);
}

async function validateToken(token: string) {
  try {
    await store.fetchUser(token);
    store.token = token;
    await store.save();
  } catch {
    loginError.value = "Токен не действительный";
  }

  waitingForLogin.value = false;
}
</script>

<template>
  <div class="welcom">
    <h1>Добро Пожаловать!</h1>

    <it-button
      type="primary"
      icon="login"
      class="login-button"
      :loading="waitingForLogin"
      @click="openLoginPage"
    >
      <span>Войти через </span>
      <span>&nbsp;</span>
      <b>Twitch</b>
    </it-button>

    <div class="error" v-if="loginError">
      <b>Ошибка:</b>
      <span>&nbsp;{{ loginError }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "sass:color";

$twitch: #9146ff;
$twitch-h: color.scale($twitch, $lightness: 20%);
$twitch-a: color.scale($twitch, $lightness: -10%, $saturation: -10%);

$twitch-s1: color.adjust($twitch, $alpha: -0.6); // 0.4
$twitch-s2: color.adjust($twitch, $alpha: -0.8); // 0.2

.welcom {
  height: 100vh;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  & > .login-button {
    padding: 0.7rem 1rem;

    background-color: $twitch;
    box-shadow: 0 2px 4px $twitch-s1;
    border: 1px solid $twitch;

    &:focus {
      box-shadow: 0 2px 4px $twitch-s1, 0 0 0 3px $twitch-s2;
    }

    &:hover {
      background-color: $twitch-h;
      border: 1px solid $twitch-h;
    }

    &:active {
      background-color: $twitch-a;
      border: 1px solid $twitch-a;
      box-shadow: none;
    }
  }

  & > .error {
    color: red;
    margin-top: 1.5rem;
  }
}
</style>
