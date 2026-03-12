# OpenClaw Office 集成迁移文档

> **项目**: OpenClaw Office → PsyTwin-Sentinel Web后台  
> **文档版本**: 1.0  
> **编写日期**: 2026-03-12  
> **适用对象**: 田老师 (PsyTwin-Sentinel 项目负责人)

---

## 1. 项目概述

### 1.1 什么是 OpenClaw Office

**OpenClaw Office** 是一个基于 Next.js 构建的**虚拟AI办公室仪表板**，用于实时可视化多智能体工作流。它提供了一个沉浸式的3D等距办公室场景，让用户可以直观地观察AI智能体之间的协作过程。

**核心价值**:
- 🎨 **AI生成的办公室场景** - 自定义风格（赛博朋克、现代等）
- ⚡ **实时工作流动画** - 任务委托、智能体协作的可视化
- 🔗 **多步骤链式可视化** - Agent A → Orchestrator → Agent B
- 📊 **活动日志与成本追踪** - Token使用量、成本节约统计
- 🔌 **OpenClaw Gateway 集成** - 与任何 OpenClaw 实例兼容

### 1.2 技术栈分析

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **前端框架** | Next.js | 15.1.6 | React全栈框架 |
| **UI库** | React | 19.0.0 | 组件化UI |
| **样式** | Tailwind CSS | 3.4.17 | 原子化CSS |
| **动画** | Framer Motion | 12.4.7 | 流畅动画效果 |
| **数据库** | better-sqlite3 | 12.6.2 | 本地数据存储 |
| **实时通信** | WebSocket / SSE | ws@8.19.0 | Gateway连接与实时推送 |
| **图标** | Lucide React | 0.474.0 | 现代化图标库 |
| **CLI** | Commander | 14.0.3 | 命令行工具 |

### 1.3 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenClaw Office                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Web界面    │  │  API服务    │  │   CLI工具           │ │
│  │  (Next.js)  │  │  (App Route)│  │   (Node.js)         │ │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────┘ │
│         │                │                                   │
│  ┌──────▼────────────────▼──────────────────────────────┐  │
│  │                   核心服务层                         │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐  │  │
│  │  │ Config  │  │   DB    │  │EventBus │  │ Gateway│  │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│         │                │                                   │
│  ┌──────▼────────────────▼──────────────────────────────┐  │
│  │                   数据存储层                         │  │
│  │  ┌──────────────┐  ┌──────────────────────────────┐  │  │
│  │  │ SQLite 数据库 │  │    配置文件 (JSON)           │  │  │
│  │  └──────────────┘  └──────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ WebSocket
                              ▼
                    ┌──────────────────┐
                    │  OpenClaw Gateway │
                    │   (外部服务)      │
                    └──────────────────┘
```

---

## 2. 功能模块详解

### 2.1 核心功能模块

#### 2.1.1 实时工作流可视化 (`/app/page.js`)

**功能**: 主仪表板页面，提供Tab式导航界面

**主要Tab**:
- **Main Office** - 3D等距办公室可视化
- **Interaction Stats** - 交互统计数据
- **Agent Thoughts** - 智能体思维/日志
- **Cost Savings** - 成本节约统计
- **Security** - 安全监控
- **Database** - 数据库管理

**技术特点**:
- 使用 Framer Motion 实现页面切换动画
- 自动轮询统计API (30秒间隔)
- 响应式布局适配移动端

#### 2.1.2 等距办公室场景 (`/components/IsometricOffice.js`)

**功能**: 核心的3D办公室可视化组件

**核心特性**:
1. **动态智能体位置** - 支持拖拽调整位置，自动保存到 localStorage
2. **任务飞行动画** - 任务从WickedMan飞向目标Agent的动画效果
3. **返回邮件动画** - 任务完成后的返回动画
4. **任务气泡** - 显示当前执行中的任务详情
5. **实时状态指示** - 在线/工作中状态指示灯

**动画系统**:
```javascript
// 任务飞行路径
WickedMan → Target Agent
   ↓
Particle Trail (粒子拖尾效果)
   ↓
Task Card Animation
   ↓
Impact Flash (到达冲击效果)
```

#### 2.1.3 SSE实时流 (`/app/api/workflow/stream/route.js`)

**功能**: Server-Sent Events 服务端推送

**事件类型**:
| 事件名 | 描述 | 触发时机 |
|--------|------|----------|
| `snapshot` | 初始状态快照 | 连接建立时 |
| `activity` | 工作流活动 | 新事件发生时 |
| `request` | 请求更新 | 请求状态变更 |
| `task` | 任务更新 | 任务状态变更 |
| `message` | 消息通知 | 收到新消息时 |

**心跳机制**: 每15秒发送保持连接

#### 2.1.4 数据库层 (`/lib/db.js`)

**SQLite 表结构**:

```sql
-- 每日统计表
CREATE TABLE daily_stats (
  date TEXT PRIMARY KEY,
  messages_received INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  total_task_time_ms INTEGER DEFAULT 0,
  estimated_human_time_ms INTEGER DEFAULT 0,
  savings_myr REAL DEFAULT 0
);

