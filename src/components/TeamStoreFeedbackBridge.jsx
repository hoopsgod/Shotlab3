import { useEffect } from "react";
import { announceFeedback } from "./AppFeedbackLayer.jsx";
import {
  TEAM_STORE_REFERRALS_KEY,
  TEAM_STORE_STORAGE_KEY,
} from "../lib/teamStore.js";

const BRIDGE_KEY = "__shotlabTeamStoreFeedbackBridge";

function feedbackForKey(key) {
  if (key === TEAM_STORE_STORAGE_KEY) {
    return {
      tone: "success",
      title: "Team Store published",
      message: "The verified storefront is now available from ShotLab for players and families.",
    };
  }
  if (key === TEAM_STORE_REFERRALS_KEY) {
    return {
      tone: "info",
      title: "Partner path recorded",
      message: "ShotLab recorded that this device opened the configured SquadLocker partner destination.",
    };
  }
  return null;
}

function announcePersisted(key) {
  const detail = feedbackForKey(key);
  if (detail) announceFeedback(detail);
}

function announceFailure(key, error) {
  if (!feedbackForKey(key)) return;
  announceFeedback({
    tone: "error",
    title: key === TEAM_STORE_STORAGE_KEY ? "Team Store was not saved" : "Partner path was not recorded",
    message: error?.message || "ShotLab could not verify this change. Nothing has been confirmed; try again.",
    duration: 5200,
  });
}

function installBridge() {
  const existing = window[BRIDGE_KEY];
  if (existing) {
    existing.references += 1;
    return existing;
  }

  const bridge = {
    references: 1,
    managedWriteDepth: 0,
    originalWindowStorageSet: null,
    wrappedWindowStorageSet: null,
    originalLocalSetItem: null,
    wrappedLocalSetItem: null,
  };

  const storageApi = window.storage;
  if (storageApi && typeof storageApi.set === "function") {
    bridge.originalWindowStorageSet = storageApi.set;
    bridge.wrappedWindowStorageSet = async function wrappedTeamStoreSet(key, value, ...rest) {
      bridge.managedWriteDepth += 1;
      try {
        const result = await bridge.originalWindowStorageSet.call(this, key, value, ...rest);
        announcePersisted(key);
        return result;
      } catch (error) {
        announceFailure(key, error);
        throw error;
      } finally {
        bridge.managedWriteDepth -= 1;
      }
    };
    storageApi.set = bridge.wrappedWindowStorageSet;
  }

  const storagePrototype = window.Storage?.prototype;
  if (storagePrototype && typeof storagePrototype.setItem === "function") {
    bridge.originalLocalSetItem = storagePrototype.setItem;
    bridge.wrappedLocalSetItem = function wrappedTeamStoreLocalSet(key, value) {
      try {
        const result = bridge.originalLocalSetItem.call(this, key, value);
        if (bridge.managedWriteDepth === 0) announcePersisted(key);
        return result;
      } catch (error) {
        if (bridge.managedWriteDepth === 0) announceFailure(key, error);
        throw error;
      }
    };
    storagePrototype.setItem = bridge.wrappedLocalSetItem;
  }

  window[BRIDGE_KEY] = bridge;
  return bridge;
}

function uninstallBridge(bridge) {
  bridge.references -= 1;
  if (bridge.references > 0) return;

  if (window.storage?.set === bridge.wrappedWindowStorageSet && bridge.originalWindowStorageSet) {
    window.storage.set = bridge.originalWindowStorageSet;
  }
  if (window.Storage?.prototype?.setItem === bridge.wrappedLocalSetItem && bridge.originalLocalSetItem) {
    window.Storage.prototype.setItem = bridge.originalLocalSetItem;
  }
  delete window[BRIDGE_KEY];
}

export default function TeamStoreFeedbackBridge() {
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const bridge = installBridge();
    return () => uninstallBridge(bridge);
  }, []);

  return null;
}
