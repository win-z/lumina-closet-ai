# 最简单的 Vercel 部署方法 - 拖拽上传

## 步骤：

### 1. 准备工作
确保 `dist` 文件夹已生成（已完成✅）

### 2. 访问 Vercel
- 打开 https://vercel.com
- 登录你的账号

### 3. 创建新项目
- 点击右上角的 **"Add New..."** → **"Project"**
- 或者访问 https://vercel.com/new

### 4. 选择部署方式
- **方式A（推荐）**: 如果你代码在 GitHub/GitLab
  - 选择对应的仓库导入
  - 框架预设选择 **"Other"**
  - 构建命令留空（因为我们已经构建好了）
  - 输出目录填 `dist`
  - 点击 Deploy

- **方式B**: 直接上传文件夹
  - 在 https://vercel.com/new 页面
  - 点击 **"Import Git Repository"** 下方的 **"...or import from a different Git provider"**
  - 然后拖拽 `dist` 文件夹到页面中

### 5. 完成
- 等待部署完成（约 1-2 分钟）
- 获得一个类似 `https://lumina-closet-xxxxx.vercel.app` 的网址
- 在手机上访问该网址，添加到主屏幕即可

## 后续更新

代码修改后：
1. 重新运行 `npm run build`
2. 访问你的 Vercel 项目页面
3. 点击 **"Redeploy"** 按钮
4. 或重新拖拽 dist 文件夹

## 自定义域名（可选）

1. 在 Vercel 项目设置中点击 **"Domains"**
2. 添加你自己的域名
3. 按提示配置 DNS
