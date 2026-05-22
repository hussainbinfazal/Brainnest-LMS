# 🚀 Worker Service

A background worker service for the Brainnest Turborepo.
This Express-based worker app handles queued jobs, Redis-backed queue connections, and shared repository utilities.

## ✨ Features

- 🚀 Express.js status endpoint for health checks
- 🧠 BullMQ-based job processing
- 🔌 Redis connection via `ioredis`
- 📦 Shared utilities from `@repo/shared`
- 📁 Modular folder structure for jobs, queues, middleware, and helpers
- 🌐 CORS enabled with environment-controlled origin

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- 📦 Node.js 20 or higher
- 📥 `pnpm`
- 🧠 Redis instance available and reachable via `REDIS_URL`
- 🔧 Repository dependencies installed from the workspace root

## 🚀 Quick Start

### 1. 📁 Navigate to the Worker package

```bash
cd apps/Worker
```

### 2. 📦 Install dependencies

From the workspace root:

```bash
pnpm install
```

### 3. ⚡ Start development server

```bash
pnpm dev
```

The service will start using `src/index.ts` and expose a health endpoint at `/`.

## 🔧 Available scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start Worker service in development with `ts-node-dev` |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start` | Run the compiled production build from `dist/index.js` |

## ⚙️ Environment Setup

Create a `.env` file in `apps/Worker` or use workspace environment settings:

```env
PORT=5000
CLIENT_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379
```

### Recommended variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | HTTP port for the Worker health endpoint | ✅ |
| `CLIENT_URL` | Frontend URL allowed by CORS | ✅ |
| `REDIS_URL` | Redis connection string for BullMQ | ✅ |
| `NODE_ENV` | Environment mode | ❌ |

## 📁 Project Structure

```
apps/Worker/
├── src/
│   ├── index.ts              # Main entrypoint and Express setup
│   ├── middleware/
│   │   └── logger.middleware.ts  # Request logging middleware
│   ├── jobs/                 # Job definitions and processing logic
│   ├── queue/                # Queue configuration and Redis connection
│   │   ├── redis.ts
│   │   ├── certificate.queue.ts
│   │   ├── email.queue.ts
│   │   ├── progress.queue.ts
│   │   └── worker/           # Worker processors
│   ├── helpers/              # Reusable helper modules
│   ├── services/             # Service integrations and utilities
│   ├── utils/                # General utility helpers
│   └── ts-types/             # Custom TypeScript definitions
├── package.json
└── readme.md
```

## 🛠️ Development

- Run `pnpm dev` to start the worker service locally.
- Use `pnpm build` then `pnpm start` for production-style execution.
- Ensure Redis is running and `REDIS_URL` is reachable.

## 📦 Deployment

1. Set environment variables in production:

```env
NODE_ENV=production
PORT=5000
CLIENT_URL=<frontend-url>
REDIS_URL=<redis-url>
```

2. Build and start:

```bash
pnpm install --production
pnpm build
pnpm start
```

## 🔍 Health Check Endpoint

```
GET /
```

Returns a plain success message when the worker service is running.

## 🤝 Contributing

1. 🍴 Fork the repository
2. 🌿 Create a feature branch
3. ✨ Implement your changes
4. 🧪 Test locally
5. 📥 Submit a pull request

## 📄 License

[Add your license information here]

---

**👨‍💻 Developer**: [hussainbinfazal](https://github.com/hussainbinfazal)
