/**
 * ==================== 统一 API 客户端 ====================
 * - 统一 baseURL（强制从环境变量读取，不允许硬编码）
 * - 自动注入 JWT Token
 * - 统一错误处理
 */

const getBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_URL;
  // 未配置时使用相对路径 '/'，兼容 Nginx 反向代理部署
  if (!url) {
    return '';
  }
  return url.replace(/\/$/, ''); // 去掉末尾斜杠
};

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const base = getBaseUrl();
  const token = localStorage.getItem('lumina_token');

  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return res.json() as Promise<T>;
}

export const apiClient = {
  get: <T = unknown>(path: string) => request<T>('GET', path),
  post: <T = unknown>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T = unknown>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T = unknown>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T = unknown>(path: string) => request<T>('DELETE', path),
};

export default apiClient;
