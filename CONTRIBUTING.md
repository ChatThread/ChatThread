# Contributing / 贡献指南

Thank you for considering contributing to ChatThread! We welcome contributions from everyone — whether it's a bug report, feature request, documentation improvement, or code change.

感谢您考虑为 ChatThread 贡献！无论是报告 bug、提出功能请求、改进文档或提交代码，我们都欢迎您的参与。

---

## Table of contents / 目录

- [How to file an issue](#how-to-file-an-issue)
- [Proposing changes / 提议变更]
- [Development setup / 本地开发环境]
- [Branching & workflow / 分支与工作流]
- [Code style & formatting / 代码风格与格式化]
- [Testing / 测试]
- [Pull request process / 提交 PR 流程]
- [Commit messages / 提交信息规范]
- [Review & CI / 评审与持续集成]
- [Code of Conduct / 行为准则]
- [License / 许可证]

---

## How to file an issue / 如何提交 Issue

- Provide a clear and descriptive title.
- Describe the steps to reproduce, expected behavior, and actual behavior.
- Include relevant environment details (OS, Node/Electron versions) and logs or screenshots when applicable.

示例：

- 提供清晰、有描述性的标题。
- 描述复现步骤、预期行为与实际行为。
- 如果适用，请附上环境信息（操作系统、Node/Electron 版本）、日志或截图。

---

## Proposing changes / 提议变更

If you want to propose a significant change (new feature, large refactor), please open an issue first to discuss the design. Small fixes and documentation improvements can go straight to a PR.

如果您要提议重大变更（新功能或大规模重构），请先打开 Issue 进行设计讨论。小修复或文档改进可以直接提交 PR。

---

## Development setup / 本地开发环境

Prerequisites:

- Node.js v18+ (recommended)
- pnpm

Quick start:

```bash
pnpm install
pnpm run dev # start electron + vite dev (desktop)
# or for web only
pnpm run dev:web
```

在开始修改代码前，请先运行项目并确认能在本地启动：

```bash
pnpm install
pnpm run dev
# 或者仅运行 web 开发环境
pnpm run dev:web
```

---

## Branching & workflow / 分支与工作流

- Main branch: `main` (stable)
- Feature branches: `feat/<short-description>`
- Fix branches: `fix/<short-description>`
- Use PRs for all changes; avoid pushing directly to `main`.

主分支为 `main`（稳定）。
功能分支命名示例：`feat/<简短描述>`，修复分支：`fix/<简短描述>`。
所有变更请通过 PR 合并，避免直接推送到 `main`。

---

## Code style & formatting / 代码风格与格式化

- We use TypeScript, React, and Tailwind CSS.
- Run the formatter and linters before committing:

```bash
pnpm run format
pnpm run lint
```

- Follow existing patterns in the codebase: hooks in `app/hooks`, pages in `app/pages`, components in `app/components`.

本仓库使用 TypeScript、React 与 Tailwind CSS。
提交前请运行格式化与 linter：

```bash
pnpm run format
pnpm run lint
```

并遵循代码库中已有的结构与约定（例如 `app/hooks`、`app/pages`、`app/components`）。

---

## Testing / 测试

- Add unit / integration tests where applicable.
- If you add tests, ensure they pass locally.

本项目欢迎单元测试和集成测试。如添加测试，请在本地运行并确保通过。

---

## Pull request process / 提交 PR 流程

1. Fork the repository and create a feature branch.
2. Make small, focused commits.
3. Run formatters and linters.
4. Open a PR against `main` with a clear title and description referencing any related issues.

PR 模板建议包含变更说明、相关 Issue、如何测试以及潜在的回归影响。

---

## Commit messages / 提交信息规范

- Use clear, concise messages.
- Recommended format: `type(scope): short description`
  - `feat`: new feature
  - `fix`: bug fix
  - `docs`: documentation
  - `chore`: build or tooling changes

示例：

```
feat(chat): add threaded conversation view
fix(ui): correct overflow on sidebar
```

---

## Review & CI / 评审与持续集成

- All PRs are reviewed by maintainers or contributors.
- CI runs linting and build checks. Fix any failing checks before requesting final review.

所有 PR 都会由维护者或贡献者进行审阅。CI 会运行 lint 与构建检查，请在请求审阅前修复任何失败的检查。

---

## Code of Conduct / 行为准则

We expect contributors to follow a respectful and collaborative tone. Please follow the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/), or include a local CODE_OF_CONDUCT.md if you prefer a custom policy.

我们希望贡献者保持尊重与协作的态度。请参阅 [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/)。

---

## License / 许可证

By contributing, you agree that your contributions will be licensed under the project's Apache-2.0 license. See [LICENSE](LICENSE) for details.

提交贡献即表示您同意将贡献在本项目的 Apache-2.0 许可证下发布，详情见 [LICENSE](LICENSE)。

---

## Contact / 联系方式

If you have questions, open an issue or mention the maintainers in the repository. For urgent matters, contact the maintainer listed in `package.json`.

如有疑问，请打开 Issue 或在仓库中 @ 维护者。紧急事项请联系 `package.json` 中列出的维护者。


---

Thank you for helping improve ChatThread! / 感谢您为 ChatThread 做出的贡献！
