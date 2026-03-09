import { cloudStore } from "../../lib/cloudStore";

export const DB = {
  async get(key) {
    return cloudStore.get(key);
  },
  async set(key, value) {
    return cloudStore.set(key, value);
  },
};
