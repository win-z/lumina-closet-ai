# GitHub Actions 自动部署到 Vercel 配置指南

本指南将教你如何配置 GitHub Actions，实现代码推送到 GitHub 后自动部署到 Vercel。

## 🎯 效果

配置完成后，你只需要：
```bash
git add .
git commit -m "更新功能"
git push origin main
```

GitHub Actions 会自动：
1. 检出代码
2. 安装依赖
3. 构建项目
4. 部署到 Vercel

无需手动操作！

---

## 📋 前置条件

- GitHub 账号
- Vercel 账号
- 代码已上传到 GitHub 仓库

---

## 🔧 配置步骤

### 步骤 1：初始化 Git 仓库（如尚未初始化）

```bash
cd closet

# 如果还没有初始化git仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "初始化项目，添加PWA支持"

# 创建GitHub仓库后，关联远程仓库
git remote add origin https://github.com/YOUR_USERNAME/lumina-closet-ai.git
git branch -M main
git push -u origin main
```

### 步骤 2：获取 Vercel 组织ID和项目ID

你需要三个信息：
1. **VERCEL_TOKEN** (你已有的)
2. **VERCEL_ORG_ID** (组织ID)
3. **VERCEL_PROJECT_ID** (项目ID)

#### 方法A：通过 Vercel 网站获取

1. 打开 https://vercel.com/dashboard
2. 找到你的项目，点击进入
3. 点击 "**Settings**" 选项卡
4. 在左侧选择 "**General**"
5. 滚动到 "**Project ID**" 和 "**Team/Organization ID**"
6. 复制这两个值

#### 方法B：通过 Vercel CLI 获取

打开 CMD（不是 PowerShell），运行：

```cmd
cd C:\Users\Lenovo\Desktop\lumina-closet-ai-main\closet

# 登录
vercel login

# 链接项目（如果还没链接过）
vercel link

# 查看项目配置
cat .vercel/project.json
```

你会看到类似：
```json
{
  "orgId": "team_6GIOdO3W9O1xlwiUgf7tUE7G",
  "projectId": "prj_xxxxxxxxxxxxxxxx"
}
```

这就是 `VERCEL_ORG_ID` 和 `VERCEL_PROJECT_ID`。

### 步骤 3：在 GitHub 仓库中设置 Secrets

1. 打开你的 GitHub 仓库页面
2. 点击顶部菜单的 "**Settings**"（设置）
3. 在左侧菜单中点击 "**Secrets and variables**" → "**Actions**"
4. 点击 "**New repository secret**"（新建仓库密钥）
5. 添加以下三个密钥：

#### Secret 1: VERCEL_TOKEN
- **Name**: `VERCEL_TOKEN`
- **Secret**: `你的Vercel Token`（从 https://vercel.com/account/tokens 获取）
- 点击 "**Add secret**"

#### Secret 2: VERCEL_ORG_ID
- **Name**: `VERCEL_ORG_ID`
- **Secret**: `team_6GIOdO3W9O1xlwiUgf7tUE7G`（从步骤2获取的实际值）
- 点击 "**Add secret**"

#### Secret 3: VERCEL_PROJECT_ID
- **Name**: `VERCEL_PROJECT_ID`
- **Secret**: `prj_xxxxxxxx`（从步骤2获取的实际值）
- 点击 "**Add secret**"

### 步骤 4：测试自动部署

现在推送代码测试自动部署：

```bash
git add .
git commit -m "配置GitHub Actions自动部署"
git push origin main
```

然后：

1. 打开 GitHub 仓库页面
2. 点击顶部的 "**Actions**" 选项卡
3. 你应该看到正在运行的工作流 "**Deploy to Vercel**"
4. 等待几分钟，显示绿色 ✓ 表示成功
5. 访问你的 Vercel 网站查看更新

---

## 🔄 工作流说明

`.github/workflows/deploy.yml` 文件配置了以下行为：

