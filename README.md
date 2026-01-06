# ChatThread

[English | 中文](#中文说明)

---

## Overview
ChatThread is an advanced AI-powered chat and workflow platform designed to boost your productivity. It seamlessly integrates intelligent conversation threads with customizable workflows, enabling individuals and teams to collaborate, automate, and manage tasks efficiently.

## Features
- **AI Chat Threads:** Organize conversations with context-aware AI assistance.
- **Workflow Integration:** Build, visualize, and automate workflows alongside your chats.
- **Multi-Platform:** Desktop app powered by Electron, with web support via Vite and React.
- **Team Collaboration:** Real-time collaboration, permission management, and versioned histories.
- **Customizable UI:** Modern, responsive interface with Tailwind CSS and Chakra UI components.
- **Extensible:** Plugin-ready architecture for future enhancements.
- **Secure:** Authentication, session management, and data privacy built-in.

## Installation
### Prerequisites
- Node.js (v18+ recommended)
- pnpm (recommended for dependency management)
- Electron (for desktop app)

### Setup
```bash
pnpm install
pnpm run dev
```
For Electron desktop:
```bash
pnpm run dev
```
For web only:
```bash
pnpm run dev:web
```

## Releases / Downloads

Download the official release builds and install the platform package that fits your system:

- **Web (instant):** https://chatthread.top/chat/
- **Windows (Microsoft Store):** https://apps.microsoft.com/detail/9nvk755bn4b8
- **macOS (App Store — Intel / Apple Silicon):** https://apps.apple.com/app/chatthread/id6744828531
- **iOS (App Store):** https://apps.apple.com/app/chatthread-ai-assistant/id6744828531

If you need direct installer files (dmg/AppImage/exe) or older releases, check the official website Downloads section or the project repository releases page.


## Folder Structure
```
app/           # Main frontend (React, Vite, Electron)
  components/  # UI and core components
  pages/       # Application pages (chat, dashboard, settings, etc.)
  hooks/       # Custom React hooks
  db/          # Local database logic
  modals/      # Modal dialogs
  contexts/    # React context providers
  customization/ # Feature flags, custom wrappers
lib/           # Electron main/preload scripts
resources/     # Build resources (icons, etc.)
```

## Contributing
We welcome contributions! Please submit issues or pull requests via GitHub. See the [CONTRIBUTING](CONTRIBUTING.md) file for guidelines.

## License
ChatThread is licensed under the Apache License 2.0. See [LICENSE](LICENSE) for details.

## Contact
For questions or support, open an issue on GitHub or contact the maintainer.

---

# 中文说明

## 项目简介
ChatThread 是一个先进的 AI 聊天与工作流平台，旨在提升您的工作效率。它将智能对话与可定制的工作流深度结合，帮助个人和团队高效协作、自动化任务和管理信息。

## 主要功能
- **AI 聊天线程：** 通过上下文感知的 AI 助手组织对话。
- **工作流集成：** 在聊天中可视化、构建和自动化工作流。
- **多平台支持：** 基于 Electron 的桌面应用，支持 Web 端（Vite + React）。
- **团队协作：** 实时协作、权限管理、历史版本追踪。
- **可定制界面：** 现代响应式 UI，采用 Tailwind CSS 和 Chakra UI。
- **可扩展架构：** 插件式设计，便于功能扩展。
- **安全保障：** 内置认证、会话管理和数据隐私保护。

## 安装方法
### 环境要求
- Node.js（建议 v18 及以上）
- pnpm（推荐依赖管理工具）
- Electron（桌面端）

### 启动步骤
```bash
pnpm install
pnpm run dev
```
桌面端启动：
```bash
pnpm run dev
```
Web 端启动：
```bash
pnpm run dev:web
```

## 发行版 / 下载

下载官方发行版本并选择适配你系统的安装包：

- **网页版（即时启动）：** https://chatthread.top/chat/
- **Windows（Microsoft 商店）：** https://apps.microsoft.com/detail/9nvk755bn4b8
- **macOS（App Store — Intel / Apple Silicon）：** https://apps.apple.com/app/chatthread/id6744828531
- **iOS（App Store）：** https://apps.apple.com/app/chatthread-ai-assistant/id6744828531

如果需要直接的安装文件（dmg、AppImage、exe）或历史发行版本，请访问官方网站的“下载”页面或仓库的 Releases 页查看。


## 目录结构
```
app/           # 前端主目录（React, Vite, Electron）
  components/  # UI 和核心组件
  pages/       # 应用页面（聊天、仪表盘、设置等）
  hooks/       # 自定义 React hooks
  db/          # 本地数据库逻辑
  modals/      # 弹窗组件
  contexts/    # React 上下文
  customization/ # 功能开关与自定义封装
lib/           # Electron 主进程/预加载脚本
resources/     # 构建资源（图标等）
```

## 参与贡献
欢迎任何形式的贡献！请通过 GitHub 提交 issue 或 pull request。详细规范请参见 [CONTRIBUTING](CONTRIBUTING.md)。

## 许可证
本项目采用 Apache License 2.0 许可证，详情见 [LICENSE](LICENSE)。

## 联系方式
如有问题或需要支持，请在 GitHub 提 issue 或联系维护者。
