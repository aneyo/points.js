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
  reward?: string;
  volume: number;
  pos: {
    v: "top" | "bottom";
    h: "left" | "right";
  };
}

interface MainStore {
  token: string | null;
  channel: TwitchUser | null;
  config: MainConfig | null;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  color: string;
  cost: number;
  icon: string;
}

const defaultConfig: MainConfig = {
  list: "https://gist.githubusercontent.com/aneyo/4566b18ed624ac7c2b28daaedc28c7dd/raw/points.txt",
  volume: 0.5,
  pos: {
    v: "top",
    h: "right",
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