-- 请求表
CREATE TABLE requests (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  from_user TEXT DEFAULT 'Boss',
  state TEXT DEFAULT 'received',
  assigned_to TEXT,
  task_id TEXT,
  task_title TEXT,
  task_detail TEXT,
  task_target_agent TEXT,
  task_reason TEXT,
  created_at INTEGER,
  work_started_at INTEGER,
  completed_at INTEGER,
  result TEXT,
  source TEXT DEFAULT 'api',
  tg_message_id INTEGER,
  chain_id TEXT
);

-- 事件表
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  request_id TEXT,
  state TEXT,
  agent TEXT,
  agent_color TEXT,
  agent_name TEXT,
  message TEXT,
  target_agent TEXT,
  time TEXT,
  timestamp INTEGER,
  result TEXT
);

-- 任务表
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  request_id TEXT,
  title TEXT,
  detail TEXT,
  assigned_agent TEXT,
  status TEXT DEFAULT 'pending',
  created_at INTEGER,
  started_at INTEGER,
  completed_at INTEGER,
  result TEXT
);
```

### 2.2 API 端点清单

| 端点路径 | 方法 | 功能描述 |
|----------|------|----------|
| `/api/health` | GET | 健康检查，返回服务状态 |
| `/api/config` | GET | 获取公开配置（无敏感信息） |
| `/api/stats` | GET | 统计数据（今日/历史） |
| `/api/stats/agents` | GET | 智能体统计详情 |
| `/api/workflow/stream` | GET | SSE实时流 |
| `/api/workflow` | POST | 接收工作流事件 |
| `/api/messages` | GET/POST | 消息管理 |
| `/api/tasks` | GET/POST | 任务管理 |
| `/api/database` | GET | 数据库信息 |
| `/api/agents/sync` | POST | 同步智能体配置 |
| `/api/generate` | POST | 触发图片生成 |
| `/api/session` | POST | 会话管理 |
| `/api/telegram/webhook` | POST | Telegram Bot Webhook |

---

## 3. 集成方案设计

### 3.1 集成模式选择

根据 PsyTwin-Sentinel 的技术栈和需求，推荐以下**三种集成模式**：

#### 模式A: iframe 嵌入 (推荐度: ⭐⭐⭐)

**适用场景**: 快速集成，保持项目独立性

```
┌─────────────────────────────────────┐
│      PsyTwin-Sentinel Dashboard     │
│  ┌───────────────────────────────┐  │
│  │      导航菜单 / 头部           │  │
│  ├───────────────────────────────┤  │
│  │                               │  │
│  │   ┌─────────────────────┐     │  │
│  │   │                     │     │  │
│  │   │  OpenClaw Office    │     │  │
│  │   │  (iframe 4200端口)  │     │  │
│  │   │                     │     │  │
│  │   └─────────────────────┘     │  │
│  │                               │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**优点**:
- ✅ 快速部署，无需代码改造
- ✅ 项目保持独立，易于维护
- ✅ 支持独立升级 OpenClaw Office

**缺点**:
- ❌ 跨域通信需要额外处理
- ❌ 样式隔离，可能视觉不统一

---

#### 模式B: 组件化集成 (推荐度: ⭐⭐⭐⭐⭐)

**适用场景**: 深度集成，统一用户体验

```
┌────────────────────────────────────────┐
│      PsyTwin-Sentinel Dashboard        │
│  ┌──────────────────────────────────┐  │
│  │         统一导航栏                │  │
│  ├──────────────────────────────────┤  │
│  │  ┌────────────┐  ┌────────────┐  │  │
│  │  │ 原有模块A  │  │ 原有模块B  │  │  │
│  │  └────────────┘  └────────────┘  │  │
│  │  ┌────────────────────────────┐  │  │
│  │  │   OpenClaw 办公室视图       │  │  │  │  │  │     (复用 IsometricOffice)    │  │  │  │  │  └────────────────────────────┘  │  │
│  │  ┌────────────┐  ┌────────────┐  │  │
│  │  │ 统计面板   │  │ 日志面板   │  │  │
│  │  └────────────┘  └────────────┘  │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

**实施方式**:
1. 将 `/components` 目录下的组件迁移到 PsyTwin-Sentinel
2. 复用 `/lib` 目录的核心服务
3. 调整样式以匹配 PsyTwin-Sentinel 设计系统
4. 共享数据库或使用API桥接

**优点**:
- ✅ 完全统一的UI/UX体验
- ✅ 可以深度定制功能
- ✅ 共享用户认证和权限
- ✅ 更好的性能（无iframe开销）

**缺点**:
- ❌ 需要较多开发工作
- ❌ 升级维护成本较高

---

#### 模式C: API网关集成 (推荐度: ⭐⭐⭐⭐)

**适用场景**: 微服务架构，服务解耦

```
┌────────────────────────────────────────────┐
│         PsyTwin-Sentinel Gateway           │
│         (统一API网关)                       │
├────────────────────────────────────────────┤
│              │              │              │
│    ┌─────────▼────┐  ┌──────▼──────┐      │
│    │ PsyTwin API  │  │ OpenClaw API│      │
│    │   服务       │  │   服务      │      │
│    └──────────────┘  └─────────────┘      │
└────────────────────────────────────────────┘
                          │
                          ▼
              ┌──────────────────┐
              │ OpenClaw Office  │
              │  (独立服务)      │
              └──────────────────┘
