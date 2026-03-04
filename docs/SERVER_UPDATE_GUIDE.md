# Lumina Closet 服务器部署变更指南

> **背景**：前端图片加载使用了 `/cos-image` 代理，但线上 Nginx 配置缺失对该路由的反向代理。这会导致图片请求（`http://101.37.159.90/cos-image/...jpg`）直接匹配到默认的 `try_files` 返回 HTML 结构，使得图片“加载失败”。

我们需要在服务器上添加对应的 Nginx 代理块，以实现前端与对象存储（COS）安全跨域通信。

---

## 步骤 1：修改 Nginx 配置文件

请通过您自己的方式 SSH 登录到服务器 `101.37.159.90`。

打开该项目的 Nginx 配置（比如可能在 `/etc/nginx/conf.d/lumina-closet.conf` 或在 `/etc/nginx/sites-available/` 下），找到对应的前端 `server` 块。

在 `location /` 配置段的下方，**添加如下代码**：

```nginx
    # COS 图片代理 (解决跨域和防盗链情况下的访问)
    location ^~ /cos-image/ {
        proxy_pass https://5205210-1320011806.cos.ap-guangzhou.myqcloud.com/;
        proxy_ssl_server_name on;
        proxy_set_header Host 5205210-1320011806.cos.ap-guangzhou.myqcloud.com;
    }
```

## 步骤 2：测试 Nginx 配置

保存文件后，在服务器终端执行以下命令测试配置格式是否正确：

```bash
sudo nginx -t
```
若输出包含 `syntax is ok` 和 `test is successful`，则继续下一步。

## 步骤 3：重启 Nginx 服务

执行以下命令让配置生效：

```bash
sudo systemctl reload nginx
# 或者
sudo nginx -s reload
```

## 步骤 4：重启后端服务 (按需)

如果您的代码拉取了最新变更（比如我也刚刚帮您在本地添加了测试账号环境变量到 `closet/.env.local` 并在项目中重构了部分代码），请在服务器上的项目目录（比如 `/www/wwwroot/lumina-closet-ai-main` 或您放置的位置）下：

1. 如果是前端，重新 Build：
   ```bash
   npm run build
   ```
2. 如果是后端通过 `pm2` 运行，请重启后端服务（如 `index.js` 或 `server.js`）：
   ```bash
   pm2 restart backend
   # 或者 pm2 restart all
   ```

完成后，刷新 `http://101.37.159.90` 页面，图片加载即恢复正常。
