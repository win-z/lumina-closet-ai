// 定义缓存键名
export const CACHE_KEYS = {
    WARDROBE: 'cache_wardrobe_items',
    OUTFITS: 'cache_outfits',
    ANALYTICS: 'cache_analytics'
};

const DB_NAME = 'LuminaClosetDB';
const STORE_NAME = 'app_cache';

// 单例获取 DB 实例
function getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = () => {
            if (!request.result.objectStoreNames.contains(STORE_NAME)) {
                request.result.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export const db = {
    // 获取数据
    get: async <T>(key: string): Promise<T | undefined> => {
        try {
            const dbInstance = await getDB();
            return new Promise((resolve, reject) => {
                const tx = dbInstance.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const request = store.get(key);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.warn('DB Get Error:', e);
            return undefined;
        }
    },

    // 保存数据
    set: async <T>(key: string, value: T): Promise<void> => {
        try {
            const dbInstance = await getDB();
            return new Promise((resolve, reject) => {
                const tx = dbInstance.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                const request = store.put(value, key);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.warn('DB Set Error:', e);
        }
    },

    // 删除数据
    remove: async (key: string): Promise<void> => {
        try {
            const dbInstance = await getDB();
            return new Promise((resolve, reject) => {
                const tx = dbInstance.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                const request = store.delete(key);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.warn('DB Remove Error:', e);
        }
    },

    // 清空所有缓存
    clearAll: async (): Promise<void> => {
        try {
            const dbInstance = await getDB();
            return new Promise((resolve, reject) => {
                const tx = dbInstance.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                const request = store.clear();

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.warn('DB Clear Error:', e);
        }
    }
};