```

**优点**:
- ✅ 服务解耦，独立扩展
- ✅ 统一API管理
- ✅ 适合大规模部署

**缺点**:
- ❌ 架构复杂度增加
- ❌ 需要网关层开发

---

### 3.2 推荐方案: 混合模式 (模式B + 模式A)

**建议实施策略**:

```
阶段一 (快速上线): iframe 嵌入模式
    ↓
阶段二 (深度集成): 组件化迁移
    ↓
阶段三 (架构优化): 微服务拆分
```

---

## 4. 详细迁移步骤

### 4.1 阶段一: iframe 嵌入集成 (1-2天)

#### 步骤 1.1: 配置 OpenClaw Office

```bash
# 1. 克隆或复制项目
cd /path/to/psytwin-sentinel/integrations/openclaw-office

# 2. 安装依赖
npm install

# 3. 创建配置文件
cp openclaw-office.config.example.json openclaw-office.config.json
cp .env.example .env.local
```

#### 步骤 1.2: 配置调整

编辑 `openclaw-office.config.json`:

```json
{
  "version": "0.1.0",
  "gateway": {
    "url": "ws://your-openclaw-gateway:18789",
    "connected": true
  },
  "agents": [
    {
      "id": "main",
      "name": "主控智能体",
      "role": "Orchestrator",
      "emoji": "🤖",
      "color": "#6366f1"
    }
  ],
  "style": {
    "theme": "cyberpunk"
  },
  "deployment": {
    "method": "docker",
    "port": 4200
  }
}
```

编辑 `.env.local`:

```bash
# Gateway连接配置
OPENCLAW_GATEWAY_URL=ws://your-openclaw-gateway:18789
OPENCLAW_GATEWAY_TOKEN=your-secure-token

# 可选: Telegram通知
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

#### 步骤 1.3: 构建并启动

```bash
# 构建
npm run build

# 启动（端口4200）
npm start

# 或使用 Docker
docker build -t openclaw-office .
docker run -d \
  -p 4200:4200 \
  -v $(pwd)/openclaw-office.config.json:/app/openclaw-office.config.json \
  -v $(pwd)/data:/app/data \
  --env-file .env.local \
  --name openclaw-office \
  openclaw-office
```

#### 步骤 1.4: 在 PsyTwin-Sentinel 中嵌入 iframe

在 PsyTwin-Sentinel 前端添加 iframe 组件:

```tsx
// PsyTwin-Sentinel: components/OpenClawOfficeEmbed.tsx
'use client';

import { useEffect, useRef } from 'react';

interface OpenClawOfficeEmbedProps {
  src?: string;
  height?: string;
}

export function OpenClawOfficeEmbed({
  src = 'http://localhost:4200',
  height = 'calc(100vh - 64px)'
}: OpenClawOfficeEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // 处理跨域消息通信（如需要）
    const handleMessage = (event: MessageEvent) => {
      // 验证来源
      if (!event.origin.includes('localhost:4200')) return;
      
      // 处理 OpenClaw Office 发送的消息
      switch (event.data.type) {
        case 'AGENT_STATUS_CHANGE':
          // 通知 PsyTwin-Sentinel 智能体状态变更
          console.log('Agent status:', event.data.payload);
          break;
        case 'TASK_COMPLETED':
          // 任务完成通知
          console.log('Task completed:', event.data.payload);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      src={src}
      style={{
        width: '100%',
        height,
        border: 'none',
        borderRadius: '8px',
        background: '#0a0a1a'
      }}
      allow="fullscreen"
      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
    />
  );
}
```

添加到 PsyTwin-Sentinel 路由:

