// Safe storage utility that handles iframe restrictions, private browsing, and corrupt data

const memoryStore = new Map<string, string>();

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch (e) {
      // In restricted iframe or private mode, fall back to in-memory map
    }
    return memoryStore.get(key) ?? null;
  },

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      // Ignore quota or security errors in iframe
    }
    memoryStore.set(key, value);
  },

  removeItem(key: string): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {}
    memoryStore.delete(key);
  },

  clear(): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.clear();
      }
    } catch (e) {}
    memoryStore.clear();
  },

  getJSON<T>(key: string, fallback: T): T {
    try {
      const raw = this.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      if (parsed === null || parsed === undefined) return fallback;
      return parsed as T;
    } catch (e) {
      console.warn(`[safeStorage] Corrupt JSON for key "${key}", using fallback:`, e);
      return fallback;
    }
  }
};
