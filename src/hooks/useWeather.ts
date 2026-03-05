/**
 * ==================== useWeather Hook ====================
 * 通过后端代理获取天气，解决国内网络直连外网API受限的问题
 *
 * 两级策略：
 * 1. GPS 精确定位 → 调 /api/weather/byloc?lat=&lon=
 * 2. GPS 不可用/被拒 → 调 /api/weather/byip（后端通过客户端IP推断位置）
 */

import { useState, useEffect } from 'react';

export interface WeatherData {
    temperature: number;   // 摄氏度
    feelsLike: number;     // 体感温度
    humidity: number;      // 湿度 %
    windspeed: number;     // 风速 km/h
    weatherCode: number;   // WMO代码
    description: string;   // 中文描述
    emoji: string;         // 天气emoji
    city?: string;         // 城市名
    summaryText: string;   // 给AI的描述，如 "晴天, 22°C, 深圳市"
    source: 'gps' | 'ip';
}

export interface UseWeatherReturn {
    weather: WeatherData | null;
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

/** 调后端代理接口 */
async function backendFetch(path: string): Promise<WeatherData> {
    const res = await fetch(path, { signal: AbortSignal.timeout(10000) });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || '天气获取失败');
    return json.data as WeatherData;
}

export function useWeather(): UseWeatherReturn {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchByIp = async () => {
        const data = await backendFetch('/api/weather/byip');
        setWeather(data);
    };

    const fetchAndSet = () => {
        setLoading(true);
        setError(null);

        // 尝试 GPS 精确定位
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    try {
                        const { latitude: lat, longitude: lon } = pos.coords;
                        const data = await backendFetch(`/api/weather/byloc?lat=${lat}&lon=${lon}`);
                        setWeather(data);
                    } catch {
                        // GPS 天气失败 → IP 兜底
                        try { await fetchByIp(); }
                        catch { setError('天气获取失败，请手动输入'); }
                    } finally {
                        setLoading(false);
                    }
                },
                async () => {
                    // 定位被拒 → 直接 IP 定位
                    try { await fetchByIp(); }
                    catch { setError('天气获取失败，请手动输入'); }
                    finally { setLoading(false); }
                },
                { timeout: 6000, maximumAge: 5 * 60 * 1000 }
            );
        } else {
            // 不支持 GPS → IP 定位
            fetchByIp()
                .catch(() => setError('天气获取失败，请手动输入'))
                .finally(() => setLoading(false));
        }
    };

    useEffect(() => {
        fetchAndSet();
    }, []);

    return { weather, loading, error, refresh: fetchAndSet };
}
