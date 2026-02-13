# PWA 配置指南

本文档介绍如何将 Lumina Closet AI 配置为 PWA（渐进式Web应用），使其可以在手机桌面上安装并离线使用。

## 快速开始

### 1. 生成图标

```bash
# 在浏览器中打开图标生成器
open generate-icons.html

# 或者使用 Live Server
npx live-server generate-icons.html
```

在打开的页面中：
1. 点击"下载所有图标"按钮
2. 将所有下载的图标文件放入 `public/` 文件夹
3. 可选：点击"下载启动屏幕"获取 iOS 启动图

### 2. 构建项目

```bash
npm run build
```

### 3. 部署

将 `dist/` 文件夹的内容部署到任何静态托管服务：
- Vercel
- Netlify
- GitHub Pages
- 腾讯云 COS
- 自有服务器

### 4. 在手机上安装

#### iOS (Safari)
1. 用 Safari 打开应用网址
2. 点击底部分享按钮
3. 选择"添加到主屏幕"
4. 确认添加

#### Android (Chrome)
1. 用 Chrome 打开应用网址
2. 底部会自动弹出安装提示，或点击菜单 → "添加到主屏幕"
3. 确认安装

## 自动更新机制

### 工作原理

PWA 使用 Service Worker 实现自动更新：

1. **后台检查**：每 5 分钟自动检查新版本
2. **缓存策略**：
   - 静态资源：Stale While Revalidate（先返回缓存，后台更新）
   - 图片：Cache First（优先使用缓存，30天过期）
   - API请求：Network First（优先网络，失败回退缓存）
3. **更新提示**：发现新版本时显示更新按钮
4. **立即生效**：用户点击更新后立即切换到新版本

### 更新流程

```
代码修改 → 重新构建 → 重新部署 → 客户端检测 → 提示更新 → 用户确认 → 刷新应用
```

### 开发时的更新策略

每次修改代码后：

```bash
# 1. 修改代码
# 2. 重新构建
npm run build

# 3. 重新部署（根据你的部署方式）
# 例如：
vercel --prod
# 或
netlify deploy --prod --dir=dist
# 或手动上传到服务器
```

**客户端行为**：
- 已安装应用的用户会在 5 分钟内收到更新提示
- 用户点击"更新"后立即切换到新版本
- 如果用户选择"稍后"，24小时内不再提示

### 强制刷新

如果用户想立即获取最新版本：
1. 完全关闭应用（从后台划掉）
2. 重新打开应用
3. 如果有更新会立即提示

## 配置说明

### vite.config.ts 中的PWA配置

```typescript
VitePWA({
  registerType: 'prompt',      // 提示模式：发现更新时提示用户
  workbox: {
    skipWaiting: true,         // 跳过等待，立即激活新版本
    clientsClaim: true,        // 立即控制所有客户端
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'], // 缓存模式
    runtimeCaching: [
      // 自定义缓存策略...
    ],
  },
  manifest: {
    // 应用信息配置...
  }
})
```

### 自定义更新检测间隔

编辑 `src/hooks/usePWA.ts`：

```typescript
const { needRefresh, updateServiceWorker } = usePWA({
  checkInterval: 5 * 60 * 1000,  // 修改检查间隔（毫秒）
  autoPrompt: true,               // 是否自动提示
  autoUpdate: false,              // 是否自动更新（不提示）
});
```

## 文件结构

```
closet/
├── public/
│   ├── icon-72x72.png          # PWA 图标（必需）
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-192x192.png         # 主图标
│   ├── icon-384x384.png
│   ├── icon-512x512.png         # 大图标
│   ├── splash-*.png             # iOS 启动屏幕
│   └── icon-template.svg        # 图标模板
├── src/
│   ├── hooks/
│   │   ├── usePWA.ts            # PWA 更新管理 Hook
│   │   └── index.ts
│   ├── components/
│   │   └── PWAUpdateToast.tsx   # 更新提示组件
│   └── types/
│       └── pwa.d.ts             # PWA 类型声明
├── vite.config.ts               # PWA 配置
├── index.html                   # PWA meta 标签
├── generate-icons.html          # 图标生成工具
└── PWA_SETUP.md                 # 本文档
```

## 常见问题

### Q: 图标生成失败怎么办？

可以手动创建或使用在线工具：
1. 使用 Figma 设计图标
2. 导出为 PNG 格式
3. 使用 [favicon.io](https://favicon.io) 生成多尺寸图标

### Q: 更新没有生效？

1. 确保 `skipWaiting: true` 已配置
2. 检查浏览器开发者工具的 Application → Service Workers
3. 尝试"Update on reload"选项
4. 清除浏览器缓存后重试

### Q: iOS 上无法离线使用？

iOS Safari 对 PWA 离线支持有限制：
- 确保已"添加到主屏幕"
- 首次打开时需要有网络连接
- iOS 14+ 支持较好

### Q: 如何测试更新？

1. 首次构建并部署
2. 在手机上安装应用
3. 修改代码中的某个可见内容
4. 重新构建并部署
5. 等待 5 分钟或重启应用
6. 应该看到更新提示

### Q: 可以上架 App Store 吗？

PWA 不能直接上架 App Store，但可以：
1. 使用 Cordova/Capacitor 打包
2. 或使用 [PWA2App](https://pwa2app.com) 等工具
3. 但 PWA 本身无需审核，用户直接通过浏览器安装

## 进阶配置

### 添加推送通知

```typescript
// 在 usePWA.ts 中添加
const subscribeToPush = async () => {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: 'your-vapid-key'
  });
  // 发送 subscription 到服务器
};
```

### 后台同步

```typescript
// 在 Service Worker 中处理
self.addEventListener('sync', event => {
  if (event.tag === 'sync-outfits') {
    event.waitUntil(syncOutfits());
  }
});
```

## 参考资源

- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## 技术支持

如有问题，请检查：
1. 浏览器控制台错误信息
2. Application → Service Workers 状态
3. Application → Manifest 是否正确加载
4. Network 面板中资源是否正确缓存
