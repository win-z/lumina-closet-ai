/**
 * ==================== useWeather Hook ====================
 * 使用浏览器定位 + Open-Meteo 免费天气API获取实时天气
 * Open-Meteo: https://open-meteo.com/ — 无需 API Key，每天免费10000次
 */

import { useState, useEffect } from 'react';

export interface WeatherData {
    temperature: number;       // 摄氏度
    weatherCode: number;       // WMO天气代码
    description: string;       // 中文描述
    emoji: string;             // 天气emoji
    city?: string;             // 城市名（逆地理编码）
    windspeed: number;         // 风速 km/h
    humidity: number;          // 相对湿度 %
    feelsLike: number;         // 体感温度
    summaryText: string;       // 给AI的天气描述，如 "晴天, 22°C, 偏北风"
}

/** WMO 天气代码 → 中文描述 + emoji */
function decodeWeatherCode(code: number): { description: string; emoji: string } {
    if (code === 0) return { description: '晴天', emoji: '☀️' };
    if (code <= 2) return { description: '多云', emoji: '⛅' };
    if (code === 3) return { description: '阴天', emoji: '☁️' };
    if (code <= 49) return { description: '有雾', emoji: '🌫️' };
    if (code <= 59) return { description: '毛毛雨', emoji: '🌦️' };
    if (code <= 69) return { description: '小雨', emoji: '🌧️' };
    if (code <= 79) return { description: '雨夹雪', emoji: '🌨️' };
    if (code <= 84) return { description: '阵雨', emoji: '🌧️' };
    if (code <= 89) return { description: '阵雪', emoji: '❄️' };
    if (code <= 99) return { description: '雷雨', emoji: '⛈️' };
    return { description: '未知', emoji: '🌡️' };
}

/** 通过 Open-Meteo 获取天气 */
async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto&forecast_days=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('天气获取失败');
    const data = await res.json();
    const current = data.current;

    const { description, emoji } = decodeWeatherCode(current.weather_code);
    const temp = Math.round(current.temperature_2m);
    const feelsLike = Math.round(current.apparent_temperature);
    const windspeed = Math.round(current.wind_speed_10m);
    const humidity = current.relative_humidity_2m;

    // 逆地理编码：用 nominatim 获取城市名
    let city: string | undefined;
    try {
        const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=zh`,
            { headers: { 'User-Agent': 'LuminaClosetAI/1.0' } }
        );
        const geoData = await geoRes.json();
        city = geoData.address?.city || geoData.address?.town || geoData.address?.county || geoData.address?.state;
    } catch {
        // 城市名获取失败不影响主要功能
    }

    const summaryText = `${description}, ${temp}°C${city ? `, ${city}` : ''}`;

    return { temperature: temp, weatherCode: current.weather_code, description, emoji, city, windspeed, humidity, feelsLike, summaryText };
}

export interface UseWeatherReturn {
    weather: WeatherData | null;
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

/** IP 定位兜底：用 ip-api.com 获取大致经纬度（免费无 Key，无需授权） */
async function fetchWeatherByIp(): Promise<WeatherData> {
    const ipRes = await fetch('http://ip-api.com/json/?fields=lat,lon,city&lang=zh-CN');
    if (!ipRes.ok) throw new Error('IP定位失败');
    const ipData = await ipRes.json();
    const { lat, lon, city } = ipData;
    const data = await fetchWeather(lat, lon);
    // ip-api 已返回中文城市名，直接覆盖
    if (city) {
        data.city = city;
        data.summaryText = `${data.description}, ${data.temperature}°C, ${city}`;
    }
    return data;
}

export function useWeather(): UseWeatherReturn {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAndSet = () => {
        setLoading(true);
        setError(null);

        // 优先使用精确 GPS 定位
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    try {
                        const data = await fetchWeather(pos.coords.latitude, pos.coords.longitude);
                        setWeather(data);
                    } catch (e: any) {
                        // GPS 天气获取失败 → 降级 IP 定位
                        try {
                            const data = await fetchWeatherByIp();
                            setWeather(data);
                        } catch {
                            setError('天气获取失败，请手动输入');
                        }
                    } finally {
                        setLoading(false);
                    }
                },
                async () => {
                    // 定位被拒绝或超时 → 自动降级到 IP 定位
                    try {
                        const data = await fetchWeatherByIp();
                        setWeather(data);
                    } catch {
                        setError('天气获取失败，请手动输入');
                    } finally {
                        setLoading(false);
                    }
                },
                { timeout: 6000, maximumAge: 5 * 60 * 1000 }
            );
        } else {
            // 浏览器不支持 GPS → 直接 IP 定位
            fetchWeatherByIp()
                .then(setWeather)
                .catch(() => setError('天气获取失败，请手动输入'))
                .finally(() => setLoading(false));
        }
    };

    useEffect(() => {
        fetchAndSet();
    }, []);

    return { weather, loading, error, refresh: fetchAndSet };
}

