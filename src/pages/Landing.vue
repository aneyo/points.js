<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from "vue-demi";
import { useStore } from "../store";
import ThemeButton from "../components/ThemeButton.vue";

// const LOGIN_REDIRECT = "https://aneyo.github.io/points.js/callback";
const LOGIN_REDIRECT = `${document.location.protocol}//${
  document.location.host
}/${[
  ...document.location.pathname.split("/").filter((c) => c.trim()),
  "callback.html",
].join("/")}`;
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
  if (!Array.isArray(e.data)) return;
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
    <h1>
      <span>points</span>
      <span class="accent-1">.js</span>
    </h1>

    <button
      class="twitch-button"
      :class="{ waiting: waitingForLogin }"
      :disabled="waitingForLogin"
      @click="openLoginPage"
    >
      <span class="pre">Войти с помощью</span>
      <div class="glitch">
        <svg
          x="0px"
          y="0px"
          viewBox="0 0 2400 2800"
          style="enable-background: new 0 0 2400 2800"
        >
          <g>
            <g id="Layer_1-2">
              <path
                class="st0"
                d="M500,0L0,500v1800h600v500l500-500h400l900-900V0H500z M2200,1300l-400,400h-400l-350,350v-350H600V200h1600V1300z"
              />
              <rect x="1700" y="550" class="st0" width="200" height="600" />
              <rect x="1150" y="550" class="st0" width="200" height="600" />
            </g>
          </g>
        </svg>
        <div class="loader">
          <it-loading
            :radius="16"
            color="var(--md-extended-color-custom-color-on-color)"
          />
        </div>
      </div>
    </button>

    <div class="error" v-if="loginError">
      <b>Ошибка:</b>
      <span>&nbsp;{{ loginError }}</span>
    </div>

    <div class="bottom-float">
      <ThemeButton />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import url("https://fonts.googleapis.com/css2?family=Jersey+15&display=swap");

h1 {
  font-family: "Jersey 15", sans-serif;
  font-size: 3rem;
}

.welcom {
  height: 100vh;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  & > .error {
    padding: 1rem 1.5rem;
    border-radius: 0.3rem;
    color: var(--md-sys-color-on-error);
    background-color: var(--md-sys-color-error);
    margin-top: 1rem;
  }
}

.accent {
  &-1 {
    color: var(--md-sys-color-primary);
  }
  &-2 {
    color: var(--md-extended-color-custom-color-color);
  }
}

.twitch-button {
  cursor: pointer;
  background-color: transparent;
  border: none;
  color: var(--md-sys-color-on-backround);
  display: flex;
  align-items: center;

  padding: 0.3rem 0.3rem;
  border-radius: 0.4rem;
  // background-color: red;

  & > .pre {
    max-width: fit-content;
    white-space: nowrap;
    transition: all 0.2s;
    padding: 0 1rem 0 0.7rem;
  }

  & > .glitch {
    width: 3rem;
    height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.3rem;

    transition: all 0.2s;
    background-color: var(--twitch-accent);
    & > svg:not(.it-loading) {
      transition: all 0.5s;
      fill: white;
      width: 1.5rem;
      opacity: 1;
    }
    z-index: 10;

    & > .loader {
      transition: all 0.5s;
      position: absolute;
      width: 32px;
      height: 32px;
      opacity: 0;
      transform: scale(0.7);

      & > .it-loading {
        color: var(--md-extended-color-custom-color-on-color) !important;
      }
    }
  }

  position: relative;
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    transition: all 0.2s;
    opacity: 0;
  }

  overflow: hidden;
  &:not(.waiting) {
    &:hover,
    &:focus,
    &:active {
      &::before {
        background-color: var(--md-sys-color-primary);
        opacity: 0.08;
      }

      & > .glitch {
        background-color: var(--twitch-purple-10);
      }
    }
    &:active {
      &::before {
        opacity: 0.1;
      }

      & > .glitch {
        background-color: var(--twitch-purple-11);
      }
    }
  }

  &.waiting {
    & > .pre {
      max-width: 0px;
      padding: 0px 0px 0px 0px;
      opacity: 0;
    }

    & > .glitch {
      & > svg {
        opacity: 0;
      }
      background-color: var(--md-extended-color-custom-color-color);

      & > .loader {
        opacity: 1;
        transform: scale(1);
      }
    }
  }
}

.bottom-float {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
}
</style>
