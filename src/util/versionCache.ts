/**
 * Version cache utility for managing GitHub release version caching
 * 版本缓存工具，用于管理 GitHub release 版本缓存
 */

export interface VersionCache {
    currentVersion: string;
    latestVersion: string;
    lastCheckTime: number;
    cacheExpiry: number;
}

const CACHE_KEY = 'powercontrol_version_cache';
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours / 6小时

/**
 * Get cached version data if available and not expired
 * 获取缓存的版本数据（如果可用且未过期）
 */
export const getVersionCache = (): VersionCache | null => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    try {
        const cache: VersionCache = JSON.parse(cached);
        if (Date.now() > cache.cacheExpiry) {
            localStorage.removeItem(CACHE_KEY);
            return null;
        }
        return cache;
    } catch (e) {
        console.warn("Failed to parse version cache:", e);
        return null;
    }
};

/**
 * Save version data to cache
 * 保存版本数据到缓存
 */
export const setVersionCache = (current: string, latest: string): void => {
    const cache: VersionCache = {
        currentVersion: current,
        latestVersion: latest,
        lastCheckTime: Date.now(),
        cacheExpiry: Date.now() + CACHE_DURATION
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
};

/**
 * Get stale cache (even if expired) for fallback purposes
 * 获取过期缓存（即使已过期）用于回退目的
 */
export const getStaleCache = (): VersionCache | null => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    try {
        return JSON.parse(cached);
    } catch (e) {
        console.warn("Failed to parse stale cache:", e);
        return null;
    }
};