```tsx
// PsyTwin-Sentinel: app/dashboard/openclaw/page.tsx
import { OpenClawOfficeEmbed } from '@/components/OpenClawOfficeEmbed';

export default function OpenClawPage() {
  return (
    <div className="container-fluid p-0">
      <div className="page-header mb-4">
        <h1>OpenClaw 办公室</h1>
        <p className="text-muted">实时AI智能体工作流可视化</p>
      </div>
      <OpenClawOfficeEmbed 
        src={process.env.NEXT_PUBLIC_OPENCLAW_OFFICE_URL || 'http://localhost:4200'}
      />
    </div>
  );
}
```

#### 步骤 1.5: Nginx 反向代理配置 (生产环境)

```nginx
# /etc/nginx/conf.d/psytwin-sentinel.conf

server {
    listen 80;
    server_name your-domain.com;

    # PsyTwin-Sentinel 主应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # OpenClaw Office 子路径代理
    location /openclaw/ {
        proxy_pass http://localhost:4200/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # SSE 支持
        proxy_buffering off;
        proxy_read_timeout 86400;
    }

    # OpenClaw Office API 代理
    location /api/openclaw/ {
        proxy_pass http://localhost:4200/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

---

### 4.2 阶段二: 组件化集成 (1-2周)

#### 步骤 2.1: 文件迁移映射

将 OpenClaw Office 的核心文件迁移到 PsyTwin-Sentinel:

| OpenClaw Office 路径 | PsyTwin-Sentinel 目标路径 | 说明 |
|---------------------|-------------------------|------|
| `/components/IsometricOffice.js` | `/app/components/openclaw/IsometricOffice.tsx` | 核心可视化组件 |
| `/components/AgentSprite.js` | `/app/components/openclaw/AgentSprite.tsx` | 智能体精灵 |
| `/components/ActivityLog.js` | `/app/components/openclaw/ActivityLog.tsx` | 活动日志 |
| `/components/RequestPipeline.js` | `/app/components/openclaw/RequestPipeline.tsx` | 请求管道 |
| `/components/StatsCards.js` | `/app/components/openclaw/StatsCards.tsx` | 统计卡片 |
| `/lib/db.js` | `/app/lib/openclaw/db.ts` | 数据库操作 |
| `/lib/config.js` | `/app/lib/openclaw/config.ts` | 配置管理 |
| `/lib/event-bus.js` | `/app/lib/openclaw/eventBus.ts` | 事件总线 |
| `/app/api/*` | `/app/api/openclaw/*` | API路由 |

#### 步骤 2.2: TypeScript 类型定义

创建类型定义文件:

```typescript
// PsyTwin-Sentinel: types/openclaw.ts

// 智能体类型
export interface Agent {
  id: string;
  name: string;
  role: string;
  emoji: string;
  color: string;
  position?: { x: number; y: number };
  status?: 'online' | 'offline' | 'working';
}

// 请求类型
export interface Request {
  id: string;
  content: string;
  from: string;
  state: RequestState;
  assignedTo?: string;
  task?: Task;
  createdAt: number;
  workStartedAt?: number;
  completedAt?: number;
  result?: string;
  source?: string;
  tgMessageId?: number;
  chainId?: string;
}

export type RequestState = 
  | 'received' 
  | 'analyzing' 
  | 'reviewing' 
  | 'task_created' 
  | 'assigned' 
  | 'in_progress' 
  | 'completed';

// 任务类型
export interface Task {
  id: string;
  requestId: string;
  title: string;
  detail: string;
  assignedAgent: string;
  status: TaskStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  result?: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

// 事件类型
export interface WorkflowEvent {
  id: string;
  requestId: string;
  state: string;
  agent: string;
  agentColor?: string;
  agentName?: string;
  message: string;
  targetAgent?: string;
  time: string;
  timestamp: number;
  result?: string;
}

// 统计数据类型
export interface Stats {
  messages: number;
  tokens: {
    input: number;
    output: number;
    total: number;
    cacheRead?: number;
    cacheWrite?: number;
  };
  cost_usd: number;
  savings_usd: number;
  tasks_completed: number;
  task_time_ms: number;
  human_time_ms: number;
}

// 配置类型
export interface OpenClawConfig {
  office: {
    name: string;
    style: string;
  };
  gateway: {
    url: string;
    token: string;
  };
  agents: Record<string, Agent>;
  telegram?: {
    enabled: boolean;
    botToken?: string;
    chatId?: string;
    webhookSecret?: string;
  };
}
```

#### 步骤 2.3: 样式适配

创建统一的样式文件，匹配 PsyTwin-Sentinel 设计系统:

```css
/* PsyTwin-Sentinel: styles/openclaw.css */

