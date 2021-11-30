import { createApp } from "vue";
import App from "./App.vue";

import { createPinia } from "pinia";
import EqualStyle from "equal-vue";

const app = createApp(App).use(createPinia()).use(EqualStyle);
app.provide("$message", app.config.globalProperties.$Message);
app.mount("#app");
