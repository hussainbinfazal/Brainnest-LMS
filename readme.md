# 🚀 Brainnest Turborepo

A full-stack mono repository built with Node.js, Express, Next.js, BullMQ and shared TypeScript utilities.
This repo contains separate application packages for API, frontend, and background worker processing, plus a shared library for reusable models and helpers.

## ✨ Features

- 🌐 `apps/web`: Next.js frontend with client-side and server-side UI
- 💬 `apps/Chat`: backend chat service and API logic
- ⚙️ `apps/Worker`: background worker service with BullMQ queue processing
- 📦 `packages/shared`: shared utilities, types, schema validation, and database helpers
- 🧩 Monorepo managed with `pnpm` workspaces
- 🔧 TypeScript across all packages

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- 📦 Node.js 20 or higher
- 📥 `pnpm` package manager
- 🗄️ Redis for background queue processing
- ⚙️ MongoDB and/or other data sources used by the apps, if applicable

## 🚀 Quick Start

### 1. 📁 Clone the repository

```bash
git clone <repository-url>
cd Brainnest\ Turborepo
```

### 2. 📦 Install dependencies

```bash
pnpm install
```

### 3. 🔧 Start the apps

Start each app from its package folder:

```bash
cd apps/Worker
pnpm dev
```

```bash
cd apps/web
pnpm dev
```

```bash
cd apps/Chat
pnpm dev
```

## 🔧 Workspace scripts

This repository uses package-level scripts. Common commands include:

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all workspace dependencies | 
| `pnpm -C apps/Worker dev` | Start Worker service in development | 
| `pnpm -C apps/web dev` | Start Next.js frontend in development | 
| `pnpm -C apps/Chat dev` | Start Chat backend service in development | 

## ⚙️ Environment Setup

Each package may require its own `.env` file. Example variables for the Worker app:

```env
PORT=5000
CLIENT_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379
```

For `apps/web` and `apps/Chat`, use their respective environment setup files as documented inside each package.

## 📁 Project Structure

```
Brainnest Turborepo/
├── apps/
│   ├── Chat/              # Chat backend service
│   ├── web/               # Next.js frontend application
│   └── Worker/            # Background worker service
├── packages/
│   └── shared/            # Shared utilities, types, and schema helpers
├── pnpm-workspace.yaml    # Monorepo workspace config
├── package.json           # Root workspace manifest
├── pnpm-lock.yaml         # Lockfile for all dependencies
└── tsconfig.base.json     # Base TypeScript configuration
```

## 🛠️ Development Notes

- Use `pnpm install` at the repo root to install workspace dependencies.
- Run each app from its own directory to pick up package-specific scripts and `.env` configuration.
- Shared utilities are available under `@repo/shared` in app packages.

## 🚢 Production Deployment

1. Install dependencies in production mode:

```bash
pnpm install --prod
```

2. Build and start each package as needed.

3. Ensure required environment variables are configured for each app.

## 🤝 Contributing

1. 🍴 Fork the repo
2. 🌿 Create a feature branch
3. ✨ Make your changes
4. 🧪 Test each package locally
5. 📥 Submit a pull request

## 📄 License

[Add your license information here]

---

**👨‍💻 Developer**: [hussainbinfazal](https://github.com/hussainbinfazal)
