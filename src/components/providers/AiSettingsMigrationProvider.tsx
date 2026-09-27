"use client";
import { useEffect } from "react";
import { AiProvider, defaultModel } from "@/models/ai.model";
import { getFromLocalStorage, saveToLocalStorage } from "@/utils/localstorage.utils";

/**
 * This provider runs on app initialization to normalize obsolete OpenAI model selections.
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

    // Preserve local provider choices
    if (savedSettings.provider === AiProvider.OPENAI && savedSettings.model !== defaultModel.model) {
      
      saveToLocalStorage("aiSettings", defaultModel);
    }
  }, []);

  return <>{children}</>;
}
