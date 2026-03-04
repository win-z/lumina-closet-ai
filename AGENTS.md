# Lumina Closet AI - AI智能衣橱助手
# 所有跟服务配置、账号、密码相关的东西，都要写到这个全局配置里面
# 遇到的很难解决的问题，解决方式也要简洁写到这个文档里面
## 项目概述

Lumina Closet AI 是一款 AI 驱动的智能个人衣橱助手应用，帮助用户管理服装、获取穿搭建议、尝试虚拟穿搭。

## 技术栈

### 前端 (Frontend)
- **框架**: React 18.2.0 + TypeScript
- **构建工具**: Vite 5.4.0
- **状态管理**: React Context + 本地状态
- **UI组件**: 自定义组件 + TailwindCSS 风格
- **图表**: Recharts 2.12.0
- **图标**: Lucide React 0.563.0

### 后端 (Backend)
- **运行时**: Node.js
- **框架**: Express 5.1.0
- **数据库**: MySQL (生产) / SQLite (开发，可配置)
- **认证**: JWT (jsonwebtoken)
- **验证**: Zod 3.24.4
- **日志**: Winston 3.19.0
- **AI服务**: SiliconFlow API (文本生成/图像识别) + 豆包 Doubao API (图像生成)
- **对象存储**: 腾讯云 COS (图片存储)

## 项目架构

```
lumina-closet-ai/
├── components/                   # React 组件（前端）
│   ├── WardrobeGallery.tsx      # 衣橱管理
│   ├── BodyProfile.tsx          # 身体档案
│   ├── Stylist.tsx             # AI穿搭建议
│   ├── Diary.tsx                # 穿搭日记
│   ├── Analytics.tsx            # 数据分析
│   └── ImageRenderer.tsx        # 图片渲染组件
│
├── services/                    # 前端服务
│   ├── api.ts                   # API 请求封装
│   └── db.ts                    # IndexedDB 操作
│
├── types.ts                     # TypeScript 类型定义
├── App.tsx                      # 主应用组件
├── index.tsx                    # 入口文件
│
├── backend/                     # 后端项目
│   ├── src/
│   │   ├── config/              # 配置管理
│   │   ├── middleware/          # 中间件
│   │   │   ├── auth.ts          # JWT认证
│   │   │   ├── errorHandler.ts  # 错误处理
│   │   │   └── validation.ts    # 请求验证
│   │   ├── models/              # 数据模型
│   │   ├── routes/              # API路由
│   │   ├── services/            # 业务服务
│   │   │   ├── ai.ts           # SiliconFlow 集成
│   │   │   ├── doubao.ts        # 豆包集成
│   │   │   ├── cos.ts           # 腾讯云 COS
│   │   │   └── image.ts         # 图片处理
│   │   ├── types/               # 类型定义
│   │   ├── utils/               # 工具函数
│   │   └── server.ts            # 入口文件
│   ├── database/                # SQLite 数据库文件
│   ├── package.json
│   └── .env                    # 环境变量
│
├── package.json                 # 前端依赖和脚本
├── vite.config.ts               # Vite 配置
├── tsconfig.json                # TypeScript 配置
└── README.md                    # 项目说明
```

## 核心功能

### 1. 衣橱管理
- 添加、编辑、删除服装单品
- 支持拍照或上传图片
- 自动标签（AI识别颜色、类别、风格）
- 分类浏览和搜索
- 图片上传到腾讯云 COS

### 2. AI穿搭建议
- 根据天气、场合推荐搭配
- 考虑用户身形特点
- 提供搭配理由说明

### 3. 虚拟试穿
- 基于用户照片和服装照片
- AI生成试穿效果图
- 支持多角度展示

### 4. 穿搭日记
- 记录每日穿搭
- 记录天气、心情
- 回顾穿搭历史

### 5. 数据分析
- 衣橱统计（品类、颜色、价值）
- 使用频率分析
- AI驱动的改进建议

## 开发命令

### 前端
```bash
npm install          # 安装依赖
npm run dev          # 开发模式 (http://localhost:5173)
npm run build        # 构建生产版本
npm run preview      # 预览构建结果
```

### 后端
```bash
cd backend
npm install          # 安装依赖
cp .env.example .env # 配置环境变量（首次运行）
npm run dev          # 开发模式 (http://localhost:3000)
npm run build        # 构建 TypeScript
npm start            # 启动生产服务器
```

## 环境变量配置

### 前端 (.env.local)
```
VITE_API_URL=http://localhost:3000/api
```

### 后端 (.env)

参考 `backend/.env.example` 文件，必需配置项：

