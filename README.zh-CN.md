# OpenClaw Office · 中文参考

[English (primary)](README.md) · **简体中文（次要版本）**

OpenClaw Office 是 [OpenClaw](https://github.com/openclaw/openclaw) 的配套仪表盘，用虚拟办公室展示多智能体的任务流、协作与活动。完整配置、部署与架构说明见[英文主版](README.md)。

![OpenClaw Office 仪表盘](public/sprites/office-complete.png)

## 主要功能

- AI 生成的等距办公室场景。
- 任务委派、智能体协作及多步调用链动画。
- 定期发现 OpenClaw Gateway 中新增或移除的智能体，并提示同步配置。
- 基于 SQLite 的活动日志、Token 使用和成本统计。

## 快速开始

```bash
npx openclaw-office init
```

按交互向导连接 Gateway、发现智能体、选择风格、生成场景并启动仪表盘。默认地址为 [http://localhost:4200](http://localhost:4200)。

手动安装流程保留在[英文说明](README.md#manual-setup)，使用上游 `wickedapp/openclaw-office` 的安装示例。配置示例位于 `openclaw-office.config.example.json`，环境变量示例位于 `.env.example`。

## 配置

`openclaw-office.config.json` 描述办公室名称和风格、Gateway 地址及令牌、智能体角色和位置、场景图片，以及可选 Telegram 通知。

| 环境变量 | 用途 |
| --- | --- |
| `OPENCLAW_GATEWAY_URL` | Gateway WebSocket 地址，覆盖配置文件 |
| `OPENCLAW_GATEWAY_TOKEN` | Gateway 认证令牌，覆盖配置文件 |
| `GEMINI_API_KEY` | Gemini 图片生成接口 |
| `TELEGRAM_BOT_TOKEN` | Telegram 通知机器人令牌 |
| `TELEGRAM_CHAT_ID` | Telegram 通知会话 ID |

活动日志中的名称来自 Gateway 中的智能体身份，不是操作系统用户名。

## 部署与开发

支持 Docker、PM2、systemd 和 macOS launchd；完整命令保留在[部署说明](README.md#deployment)。项目使用 Next.js，REST/SSE 入口位于 `app/api/`，命令行工具位于 `cli/`，可视化组件位于 `components/`，共享服务与日志处理位于 `lib/`。

贡献方式见 [CONTRIBUTING.md](CONTRIBUTING.md)。采用 MIT 许可证，见 [LICENSE](LICENSE)。
