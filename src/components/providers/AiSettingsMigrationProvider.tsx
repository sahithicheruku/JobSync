"use client";
import { useEffect } from "react";
import { AiProvider, defaultModel } from "@/models/ai.model";
import { getFromLocalStorage, saveToLocalStorage } from "@/utils/localstorage.utils";

/**
 * This provider runs on app initialization to migrate any old Ollama settings to OpenAI.
 * It executes before any components try to read AI settings from localStorage.
 */
export function AiSettingsMigrationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Run migration immediately on mount
    const savedSettings = getFromLocalStorage("aiSettings", defaultModel);

    // Force migration from Ollama to OpenAI
    if (savedSettings.provider === AiProvider.OLLAMA) {
      console.log("[Migration] Detected Ollama settings, migrating to OpenAI");
      saveToLocalStorage("aiSettings", defaultModel);
    }
  }, []);

  return <>{children}</>;
}
