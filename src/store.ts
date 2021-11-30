import { defineStore } from "pinia";
import localforage from "localforage";

localforage.config({
  driver: localforage.INDEXEDDB,
  storeName: "points.js",
  name: "points.js",
});

interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
  broadcaster_type: "" | "partner" | "affiliate";
}

interface MainConfig {
  list: string;
  reward: {
    random: string;
    choose: string;
    useBoth: boolean;
  };
  random: boolean;
  volume: number;
  show: {
    rewards: boolean;
    sounds: boolean;
    inlineSound: boolean;
  };
}

interface MainStore {
  token: string | null;
  channel: TwitchUser | null;
  config: MainConfig | null;
}

const defaultConfig: MainConfig = {
  list: "https://gist.githubusercontent.com/aneyo/4566b18ed624ac7c2b28daaedc28c7dd/raw/points.txt",
  reward: {
    random: "",
    choose: "",
    useBoth: false,
  },
  random: true,
  volume: 0.8,
  show: {
    inlineSound: false,
    sounds: true,
    rewards: false,
  },
};

const store = defineStore("main", {
  state() {
    return {
      token: null,
      config: null,
      channel: null,
    } as MainStore;
  },

  actions: {
    async fetchUser(token?: string) {
      const t = token || this.token;

      const result = await fetch("https://api.twitch.tv/helix/users", {
        headers: {
          "Client-Id": "loh6hmf1odxlkqbgmv7b22lw4bl5rm",
          Authorization: "Bearer " + t,
        },
      });

      if (!result.ok) throw 0;

      const { data } = (await result.json()) as { data: TwitchUser[] };
      if (data.length < 1) throw 1;

      this.channel = data[0];
    },

    async load() {
      const token = await localforage.getItem<string>("token");
      const config = await localforage.getItem<MainConfig>("config");

      this.token = token;
      this.config = config || defaultConfig;
    },

    async save() {
      await localforage.setItem("token", this.token);
      await localforage.setItem(
        "config",
        JSON.parse(JSON.stringify(this.config))
      );
    },

    async reset(withConfig = true) {
      this.token = null;
      if (withConfig) this.config = defaultConfig;

      await localforage.setItem("token", this.token);
      if (withConfig)
        await localforage.setItem(
          "config",
          JSON.parse(JSON.stringify(this.config))
        );
    },
  },
});

export const useStore = store;