/* OpenClaw 办公室主题变量 */
:root {
  /* 赛博朋克主题（默认） */
  --openclaw-bg-primary: #0a0a1a;
  --openclaw-bg-secondary: #1a1a3a;
  --openclaw-bg-card: rgba(26, 26, 58, 0.7);
  
  --openclaw-accent-cyan: #00f5ff;
  --openclaw-accent-purple: #9d4edd;
  --openclaw-accent-green: #39ff14;
  --openclaw-accent-gold: #ffd700;
  
  --openclaw-text-primary: #ffffff;
  --openclaw-text-secondary: #a0a0c0;
  --openclaw-text-muted: #606080;
  
  --openclaw-border-color: rgba(0, 245, 255, 0.3);
  --openclaw-border-glow: 0 0 20px rgba(0, 245, 255, 0.3);
}

/* 玻璃态卡片效果 */
.openclaw-glass-card {
  background: var(--openclaw-bg-card);
  backdrop-filter: blur(12px);
  border: 1px solid var(--openclaw-border-color);
  border-radius: 12px;
  box-shadow: var(--openclaw-border-glow);
}

/* 霓虹文字效果 */
.openclaw-neon-cyan {
  color: var(--openclaw-accent-cyan);
  text-shadow: 0 0 10px rgba(0, 245, 255, 0.5);
}

/* 渐变边框 */
.openclaw-gradient-border {
  position: relative;
  background: linear-gradient(135deg, var(--openclaw-bg-primary), var(--openclaw-bg-secondary));
  border-radius: 12px;
}

.openclaw-gradient-border::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
  padding: 1px;
  background: linear-gradient(135deg, var(--openclaw-accent-cyan), var(--openclaw-accent-purple));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}
```

#### 步骤 2.4: 数据库集成

方案A: 使用 PsyTwin-Sentinel 现有数据库

```typescript
// PsyTwin-Sentinel: lib/openclaw/dbAdapter.ts
// 适配 PsyTwin-Sentinel 的数据库（如 PostgreSQL/MySQL）

import { prisma } from '@/lib/prisma';

export async function createRequest(data: CreateRequestInput) {
  return prisma.openclawRequest.create({
    data: {
      id: data.id,
      content: data.content,
      fromUser: data.from,
      state: data.state,
      assignedTo: data.assignedTo,
      // ... 其他字段
    }
  });
}

export async function getRequests(limit: number = 20) {
  return prisma.openclawRequest.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' }
  });
}
```

方案B: 保留 SQLite，通过 API 访问

```typescript
// 保持 OpenClaw Office 作为独立服务
// 通过内部 API 调用访问数据

const OPENCLAW_API_URL = process.env.OPENCLAW_INTERNAL_API;

export async function getOpenClawStats() {
  const response = await fetch(`${OPENCLAW_API_URL}/api/stats`);
  return response.json();
}
```

#### 步骤 2.5: 路由集成

在 PsyTwin-Sentinel 中添加 OpenClaw 路由:

```typescript
// PsyTwin-Sentinel: app/dashboard/openclaw/page.tsx
'use client';

import { useState } from 'react';
import { IsometricOffice } from '@/components/openclaw/IsometricOffice';
import { ActivityLog } from '@/components/openclaw/ActivityLog';
import { StatsCards } from '@/components/openclaw/StatsCards';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function OpenClawDashboard() {
  const [activeTab, setActiveTab] = useState('office');

  return (
    <div className="container mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">AI 办公室</h1>
        <p className="text-muted-foreground">
          实时智能体工作流可视化
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="office">办公室视图</TabsTrigger>
          <TabsTrigger value="stats">统计数据</TabsTrigger>
          <TabsTrigger value="logs">活动日志</TabsTrigger>
          <TabsTrigger value="agents">智能体管理</TabsTrigger>
        </TabsList>

        <TabsContent value="office" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <IsometricOffice />
            </div>
            <div className="space-y-4">
              <ActivityLog />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <StatsCards />
        </TabsContent>

        {/* 其他 Tab 内容 */}
      </Tabs>
    </div>
  );
}
```

---

### 4.3 阶段三: 高级集成 (可选)

#### 统一认证集成

```typescript
// PsyTwin-Sentinel: middleware/auth.ts
// 扩展认证系统，支持 OpenClaw Office 权限

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  
  // 验证 PsyTwin-Sentinel 认证
  const user = await verifyToken(token);
  
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 检查 OpenClaw 访问权限
  if (request.nextUrl.pathname.startsWith('/dashboard/openclaw')) {
    if (!user.permissions.includes('openclaw:view')) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}
```

#### 事件桥接

```typescript
// PsyTwin-Sentinel: lib/openclaw/eventBridge.ts
// 将 OpenClaw 事件桥接到 PsyTwin-Sentinel 事件系统

import { eventBus } from '@/lib/openclaw/eventBus';
import { psyTwinEventBus } from '@/lib/events';

