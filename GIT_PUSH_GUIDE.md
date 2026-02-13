# Git Push 指南

## 方法 1：使用 Personal Access Token（推荐）

### 创建 Token（如还没有）
1. 访问：https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 名称：`git-push`
4. 勾选 `repo` 权限
5. 点击 "Generate token"
6. **复制 Token**（只显示一次！）

### 推送命令
```bash
cd closet
git remote set-url origin https://YOUR_TOKEN@github.com/win-z/lumina-closet-ai.git
git push -u origin main
```

将 `YOUR_TOKEN` 替换为刚才创建的 Token。

---

## 方法 2：使用 SSH

### 检查 SSH 密钥
```bash
ls ~/.ssh/id_rsa
```

### 如有 SSH 密钥
```bash
cd closet
git remote set-url origin git@github.com:win-z/lumina-closet-ai.git
git push -u origin main
```

### 如没有 SSH 密钥
1. 生成密钥：`ssh-keygen -t rsa -C "your@email.com"`
2. 添加到 SSH Agent：`eval "$(ssh-agent -s)" && ssh-add ~/.ssh/id_rsa`
3. 复制公钥：`clip < ~/.ssh/id_rsa.pub`
4. 粘贴到 GitHub：https://github.com/settings/keys

---

## 方法 3：使用 GitHub CLI（推荐安装）

### 安装
```cmd
winget install GitHub.cli
```

### 登录
```cmd
gh auth login
```
按提示选择：
- GitHub.com: Yes
- HTTPS: Yes
- Login with web browser: No (输入 token)
- Token: 粘贴你的 Personal Access Token

### 推送
```bash
cd closet
git push -u origin main
```

---

## 推送后

成功推送后，在 GitHub 仓库页面：
1. 进入 **Actions** 选项卡
2. 等待工作流运行（约2-3分钟）
3. 看到绿色 ✓ 表示成功
4. 访问 Vercel 查看网站
