# realtimeSports

一个基于 Node.js + Express + WebSocket + PostgreSQL 的实时体育赛事应用，支持比赛管理和实时评论推送。

## 技术栈

- **后端框架**: Express.js 5.x
- **数据库**: PostgreSQL + Drizzle ORM
- **实时通信**: WebSocket (ws 库)
- **数据验证**: Zod
- **安全防护**: Arcjet (速率限制、机器人检测)
- **包管理**: pnpm

## 功能特性

- 比赛管理 (CRUD 操作)
- 实时评论系统
- WebSocket 实时推送
- 数据验证和类型安全
- 数据库迁移管理
- 种子数据生成

## 数据库 Schema

### 比赛表 (matches)

| 字段      | 类型      | 说明                          |
| --------- | --------- | ----------------------------- |
| id        | serial    | 主键                          |
| sport     | text      | 运动类型                      |
| homeTeam  | text      | 主队                          |
| awayTeam  | text      | 客队                          |
| status    | enum      | 状态: scheduled/live/finished |
| startTime | timestamp | 开始时间                      |
| endTime   | timestamp | 结束时间                      |
| homeScore | integer   | 主队比分 (默认 0)             |
| awayScore | integer   | 客队比分 (默认 0)             |

### 评论表 (commentary)

| 字段      | 类型    | 说明               |
| --------- | ------- | ------------------ |
| id        | serial  | 主键               |
| matchId   | integer | 外键 -> matches.id |
| minute    | integer | 比赛分钟           |
| sequence  | integer | 序列号             |
| period    | text    | 比赛阶段           |
| eventType | text    | 事件类型           |
| actor     | text    | 参与者             |
| team      | text    | 队伍               |
| message   | text    | 评论内容           |
| metadata  | jsonb   | 元数据             |
| tags      | text[]  | 标签数组           |

## 快速开始

### 1. 环境要求

- Node.js 18+
- PostgreSQL 14+
- pnpm

### 2. 安装依赖

```bash
pnpm install
```

### 3. 环境变量配置

创建 `.env` 文件：

```env
DATABASE_URL=postgresql://username:password@localhost:5432/realtimesports
ARCJET_KEY=your_arcjet_key
PORT=8000
HOST=0.0.0.0
```

### 4. 数据库迁移

```bash
# 生成迁移文件
pnpm db:generate

# 推送数据库变更
pnpm db:push
```

### 5. 启动服务

```bash
# 开发模式
pnpm dev

# 或者生产模式
pnpm start
```

服务启动后：

- HTTP API: http://localhost:8000
- WebSocket: ws://localhost:8000/ws

### 6. 种子数据

```bash
# 生成测试数据
pnpm seed
```

## API 文档

### 比赛管理

#### 获取比赛列表

```http
GET /matches?limit=50
```

#### 创建比赛

```http
POST /matches
Content-Type: application/json

{
  "sport": "football",
  "homeTeam": "Manchester City",
  "awayTeam": "Liverpool",
  "startTime": "2026-03-03T12:00:00Z",
  "endTime": "2026-03-03T13:45:00Z",
  "homeScore": 0,
  "awayScore": 0
}
```

### 评论系统

#### 获取比赛评论

```http
GET /matches/:id/commentary
```

#### 创建评论

```http
POST /matches/:id/commentary
Content-Type: application/json

{
  "minute": 45,
  "sequence": 1,
  "period": "first half",
  "eventType": "goal",
  "actor": "John Doe",
  "team": "Home",
  "message": "Goal scored!",
  "metadata": {"assist": "Jane Smith"},
  "tags": ["goal", "home"]
}
```

## WebSocket 实时通信

连接 WebSocket 服务：

```bash
npx wscat -c ws://localhost:8000/ws
```

### 消息类型

#### 客户端 -> 服务器

**订阅比赛**

```json
{
  "type": "subscribe",
  "matchId": 1
}
```

**取消订阅**

```json
{
  "type": "unsubscribe",
  "matchId": 1
}
```

#### 服务器 -> 客户端

**欢迎消息**

```json
{
  "type": "welcome"
}
```

**订阅确认**

```json
{
  "type": "subscribed",
  "matchId": 1
}
```

**新比赛通知**

```json
{
  "type": "match_create",
  "data": {
    "id": 1,
    "sport": "football",
    "homeTeam": "Team A",
    "awayTeam": "Team B",
    ...
  }
}
```

**新评论通知**

```json
{
  "type": "commentary",
  "data": {
    "id": 1,
    "matchId": 1,
    "minute": 45,
    "message": "Goal!",
    ...
  }
}
```

## 项目结构

```
realtimeSports/
├── src/
│   ├── db/
│   │   ├── config.js          # 数据库配置
│   │   └── schema.js          # Drizzle Schema 定义
│   ├── routes/
│   │   ├── matches.js         # 比赛路由
│   │   └── commentary.js      # 评论路由
│   ├── validation/
│   │   ├── matches.js         # 比赛数据验证 (Zod)
│   │   └── commentary.js      # 评论数据验证 (Zod)
│   ├── ws/
│   │   └── server.js          # WebSocket 服务器
│   ├── seed/
│   │   └── seed.js            # 种子数据生成
│   ├── utils/
│   │   └── match-status.js    # 比赛状态工具
│   ├── aecjet.js              # Arcjet 安全配置
│   └── index.js               # 应用入口
├── drizzle/                   # 数据库迁移文件
├── package.json
├── drizzle.config.js
└── README.md
```

## 脚本命令

| 命令               | 说明                |
| ------------------ | ------------------- |
| `pnpm dev`         | 启动开发服务器      |
| `pnpm start`       | 启动生产服务器      |
| `pnpm db:generate` | 生成 Drizzle 迁移   |
| `pnpm db:push`     | 推送数据库变更      |
| `pnpm db:migrate`  | 执行数据库迁移      |
| `pnpm db:studio`   | 打开 Drizzle Studio |
| `pnpm seed`        | 生成种子数据        |

## 数据验证

使用 Zod 进行严格的数据验证：

### 比赛验证

- `sport`: 必填字符串
- `homeTeam`: 必填字符串
- `awayTeam`: 必填字符串
- `startTime`: ISO 8601 日期格式
- `endTime`: ISO 8601 日期格式，必须晚于 startTime
- `homeScore`/`awayScore`: 非负整数，默认 0

### 评论验证

- `minute`: 非负整数
- `sequence`: 非负整数
- `period`: 字符串
- `eventType`: 字符串
- `message`: 必填字符串

## 安全特性

- **速率限制**: 基于 Arcjet 的滑动窗口算法
- **机器人检测**: 自动识别和阻止恶意爬虫
- **Shield 防护**: 防止常见攻击模式
- **CORS 配置**: 跨域请求控制

## 开发注意事项

1. **ES Modules**: 项目使用 ES Modules (`"type": "module"`)，导入时需要添加 `.js` 扩展名
2. **环境变量**: 确保所有必需的环境变量已正确配置
3. **数据库连接**: 使用连接池管理 PostgreSQL 连接
4. **WebSocket 心跳**: 内置 ping/pong 机制保持连接活跃

## 许可证

ISC
