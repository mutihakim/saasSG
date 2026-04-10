type CacheEntry<T> = {
    value: T;
    expiresAt: number;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();

export const financeCache = {
    get<T>(key: string): T | null {
        const entry = memoryCache.get(key);
        if (!entry) {
            return null;
        }

        if (Date.now() >= entry.expiresAt) {
            memoryCache.delete(key);
            return null;
        }

        return entry.value as T;
    },

    set<T>(key: string, value: T, ttlMs: number): void {
        memoryCache.set(key, {
            value,
            expiresAt: Date.now() + ttlMs,
        });
    },

    invalidatePrefix(prefix: string): void {
        memoryCache.forEach((_entry, key) => {
            if (key.startsWith(prefix)) {
                memoryCache.delete(key);
            }
        });
    },

    clear(): void {
        memoryCache.clear();
    },
};

export const financeCacheTtl = {
    structures: 5 * 60 * 1000, // 5 minutes
    summary: 2 * 60 * 1000, // 2 minutes
    short: 30 * 1000,
};
