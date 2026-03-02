import { useState, useEffect, useCallback } from 'react';
import { db } from './db';

interface UseCachedDataResult<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
    mutate: (newData: T) => void;
}

export function useCachedData<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
    initialValue: T | null = null
): UseCachedDataResult<T> {
    const [data, setData] = useState<T | null>(initialValue);
    // Default loading to true so that initial render shows a loader if no cache
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    const loadData = useCallback(async (isInitial = false) => {
        if (isInitial) {
            setLoading(true);
            // Immediately try to show cached data
            try {
                const cached = await db.get<T>(cacheKey);
                if (cached !== undefined && cached !== null) {
                    setData(cached);
                    setLoading(false); // Stop loading early if we have cache
                }
            } catch (e) {
                console.warn(`Failed to read cache for ${cacheKey}`, e);
            }
        }

        // Fetch fresh data from network in the background
        try {
            const fresh = await fetchFn();
            // Only update state if we got actual data (basic check)
            if (fresh !== undefined) {
                setData(fresh);
                // Persist to cache quietly
                await db.set(cacheKey, fresh);
            }
            setError(null);
        } catch (e) {
            console.error(`Fetch failed for ${cacheKey}:`, e);
            setError(e instanceof Error ? e : new Error(String(e)));
        } finally {
            if (isInitial) {
                setLoading(false);
            }
        }
    }, [cacheKey, fetchFn]);

    // Execute on mount map
    useEffect(() => {
        loadData(true);
    }, [loadData]);

    // Expose a way to manually trigger background refresh without setting `loading=true`
    const refresh = useCallback(() => loadData(false), [loadData]);

    // Expose mutate to allow optimistic UI updates
    const mutate = useCallback((newData: T) => {
        setData(newData);
        db.set(cacheKey, newData).catch(e => console.warn(`Failed to update cache on mutate ${cacheKey}`, e));
    }, [cacheKey]);

    return { data, loading, error, refresh, mutate };
}
