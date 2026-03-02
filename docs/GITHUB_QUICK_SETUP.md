# GitHub Actions 自动部署配置

## 快速配置

### 1. 创建 GitHub 仓库

访问 https://github.com/new 创建新仓库，名字建议：
- `lumina-closet-ai`
- `closet-pwa`
- 或其他你喜欢的名字

### 2. 推送代码到 GitHub

```bash
cd closet

# 初始化（如尚未初始化）
git init

# 添加所有文件
git add .

# 提交
git commit -m "初始化：添加PWA支持和自动部署配置"

# 关联远程仓库（替换YOUR_USERNAME为你的GitHub用户名）
git remote add origin https://github.com/YOUR_USERNAME/lumina-closet-ai.git

# 推送
git branch -M main
git push -u origin main
```

### 3. 在 Vercel 创建项目

#### 方法A：通过 Vercel 网站（推荐）

1. 访问 https://vercel.com/new
2. 点击 "**Import Git Repository**"
3. 授权 GitHub，选择你的仓库 `lumina-closet-ai`
4. 配置：
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. 点击 **Deploy**
6. 部署完成后，进入项目设置获取 ID

#### 方法B：通过 Vercel CLI

在 CMD 中运行：

```cmd
cd C:\Users\Lenovo\Desktop\lumina-closet-ai-main\closet

vercel login
vercel
```

按提示选择：
- Set up and deploy? **Y**
- Which scope? 选择你的账号
- Link to existing project? **N**
- What's your project name? `lumina-closet-ai`
- In which directory is your code located? **./** (回车)
- Want to modify these settings? **N**

部署完成后，你会看到：
- 🔗 项目链接：https://lumina-closet-ai-xxxxx.vercel.app
- 📋 项目 ID：prj_xxxxx
- 🏢 组织 ID：team_xxxxx

### 4. 获取 Vercel 项目信息

项目创建后，获取以下信息：

**方法一：查看 .vercel/project.json**
```bash
cat .vercel/project.json
```

输出示例：
```json
{
  "orgId": "team_6GIOdO3W9O1xlwiUgf7tUE7G",
  "projectId": "prj_Abc123Xyz789"
}
```

**方法二：Vercel网站查看**
1. 访问 https://vercel.com/dashboard
2. 点击你的项目
3. 点击 Settings → General
4. 查看 Project ID 和 Team/Organization ID

### 5. 配置 GitHub Secrets

访问你的 GitHub 仓库页面：
`https://github.com/YOUR_USERNAME/lumina-closet-ai/settings/secrets/actions`

添加以下 Secrets：

| 名称 | 值 | 说明 |
|------|-----|------|
| `VERCEL_TOKEN` | 你的Vercel Token | 从 https://vercel.com/account/tokens 获取 |
| `VERCEL_ORG_ID` | `team_xxxxx` | 从上一步获取 |
| `VERCEL_PROJECT_ID` | `prj_xxxxx` | 从上一步获取 |

### 6. 测试自动部署

推送代码触发 Actions：

```bash
# 修改任意文件，比如 README.md
echo "# Test" >> README.md

git add .
git commit -m "测试自动部署"
git push origin main
```

然后：
1. 打开 GitHub 仓库 → Actions 选项卡
2. 查看工作流运行状态
3. 等待几分钟，看到绿色 ✓ 表示成功
4. 访问 Vercel 网站查看最新部署

---

## 文件说明

### `.github/workflows/deploy.yml`
自动部署工作流配置，已包含在代码中。

触发条件：
- Push 到 main 分支 → 生产部署
- Pull Request → 预览部署

### 工作流步骤
1. 检出代码
2. 设置 Node.js 18
3. 安装依赖 (`npm ci`)
4. 构建项目 (`npm run build`)
5. 部署到 Vercel

---

## 后续更新代码

配置完成后，更新网站只需：

```bash
# 修改代码...
npm run build  # 本地测试构建

# 提交并推送
git add .
git commit -m "更新功能：xxx"
git push origin main
```

GitHub Actions 会自动部署到 Vercel！

---

## 常见问题

### Q: GitHub Actions 显示失败？

检查：
1. Secrets 是否正确设置（3个都要设置）
2. 代码能否本地构建成功
3. 查看 Actions 日志获取详细错误

### Q: Vercel 项目 ID 在哪里找？

方法一：
```bash
cat .vercel/project.json
```

方法二：
1. 访问 https://vercel.com/dashboard
2. 点击项目 → Settings
3. 查看 General 页面

### Q: 如何更新 Token？

1. 访问 https://vercel.com/account/tokens
2. 创建新 Token
3. 在 GitHub Secrets 中更新 VERCEL_TOKEN

---

## 完成检查清单

- [ ] GitHub 仓库已创建
- [ ] 代码已 push 到 GitHub
- [ ] Vercel 项目已创建（通过网站或CLI）
- [ ] 获取到 ORG_ID 和 PROJECT_ID
- [ ] GitHub Secrets 已配置（3个）
- [ ] 推送代码触发了 Actions
- [ ] Actions 成功运行（绿色）
- [ ] Vercel 网站已更新
- [ ] 手机可以正常访问和使用

全部完成后，你就拥有了全自动的 CI/CD 流程！🎉