export function bridgeOpenClawEvents() {
  // 转发智能体状态变更到 PsyTwin-Sentinel
  eventBus.on('AGENT_STATUS_CHANGE', (event) => {
    psyTwinEventBus.emit('notification', {
      type: 'agent_status',
      title: '智能体状态变更',
      message: `${event.agentName} 状态变为 ${event.status}`,
      data: event
    });
  });

  // 转发任务完成事件
  eventBus.on('TASK_COMPLETED', (event) => {
    psyTwinEventBus.emit('notification', {
      type: 'success',
      title: '任务完成',
      message: `任务 "${event.taskTitle}" 已完成`,
      data: event
    });
  });
}
```

---

## 5. 配置参数清单

### 5.1 必需配置

| 参数 | 环境变量 | 配置文件 | 说明 |
|------|----------|----------|------|
| Gateway URL | `OPENCLAW_GATEWAY_URL` | `gateway.url` | OpenClaw Gateway WebSocket地址 |
| Gateway Token | `OPENCLAW_GATEWAY_TOKEN` | `gateway.token` | Gateway认证令牌 |
| 办公室名称 | `OFFICE_NAME` | `office.name` | 显示名称 |
| 主题风格 | `OFFICE_STYLE` | `style.theme` | cyberpunk / modern / minimal |

### 5.2 可选配置

| 参数 | 环境变量 | 默认值 | 说明 |
|------|----------|--------|------|
| Gemini API Key | `GEMINI_API_KEY` | - | AI图片生成 |
| Anthropic API Key | `ANTHROPIC_API_KEY` | - | Claude Vision位置检测 |
| Telegram Bot Token | `TELEGRAM_BOT_TOKEN` | - | Telegram通知 |
| Telegram Chat ID | `TELEGRAM_CHAT_ID` | - | 通知目标聊天 |
| 数据目录 | `DATA_DIR` | `./data` | SQLite数据存储路径 |
| 服务端口 | `PORT` | `4200` | HTTP服务端口 |

### 5.3 智能体配置示例

```json
{
  "agents": [
    {
      "id": "orchestrator",
      "name": "总调度",
      "role": "Orchestrator",
      "emoji": "🎯",
      "color": "#ff006e",
      "position": { "x": 50, "y": 45 }
    },
    {
      "id": "developer",
      "name": "开发助手",
      "role": "Developer",
      "emoji": "💻",
      "color": "#00f5ff",
      "position": { "x": 20, "y": 35 }
    },
    {
      "id": "analyst",
      "name": "数据分析师",
      "role": "Analyst",
      "emoji": "📊",
      "color": "#9d4edd",
      "position": { "x": 80, "y": 35 }
    },
    {
      "id": "writer",
      "name": "文案专员",
      "role": "Writer",
      "emoji": "✍️",
      "color": "#39ff14",
      "position": { "x": 30, "y": 65 }
    },
    {
      "id": "reviewer",
      "name": "审核员",
      "role": "Reviewer",
      "emoji": "🔍",
      "color": "#ffd700",
      "position": { "x": 70, "y": 65 }
    }
  ]
}
```

---

## 6. 部署方案

### 6.1 Docker Compose 部署

```yaml
# docker-compose.yml
version: '3.8'

services:
  openclaw-office:
    build:
      context: ./integrations/openclaw-office
      dockerfile: Dockerfile
    container_name: openclaw-office
    ports:
      - "4200:4200"
    volumes:
      - ./data/openclaw:/app/data
      - ./config/openclaw-office.config.json:/app/openclaw-office.config.json:ro
    environment:
      - OPENCLAW_GATEWAY_URL=ws://openclaw-gateway:18789
      - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    networks:
      - psytwin-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:4200/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  psytwin-network:
    external: true
```

### 6.2 Kubernetes 部署

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: openclaw-office
  namespace: psytwin
spec:
  replicas: 1
  selector:
    matchLabels:
      app: openclaw-office
  template:
    metadata:
      labels:
        app: openclaw-office
    spec:
      containers:
      - name: openclaw-office
        image: your-registry/openclaw-office:latest
        ports:
        - containerPort: 4200
        env:
        - name: OPENCLAW_GATEWAY_URL
          valueFrom:
            configMapKeyRef:
              name: openclaw-config
              key: gateway-url
        - name: OPENCLAW_GATEWAY_TOKEN
          valueFrom:
            secretKeyRef:
              name: openclaw-secrets
              key: gateway-token
        volumeMounts:
        - name: data
          mountPath: /app/data
        - name: config
          mountPath: /app/openclaw-office.config.json
          subPath: openclaw-office.config.json
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: openclaw-data-pvc
      - name: config
        configMap:
          name: openclaw-config
---
apiVersion: v1
kind: Service
metadata:
  name: openclaw-office
  namespace: psytwin
spec:
  selector:
    app: openclaw-office
  ports:
  - port: 4200
    targetPort: 4200
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: openclaw-office
  namespace: psytwin
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: psytwin.your-domain.com
    http:
      paths:
      - path: /openclaw
        pathType: Prefix
        backend:
          service:
            name: openclaw-office
            port:
              number: 4200
```