```bash
# ==================== 服务器配置 ====================
PORT=3000
NODE_ENV=development

# ==================== JWT认证配置 ====================
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=720

# ==================== 数据库配置 ====================
# 使用 SQLite（开发环境）
USE_SQLITE=true
DB_PATH=./database/lumina.db

# 或使用 MySQL（生产环境）
# DB_HOST=your-mysql-host
# DB_PORT=3306
# DB_USER=your-username
# DB_PASSWORD=your-password
# DB_NAME=closet

# ==================== 硅基流动 AI 配置 ====================
SILICONFLOW_API_URL=https://api.siliconflow.cn/v1
SILICONFLOW_API_KEY=your-siliconflow-api-key
SILICONFLOW_MODEL=Qwen/Qwen2.5-72B-Instruct-128K
SILICONFLOW_VISION_MODEL=Qwen/Qwen2.5-VL-32B-Instruct

# ==================== 前端配置 ====================
CORS_ORIGIN=http://localhost:5173

# ==================== 文件上传配置 ====================
MAX_FILE_SIZE=10
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp

# ==================== 腾讯云 COS 配置 ====================
TENCENT_COS_SECRET_ID=your-cos-secret-id
TENCENT_COS_SECRET_KEY=your-cos-secret-key
TENCENT_COS_BUCKET=your-bucket-name
TENCENT_COS_REGION=ap-guangzhou
```

## API 接口

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 用户
- `GET /api/users/profile` - 获取用户档案
- `PUT /api/users/profile` - 更新用户档案
- `GET /api/users/stats` - 获取用户统计

### 衣橱
- `GET /api/wardrobe` - 获取衣橱列表
- `POST /api/wardrobe` - 添加单品
- `GET /api/wardrobe/:id` - 获取单品详情
- `PUT /api/wardrobe/:id` - 更新单品
- `DELETE /api/wardrobe/:id` - 删除单品
- `POST /api/wardrobe/:id/wear` - 标记为已穿着

### 日记
- `GET /api/diary` - 获取日记列表
- `POST /api/diary` - 创建日记
- `GET /api/diary/:id` - 获取日记详情
- `PUT /api/diary/:id` - 更新日记
- `DELETE /api/diary/:id` - 删除日记

### AI
- `POST /api/ai/auto-tag` - 服装图像自动标签
- `POST /api/ai/outfit` - AI穿搭建议
- `POST /api/ai/try-on` - 虚拟试穿
- `POST /api/ai/analyze` - 衣橱健康分析

### 调试 (开发环境)
- `GET /api/debug/cos-config` - 检查 COS 配置
- `GET /api/debug/cors-test` - 测试 COS 访问
- `POST /api/debug/setup-cors` - 自动配置 COS CORS

### 健康检查
- `GET /health` - 服务健康状态

## 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 使用 Prettier 格式化
- 提交前运行类型检查和 lint

## 注意事项

1. **AI服务**:
   - 需要有效的 SiliconFlow API Key（文本生成/图像识别）
   - 需要有效的豆包 Doubao API Key（图像生成）
   - 免费版 SiliconFlow 模型已配置

2. **数据库**:
   - 开发环境使用 SQLite（无需额外配置）
   - 生产环境建议使用 MySQL（需要配置连接信息）

3. **安全性**:
   - JWT Secret 在生产环境必须使用强随机字符串
   - CORS Origin 在生产环境应限制为实际域名

4. **图片存储**:
   - 图片上传到腾讯云 COS
   - 需要配置 COS 密钥和存储桶信息
   - COS 存储桶需要配置为"公有读私有写"

5. **COS 权限问题**:
   - 如果图片无法加载，请检查 COS 存储桶访问权限
   - 确保存储桶设置为"公有读私有写"
   - 访问控制台：https://console.cloud.tencent.com/cos5

## 故障排除

### 图片上传后无法显示

**症状**: 入库成功但图片显示失败或白屏

**解决方案**:

1. **检查 COS 存储桶权限**:
   - 登录腾讯云 COS 控制台
   - 找到存储桶：`5205210-1320011806`
   - 进入"权限管理" → "存储桶访问权限"
   - 设置为**公有读私有写**

2. **配置 CORS 规则**:
   - 控制台 → 存储桶 → 安全管理 → 跨域访问 CORS 设置
   - 添加规则：
     - 来源 Origin: `http://localhost:5173`, `*`
     - 操作 Methods: GET, HEAD, OPTIONS
     - Allow-Headers: *
     - Expose-Headers: ETag, Content-Type, x-cos-request-id
   - 或运行: `POST http://localhost:3000/api/debug/setup-cors`

3. **验证配置**:
   - 访问: `GET http://localhost:3000/api/debug/cos-config`
   - 访问: `GET http://localhost:3000/api/debug/cors-test`

### 后端启动失败

**检查**:
- 环境变量是否正确配置
- 数据库连接是否正常
- 端口 3000 是否被占用

### API 请求失败

**检查**:
- Token 是否有效
- 后端是否正常运行
- 网络连接是否正常

