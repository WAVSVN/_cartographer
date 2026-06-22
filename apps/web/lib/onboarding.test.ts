import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isOnboardingDone,
  markOnboardingDone,
  ONBOARDING_STORAGE_KEY,
} from "./onboarding";

function mockBrowserStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    },
  });
  return store;
}

describe("onboarding", () => {
  beforeEach(() => {
    mockBrowserStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts incomplete when key is absent", () => {
    expect(isOnboardingDone()).toBe(false);
  });

  it("marks onboarding done in localStorage", () => {
    markOnboardingDone();
    expect(window.localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe("1");
    expect(isOnboardingDone()).toBe(true);
  });

  it("markOnboardingDone is idempotent", () => {
    markOnboardingDone();
    markOnboardingDone();
    expect(isOnboardingDone()).toBe(true);
  });
});
