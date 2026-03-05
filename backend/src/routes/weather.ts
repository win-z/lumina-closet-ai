/**
 * ==================== 天气路由 (公开接口，无需认证) ====================
 * 后端代理天气和IP定位请求，解决前端在国内访问外网API受限的问题
 *
 * GET /api/weather/byip      — 根据客户端IP自动获取天气（无需任何授权）
 * GET /api/weather/byloc     — 根据经纬度获取天气 (?lat=&lon=)
 */

import { Router, Request, Response } from 'express';

const router = Router();

// WMO 天气代码 → 中文描述 + emoji
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

/** 简单的 HTTP/HTTPS fetch 封装（不依赖 node-fetch，Node 18 内置 fetch 可用） */
async function serverFetch(url: string): Promise<any> {
    const response = await fetch(url, {
        headers: { 'User-Agent': 'LuminaClosetBackend/1.0' },
        signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

/** 通过经纬度获取 Open-Meteo 天气 */
async function fetchWeatherByLatLon(lat: number, lon: number) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto&forecast_days=1`;
    const data = await serverFetch(url);
    const c = data.current;
    const { description, emoji } = decodeWeatherCode(c.weather_code);
    return {
        temperature: Math.round(c.temperature_2m),
        feelsLike: Math.round(c.apparent_temperature),
        humidity: c.relative_humidity_2m,
        windspeed: Math.round(c.wind_speed_10m),
        weatherCode: c.weather_code,
        description,
        emoji,
    };
}

/** 通过 IP 获取经纬度和城市（使用 ip-api.com，服务端调用无问题） */
async function fetchIpLocation(ip: string): Promise<{ lat: number; lon: number; city: string }> {
    // 过滤本地/内网IP
    const localIps = ['127.0.0.1', '::1', 'localhost'];
    const isLocal = localIps.includes(ip) || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.');
    const targetIp = isLocal ? '' : ip;
    const url = `http://ip-api.com/json/${targetIp}?fields=lat,lon,regionName&lang=zh-CN`;
    const data = await serverFetch(url);
    if (!data.lat) throw new Error('IP定位失败');

    const { lat, lon } = data;
    const regionName: string = data.regionName || '';

    // 用 Nominatim 反地理编码获取准确的地级市名称（服务端调用，绕过浏览器限制）
    let city = regionName; // 省份名作为兜底
    try {
        const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=zh&zoom=10`,
            {
                headers: { 'User-Agent': 'LuminaClosetBackend/1.0' },
                signal: AbortSignal.timeout(5000),
            }
        );
        if (geoRes.ok) {
            const geoData = await geoRes.json() as any;
            const addr = geoData.address || {};
            // Nominatim 对中国城市返回 city（如"杭州市"）或 county（如"萧山区"）
            const found = addr.city || addr.county || addr.town || addr.municipality;
            if (found) city = found;
        }
    } catch {
        // Nominatim 失败降级：使用省份名
    }

    return { lat, lon, city };
}


/**
 * GET /api/weather/byip
 * 根据客户端公网IP自动推断位置并返回天气
 */
router.get('/byip', async (req: Request, res: Response) => {
    try {
        // 从请求头获取真实客户端IP（Nginx反向代理后会在 X-Real-IP 或 X-Forwarded-For）
        const clientIp = (
            req.headers['x-real-ip'] ||
            req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
            req.socket.remoteAddress ||
            ''
        ) as string;

        const location = await fetchIpLocation(clientIp);
        const weather = await fetchWeatherByLatLon(location.lat, location.lon);

        const summaryText = `${weather.description}, ${weather.temperature}°C${location.city ? `, ${location.city}` : ''}`;

        res.json({
            success: true,
            message: '天气获取成功',
            data: { ...weather, city: location.city, summaryText, source: 'ip' },
        });
    } catch (err: any) {
        res.status(500).json({ success: false, message: '天气获取失败: ' + (err?.message || '未知错误') });
    }
});

/**
 * GET /api/weather/byloc?lat=xx&lon=xx&city=xx
 * 根据前端GPS定位坐标获取天气
 */
router.get('/byloc', async (req: Request, res: Response) => {
    try {
        const lat = parseFloat(req.query.lat as string);
        const lon = parseFloat(req.query.lon as string);
        const city = (req.query.city as string) || '';

        if (isNaN(lat) || isNaN(lon)) {
            return res.status(400).json({ success: false, message: '缺少经纬度参数' });
        }

        const weather = await fetchWeatherByLatLon(lat, lon);
        const summaryText = `${weather.description}, ${weather.temperature}°C${city ? `, ${city}` : ''}`;

        res.json({
            success: true,
            message: '天气获取成功',
            data: { ...weather, city, summaryText, source: 'gps' },
        });
    } catch (err: any) {
        res.status(500).json({ success: false, message: '天气获取失败: ' + (err?.message || '未知错误') });
    }
});

export default router;