---

## 7. 监控与运维

### 7.1 健康检查端点

```bash
# 服务健康检查
curl http://localhost:4200/api/health

# 预期响应
{
  "status": "healthy",
  "service": "OpenClaw Office",
  "timestamp": "2026-03-12T08:30:00.000Z",
  "uptime": 3600,
  "gateway": {
    "connected": true,
    "url": "ws://127.0.0.1:18789"
  },
  "agents": {
    "count": 5,
    "ids": ["orchestrator", "developer", "analyst", "writer", "reviewer"]
  },
  "config": {
    "valid": true,
    "errors": []
  }
}
```

### 7.2 关键指标监控

| 指标 | 采集方式 | 告警阈值 |
|------|----------|----------|
| 服务可用性 | `/api/health` | 连续3次失败告警 |
| Gateway连接状态 | `gateway.connected` | 断开时告警 |
| 内存使用 | Docker Stats | > 80% 告警 |
| CPU使用 | Docker Stats | > 70% 持续5分钟告警 |
| 磁盘空间 | 宿主机监控 | > 85% 告警 |
| 活跃请求数 | `/api/stats` | 异常增长检测 |

### 7.3 日志配置

```javascript
// 日志级别配置
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// 结构化日志输出
{
  "timestamp": "2026-03-12T08:30:00.000Z",
  "level": "INFO",
  "component": "GatewayConnection",
  "message": "Connected to OpenClaw Gateway",
  "metadata": {
    "url": "ws://127.0.0.1:18789",
    "latency": "12ms"
  }
}
```

---

## 8. 故障排查指南

### 8.1 常见问题

#### Q1: Gateway 连接失败

**症状**: 健康检查显示 `gateway.connected: false`

**排查步骤**:
1. 检查 Gateway URL 配置
   ```bash
   curl -I ws://your-gateway:18789
   ```
2. 验证 Token 有效性
3. 检查防火墙规则
4. 查看 Gateway 服务日志

**解决方案**:
```bash
# 测试 WebSocket 连接
wscat -c ws://your-gateway:18789 -H "Authorization: Bearer YOUR_TOKEN"
```

#### Q2: SSE 连接中断

**症状**: 实时更新停止，需要刷新页面

**排查步骤**:
1. 检查 Nginx/代理配置中的 `proxy_buffering`
2. 确认未启用 Cloudflare 缓存
3. 查看浏览器控制台网络面板

**解决方案**:
```nginx
# Nginx 配置
location /api/workflow/stream {
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 86400;
}
```

#### Q3: 图片生成失败

**症状**: 办公室场景无法生成或更新

**排查步骤**:
1. 检查 Gemini API Key
2. 查看 `/api/generate` 日志
3. 验证磁盘空间

#### Q4: 数据库锁定

**症状**: 写入操作超时

**解决方案**:
```bash
# 重启服务释放锁定
docker restart openclaw-office

# 或手动清理
rm data/openclaw-office.db-shm data/openclaw-office.db-wal
```

### 8.2 调试模式

```bash
# 启用详细日志
DEBUG=openclaw:* npm start

# 或 Docker 方式
docker run -e DEBUG=openclaw:* openclaw-office
```

---

## 9. API 参考

### 9.1 工作流事件推送

**端点**: `POST /api/workflow`

**请求体**:
```json
{
  "id": "evt_123456",
  "type": "state_change",
  "requestId": "req_789",
  "state": "assigned",
  "agent": "developer",
  "targetAgent": "analyst",
  "message": "任务已分配",
  "timestamp": 1710226800000
}
```

### 9.2 批量导入历史数据

**端点**: `POST /api/messages`

**请求体**:
```json
{
  "requests": [
    {
      "id": "req_001",
      "content": "分析Q1销售数据",
      "state": "completed",
      "assignedTo": "analyst"
    }
  ]
}
```

### 9.3 会话管理

**端点**: `POST /api/session`

**操作**:
- `reset`: 重置当前会话，标记所有活跃请求为完成
- `status`: 获取当前会话状态

---

## 10. 安全建议

### 10.1 网络安全

1. **使用 HTTPS**: 生产环境必须启用 TLS
2. **限制 Gateway 访问**: Gateway 应仅在内部网络暴露
3. **Token 轮换**: 定期更换 Gateway Token
4. **CORS 配置**: 限制允许的来源

