# Sensory-Friendly Melbourne

CalmPath Melbourne - FIT5120 Onboarding Team project for the 2026 Semester 2 onboarding iteration.

面向 Melbourne CBD 感官敏感成年人的无登录步行路线比较原型。项目对应 UN SDG Goal 11，当前已完成可运行的前后端架构、可解释人流评分、提醒、安静空间展示和 AWS 部署基础。

> 当前路线和人流数据是确定性的演示数据，API 会明确返回 `mode: "MOCK"`。接入 Mapbox 与 City of Melbourne 数据并返回 `mode: "LIVE"` 前，不应描述为实时系统。

## 仓库结构

```text
.
├─ code/                         # 可运行代码和工程配置
│  ├─ frontend/                 # React + TypeScript + Vite
│  ├─ backend/                  # Lambda 风格 API
│  ├─ packages/contracts/       # 前后端共享接口
│  ├─ data/                     # baseline / fallback 数据入口
│  ├─ scripts/                  # 离线预处理脚本
│  └─ infra/                    # AWS SAM / CloudFormation
└─ documents/
   ├─ source/                   # 原始 PDF / DOCX 需求材料
   └─ project/                  # 项目梳理、架构与需求追踪
```

## 本地启动

需要 Node.js 24+ 和 pnpm 11+。

```bash
cd code
pnpm install
pnpm dev
```

打开 `http://localhost:5173`。前端会把 `/api` 转发到 `http://localhost:3001`。没有 Token 时使用示意地图和演示数据，仍可跑通主要流程。

若要启用 Mapbox 地图，把 `code/.env.example` 复制为 `code/frontend/.env.local`，并填写受 URL 和 scope 限制的 `VITE_MAPBOX_TOKEN`。

## 质量检查

```bash
cd code
pnpm check
```

该命令会运行类型检查、自动化测试和前后端生产构建。

## 文档入口

- [项目中文梳理](documents/project/项目梳理.md)
- [系统架构](documents/project/architecture.md)
- [需求与 DoD 追踪](documents/project/requirements-traceability.md)
- [AWS 部署说明](code/infra/README.md)
- [原始需求材料](documents/source/)
- [团队协作与分支规范](CONTRIBUTING.md)

## 上传 GitHub 前

依赖、构建结果、环境密钥、测试覆盖率和临时文件均由 `.gitignore` 排除。首次克隆后运行 `pnpm install` 即可恢复依赖。提交前请确认没有把真实 Mapbox Token、AWS 凭据或 `.env` 文件加入版本库。