## 许可证

MIT

---

## 服务器配置（重要！请记住）

### SSH 连接信息
| 项目 | 值 |
|---|---|
| **公网 IP** | `101.37.159.90` |
| **用户名** | `root` |
| **SSH 端口** | `22` |
| **登录方式** | PEM 密钥文件登录 |
| **PEM 密钥路径** | `~/github/lumina-closet-ai-main/myapp.pem` |
| **备用密码** | `Aa13273956789.0`（服务器禁用了密码 SSH 登录，必须用 PEM 密钥） |

**快捷连接命令（在本机终端）：**
```bash
ssh -i ~/github/lumina-closet-ai-main/myapp.pem -o StrictHostKeyChecking=no root@101.37.159.90
```

### 宝塔面板
- **地址**: https://101.37.159.90:14648/a2443362
- **账号**: `rsfvne10`
- **密码**: `ceef7ff8`

### 测试账号（前端登录）
- **邮箱**: `1075638488@qq.com`
- **密码**: `12345678`

### 项目路径（服务器上）
- **项目根目录**: `/www/wwwroot/lumina-closet`
- **前端 dist 文件**: `/www/wwwroot/lumina-closet/dist`
- **后端**: `/www/wwwroot/lumina-closet/backend`
- **Nginx 配置**: `/www/server/nginx/conf/vhost/lumina-closet.conf`
- **PM2 应用名**: `lumina-backend`

---

### 🚀 部署流程（CI/CD 自动化）

**已配置 GitHub Actions 自动部署**（`.github/workflows/deploy.yml`）：

> **只需 `git push origin main`，剩下全自动！**

GitHub Actions 会自动：
1. SSH 连接服务器
2. `git pull` 拉取最新代码
3. `npm run build` 构建前端
4. `cd backend && npm install && npm run build` 构建后端
5. `pm2 reload lumina-backend` 重启后端

**验证状态：**
- ✅ **已于 2026-03-04 成功验证**。当前流程稳定，`git push` 后约 2-3 分钟服务即完成更新。
- 部署进度可在此查看：`https://github.com/win-z/lumina-closet-ai/actions`

#### 🔑 GitHub Actions 所需 Secrets（只需配置一次）

在仓库 **Settings → Secrets and variables → Actions → New repository secret** 中添加：

| Secret 名称 | 值 |
|---|---|
| `SERVER_HOST` | `101.37.159.90` |
| `SERVER_USER` | `root` |
| `SERVER_SSH_KEY` | PEM 私钥全文（`cat ~/github/lumina-closet-ai-main/myapp.pem`） |
| `GH_TOKEN` | GitHub Personal Access Token（用于服务器拉取私有仓库，如仓库为公开可不填） |

---

### 🔧 手动部署备用方案（CI/CD 失败时使用）

```bash
# 步骤1：pull 代码
ssh -i ~/github/lumina-closet-ai-main/myapp.pem -o StrictHostKeyChecking=no root@101.37.159.90 \
  "cd /www/wwwroot/lumina-closet && git pull origin main 2>&1"

# 步骤2：后台 build + restart（⚠️ 必须 nohup，SSH 长命令会超时断连）
ssh -i ~/github/lumina-closet-ai-main/myapp.pem -o StrictHostKeyChecking=no root@101.37.159.90 \
  "nohup bash -c 'cd /www/wwwroot/lumina-closet && npm run build > /tmp/build.log 2>&1 && cd backend && npm install >> /tmp/build.log 2>&1 && npm run build >> /tmp/build.log 2>&1 && pm2 restart lumina-backend >> /tmp/build.log 2>&1 && echo DEPLOY_ALL_DONE >> /tmp/build.log' &"

# 步骤3：检查进度（约 60-120 秒后）
ssh -i ~/github/lumina-closet-ai-main/myapp.pem -o StrictHostKeyChecking=no root@101.37.159.90 \
  "tail -30 /tmp/build.log"
# 出现 DEPLOY_ALL_DONE 即成功
```

---

### ⚠️ 踩坑记录（AI Agent 必读）

1. **SSH 长命令超时（exit 255）**：`npm run build` 约需 60s+，直接 SSH 执行会超时中断。
   - **✅ 解法**：`nohup ... &` 后台运行，轮询 `/tmp/build.log`。

2. **密码登录被禁用**：`sshpass`/`expect` 无效，必须用 PEM 密钥。
   - **✅ 密钥路径**：`~/github/lumina-closet-ai-main/myapp.pem`

3. **服务器项目路径**：`/www/wwwroot/lumina-closet`（不是本地的 `closet/`）

4. **前后端都需要 build**：前端 `npm run build` → 后端 `npm install && npm run build` → `pm2 restart lumina-backend`

5. **PM2 进程名**：`lumina-backend`，不要用 `pm2 restart all`