```javascript
// 安全的 CORS 配置
const corsOptions = {
  origin: [
    'https://psytwin.your-domain.com',
    'https://admin.your-domain.com'
  ],
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

### 10.2 数据安全

1. **数据加密**: 敏感配置使用环境变量，不提交到 Git
2. **访问控制**: 实施基于角色的权限管理
3. **审计日志**: 记录所有管理操作
4. **备份策略**: 定期备份 SQLite 数据库

```bash
# 自动备份脚本
#!/bin/bash
BACKUP_DIR="/backup/openclaw"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp data/openclaw-office.db "$BACKUP_DIR/db_$TIMESTAMP.db"
find "$BACKUP_DIR" -name "db_*.db" -mtime +7 -delete
```

---

## 11. 附录

### 11.1 目录结构

```
openclaw-office/
├── app/                          # Next.js App Router
│   ├── api/                      # API 路由
│   │   ├── agents/sync/         # 智能体同步
│   │   ├── config/              # 配置API
│   │   ├── database/            # 数据库信息
│   │   ├── generate/            # 图片生成
│   │   ├── health/              # 健康检查
│   │   ├── messages/            # 消息管理
│   │   ├── openclaw/            # OpenClaw 接口
│   │   ├── session/             # 会话管理
│   │   ├── stats/               # 统计API
│   │   ├── tasks/               # 任务管理
│   │   ├── telegram/webhook/    # Telegram Webhook
│   │   └── workflow/            # 工作流API
│   ├── layout.js                # 根布局
│   ├── not-found.js             # 404页面
│   └── page.js                  # 主仪表板
├── cli/                          # CLI工具
│   ├── commands/                # 命令实现
│   └── lib/                     # CLI库
├── components/                   # React组件
│   ├── ActivityLog.js           # 活动日志
│   ├── AgentSprite.js           # 智能体精灵
│   ├── CostDashboard.js         # 成本面板
│   ├── DatabaseDashboard.js     # 数据库面板
│   ├── IsometricOffice.js       # 等距办公室
│   ├── RequestPipeline.js       # 请求管道
│   ├── SecurityDashboard.js     # 安全面板
│   ├── StatsCards.js            # 统计卡片
│   └── TeamDashboard.js         # 团队面板
├── lib/                          # 服务端库
│   ├── agent-sync.js            # 智能体同步逻辑
│   ├── agents.js                # 智能体管理
│   ├── config.js                # 配置加载
│   ├── config-client.js         # 客户端配置
│   ├── dashboard-sync.js        # 仪表板同步
│   ├── db.js                    # 数据库操作
│   ├── event-bus.js             # 事件总线
│   ├── openclaw.js              # OpenClaw 集成
│   ├── openclaw-ws.js           # WebSocket连接
│   ├── telegram.js              # Telegram集成
│   ├── useWorkflowStream.js     # SSE Hook
│   └── workflow.js              # 工作流逻辑
├── data/                         # 数据目录（SQLite）
├── public/sprites/              # 静态资源（办公室图片）
├── Dockerfile                    # Docker构建
├── docker-compose.yml            # Docker Compose配置
├── next.config.mjs              # Next.js配置
├── openclaw-office.config.json  # 项目配置
├── package.json                 # 依赖定义
└── tailwind.config.cjs          # Tailwind配置
```

### 11.2 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| 0.1.0 | 2026-03-12 | 初始版本，基础功能完整 |

### 11.3 相关资源

- **OpenClaw 主项目**: https://github.com/openclaw/openclaw
- **Next.js 文档**: https://nextjs.org/docs
- **Tailwind CSS 文档**: https://tailwindcss.com/docs
- **Framer Motion 文档**: https://www.framer.com/motion/

---

## 12. 总结

### 12.1 集成工作量评估

| 阶段 | 预计工时 | 复杂度 | 优先级 |
|------|----------|--------|--------|
| 阶段一: iframe 嵌入 | 1-2 天 | ⭐⭐ | 高 |
| 阶段二: 组件化集成 | 1-2 周 | ⭐⭐⭐⭐ | 中 |
| 阶段三: 高级集成 | 2-4 周 | ⭐⭐⭐⭐⭐ | 低 |

### 12.2 建议实施路径

1. **立即执行** (今天): 
   - 完成阶段一 iframe 嵌入
   - 验证 Gateway 连接
   - 配置基础智能体

2. **本周完成**:
   - 样式适配，确保视觉统一
   - 添加基础监控

3. **后续规划**:
   - 根据使用反馈决定是否进行深度集成
   - 评估性能需求，考虑组件化迁移

### 12.3 联系与支持

如有任何问题或需要进一步的技术支持，请联系：

- **项目仓库**: https://github.com/wickedapp/openclaw-office
- **问题反馈**: 请提交 GitHub Issue
- **技术咨询**: 通过 PsyTwin-Sentinel 项目团队联系

---

**文档结束**

*本文档由 AI 助手根据 OpenClaw Office 项目源码深度分析生成，如有疑问请核实最新源码。*
