import { supabase } from "./supabase.js";

const noopSubscription = () => ({
  data: {
    subscription: {
      unsubscribe() {},
    },
  },
});

export function createReleaseAuthService(authClient = supabase?.auth) {
  return {
    async getSession() {
      if (typeof authClient?.getSession !== "function") {
        return { data: { session: null }, error: { code: "auth_unavailable" } };
      }
      return authClient.getSession();
    },

    onAuthStateChange(callback) {
      if (typeof authClient?.onAuthStateChange !== "function") return noopSubscription();
      return authClient.onAuthStateChange(callback);
    },
  };
}

export const releaseAuthService = createReleaseAuthService();