### 触发条件
- `push` 到 `main` 或 `master` 分支 → 部署到生产环境
- `pull_request` 到 `main` 或 `master` → 部署预览环境

### 执行步骤
1. **检出代码** - 获取最新代码
2. **设置 Node.js** - 安装 Node.js 18
3. **安装依赖** - 运行 `npm ci`（比 npm install 更快，用于CI环境）
4. **构建项目** - 运行 `npm run build`
5. **部署到 Vercel** - 使用你提供的 Token 和 ID 自动部署

### 环境变量
- `CI: true` - 告诉 Vite 这是CI环境，优化构建输出

---

## 🎨 自定义配置

### 修改Node.js版本

编辑 `.github/workflows/deploy.yml`：
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'  # 改为20或其他版本
    cache: 'npm'
```

### 添加测试步骤

取消工作流文件中测试部分的注释：
```yaml
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm test
```

### 部署到不同环境

如需区分开发/测试/生产环境：
```yaml
- name: Deploy to Vercel (Development)
  if: github.ref == 'refs/heads/develop'
  # ...

- name: Deploy to Vercel (Production)
  if: github.ref == 'refs/heads/main'
  # ...
```

---

## 🐛 故障排除

### 问题1：部署失败，提示 "No existing credentials"

**原因**：VERCEL_TOKEN 错误或过期

**解决**：
1. 访问 https://vercel.com/account/tokens
2. 创建新 Token
3. 更新 GitHub Secret

### 问题2：找不到项目

**原因**：VERCEL_ORG_ID 或 VERCEL_PROJECT_ID 错误

**解决**：
1. 确保项目已在 Vercel 创建
2. 从 Vercel 项目设置中复制正确的 ID
3. 更新 GitHub Secrets

### 问题3：构建失败

**原因**：代码错误

**解决**：
1. 在本地运行 `npm run build` 确保能成功构建
2. 修复代码错误
3. 重新 push

### 问题4：Actions未触发

**原因**：分支名称不匹配

**解决**：
1. 检查工作流文件中的分支名称：`branches: [main]`
2. 确保你的分支名匹配（main 或 master）
3. 检查文件是否已 push 到 GitHub：
   ```bash
   git push origin main
   ```

---

## 📊 监控部署状态

### GitHub 页面查看
- 打开仓库 → Actions 选项卡
- 查看工作流运行状态
- 点击具体运行记录查看详细日志

### Vercel 页面查看
- 打开 https://vercel.com/dashboard
- 查看项目部署历史
- 查看实时日志

### 邮件通知
- GitHub 默认会在 Actions 失败时发送邮件
- 可以在个人设置中配置通知偏好

---

## 🚀 使用建议

### 开发工作流
1. 本地开发：`npm run dev`
2. 本地构建测试：`npm run build`
3. 提交代码：`git push origin main`
4. 等待自动部署完成（约2-3分钟）
5. 在手机上测试更新

### 最佳实践
- 每次 push 前先本地构建测试
- 使用有意义的 commit 信息
- 大功能使用分支开发，通过 PR 合并到 main
- 关注 Actions 通知，及时处理失败

---

## 📞 需要帮助？

如果配置过程中遇到问题：

1. 查看 GitHub Actions 日志（最详细的错误信息）
2. 检查 Secrets 是否正确设置
3. 确认 Vercel 项目存在且可访问
4. 参考 Vercel 官方文档：https://vercel.com/docs/concepts/git/vercel-for-github

---

## ✅ 配置检查清单

- [ ] 代码已上传到 GitHub 仓库
- [ ] Vercel 项目已创建
- [ ] GitHub Secrets 已设置（3个）
- [ ] 推送代码触发 Actions
- [ ] Actions 成功运行（绿色 ✓）
- [ ] Vercel 网站已更新
- [ ] 手机可以正常访问

完成以上步骤后，你就拥有了一个全自动的部署流程！🎉
