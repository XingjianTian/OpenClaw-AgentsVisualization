# OpenClaw Office Agent 架构说明

## 关键概念区分

### 1. 系统用户名 vs Agent 名称

| 概念 | 来源 | 用途 | 示例 |
|------|------|------|------|
| **系统用户名** | `process.env.USER` | 标识当前操作系统用户 | `txj` |
| **Agent 名称** | OpenClaw Gateway | AI Agent 的身份标识 | `wickedman` |

### 2. Activity Log 显示逻辑

```
Activity Log 显示的是：agent 名称（从 Gateway 读取）
                    ↓
              "wickedman 正在分析..."
                    ↓
           这里的 wickedman 是 AI Agent，不是系统用户
```

## 验证结果 (2026-03-12)

### ✅ 已完成

1. **GridOffice 田字格网格** - 正常工作
   - 3×3 网格正确显示
   - 7 个 agents 在网格点上移动
   - 3 秒平滑移动动画正常

2. **WickedMan 理解澄清** - 架构正确
   - `wickedman` 是 Agent 名称（从 OpenClaw Gateway 获取）
   - 不是系统用户名
   - Activity Log 正确显示 Agent 名称

3. **代码修改** - 已完成
   - 移除了硬编码的 `wickedman` 路径
   - 添加了 `getOrchestratorId()` 使用系统用户名
   - 前端组件适配客户端使用

### 文件修改记录

- `lib/config.js` - 添加 orchestrator 获取函数
- `lib/openclaw-ws.js` - 使用动态 orchestrator ID
- `lib/openclaw.js` - 移除硬编码路径
- `lib/dashboard-sync.js` - 更新 AGENTS 定义
- `components/RequestPipeline.js` - 客户端化
- `components/AgentTaskIndicator.js` - 客户端化
- `components/IsometricOffice.js` - 客户端化
- `app/api/*` - 多处 API 路由更新

## 架构说明

### Agent 信息来源

```javascript
// Agent 信息从 OpenClaw Gateway 获取
const AGENTS = new Proxy({}, {
  get(target, prop) {
    const agents = getAgentsMap() // 从 config 读取
    return agents[prop]
  }
})

// 使用时
AGENTS['wickedman'] // { name: 'WickedMan', role: 'Orchestrator', ... }
```

### Orchestrator 获取

```javascript
// 系统级标识（当前用户）
export function getOrchestratorId() {
  return process.env.ORCHESTRATOR_ID || 
         process.env.USER || 
         process.env.USERNAME || 
         'user'
}
```

## 注意事项

1. **Activity Log 中的 `wickedman`** 是正确的，这是 Agent 名称
2. **历史数据**会保留原有的 Agent 名称
3. **新事件**会根据代码修改使用新的逻辑
4. **不要将系统用户名和 Agent 名称混淆**

## Playwright 验证命令

```bash
# 使用 headless 模式截图验证
npx playwright-core screenshot \
  --browser=chromium \
  --viewport-size=1280,900 \
  --wait-for-timeout=5000 \
  http://localhost:4200 \
  ./verify.png
```
