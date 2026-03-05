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

export function useWeather(): UseWeatherReturn {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAndSet = () => {
        if (!navigator.geolocation) {
            setError('浏览器不支持定位');
            return;
        }
        setLoading(true);
        setError(null);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const data = await fetchWeather(pos.coords.latitude, pos.coords.longitude);
                    setWeather(data);
                } catch (e: any) {
                    setError(e?.message || '天气获取失败');
                } finally {
                    setLoading(false);
                }
            },
            (err) => {
                setError(err.code === 1 ? '定位已拒绝，请手动输入天气' : '定位失败');
                setLoading(false);
            },
            { timeout: 8000, maximumAge: 5 * 60 * 1000 }
        );
    };

    useEffect(() => {
        fetchAndSet();
    }, []);

    return { weather, loading, error, refresh: fetchAndSet };
}
