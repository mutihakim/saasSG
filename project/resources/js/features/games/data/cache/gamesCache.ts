/**
 * Games cache layer
 *
 * In-memory cache with TTL for game-related data.
 * Follows the same pattern as financeCache.
 */

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

class GamesCache {
    private store: Map<string, CacheEntry<unknown>> = new Map();

    get<T>(key: string): T | null {
        const entry = this.store.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return entry.data as T;
    }

    set<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
        this.store.set(key, {
            data,
            expiresAt: Date.now() + ttlMs,
        });
    }

    invalidate(pattern: string): void {
        const keysToDelete: string[] = [];
        this.store.forEach((_value, key) => {
            if (key.includes(pattern)) {
                keysToDelete.push(key);
            }
        });
        keysToDelete.forEach((key) => this.store.delete(key));
    }

    clear(): void {
        this.store.clear();
    }

    /** Invalidate on version change (e.g. app update) */
    invalidateAll(): void {
        this.store.clear();
    }
}

export const gamesCache = new GamesCache();
