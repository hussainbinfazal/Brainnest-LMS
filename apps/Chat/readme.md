# 🚀 Express Starter Kit with Prisma 

A production-ready Node.js/Express backend starter kit with PostgreSQL, Prisma ORM. Designed to kickstart your next project with multiple frontend framework support (React, Next.js static, Next.js SSR).

## ✨ Features

- 🌐 Express.js API server
- 🐘 PostgreSQL database with Prisma ORM
- 🔐 CORS enabled
- 🍪 Cookie-based authentication support
- ⚡ Multiple frontend deployment options
- 🔧 Environment-based configuration

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- 📦 Node.js (v16 or higher)
- 📥 npm or yarn
- 🗄️ PostgreSQL database

## 🚀 Quick Start

### 1. 📁 Clone the Repository

```bash
git clone <repository-url>
cd <repository-name>
```

### 2. 📦 Install Dependencies

```bash
npm install
```

### 3. ⚙️ Environment Setup

Create a `.env` file in the root directory:

```env
PORT=8000
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
CLIENT_URL=http://localhost:3000
NODE_ENV=development
FRONTEND=react
```

### 4. 🗄️ Database Setup

Generate Prisma client and run migrations:

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Optional: Seed the database
npx prisma db seed
```

### 5. 🔥 Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:8000`

## 🔧 Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | 🚪 Server port number | 8000 | ✅ |
| `DATABASE_URL` | 🐘 PostgreSQL connection string | - | ✅ |
| `CLIENT_URL` | 🌐 Frontend application URL for CORS | http://localhost:3000 | ✅ |
| `NODE_ENV` | 🔧 Environment (development/production) | development | ✅ |
| `FRONTEND` | ⚡ Frontend type (react/next-static/next-ssr) | react | ❌ |

## 📊 Database Schema

### 👤 User Model
- `id`: Auto-increment primary key
- `email`: Unique user email
- `is_verified`: Email verification status
- `created_at`: Account creation timestamp

### 📧 EmailVerification Model
- `id`: Auto-increment primary key
- `user_id`: Foreign key to User
- `verification_code`: 6-character verification code
- `expires_at`: Code expiration timestamp
- `is_used`: Usage status
- `created_at`: Creation timestamp

## 🛠️ API Endpoints

### 💚 Health Check
```
GET /
```
Returns API status and developer information.

## 🎨 Frontend Integration

This backend supports three frontend deployment modes:

### ⚛️ React (Static)
```env
FRONTEND=react
```
Serves static files from `frontend/dist`

### 📄 Next.js Static Export
```env
FRONTEND=next-static
```
Serves static files from `frontend/out`

### 🔄 Next.js SSR
```env
FRONTEND=next-ssr
```
Runs Next.js server-side rendering

## 💻 Development

### 🗄️ Database Operations

```bash
# View database in Prisma Studio
npx prisma studio

# Reset database
npx prisma db push --force-reset

# Generate Prisma client after schema changes
npx prisma generate
```

### 📜 Common Scripts

```bash
# Start development server
npm run dev

# Start production server
npm start

# Run database migrations
npm run migrate

# Reset database
npm run db:reset
```

## 🚢 Production Deployment

1. Set environment variables:
   ```env
   NODE_ENV=production
   DATABASE_URL=<production-database-url>
   PORT=<production-port>
   ```

2. Build and start:
   ```bash
   npm install --production
   npx prisma generate
   npx prisma db push
   npm start
   ```

## 📁 Project Structure

```
backend/
├── 📊 prisma/
│   └── schema.prisma          # Database schema
├── 🎨 frontend/               # Frontend build files (production)
├── ⚙️ generated/
│   └── prisma/               # Generated Prisma client
├── 🔐 .env                   # Environment variables
├── 🚀 server.js              # Main server file
└── 📦 package.json           # Dependencies and scripts
```

## 🛠️ Technologies Used

- **Runtime**: 🟢 Node.js
- **Framework**: 🌐 Express.js
- **Database**: 🐘 PostgreSQL
- **ORM**: 🔷 Prisma
- **Authentication**: 🍪 Cookie-based
- **CORS**: ✅ Enabled for cross-origin requests

## 🤝 Contributing

1. 🍴 Fork the repository
2. 🌿 Create a feature branch
3. ✨ Make your changes
4. 🧪 Test thoroughly
5. 📥 Submit a pull request

## 🔧 Troubleshooting

### ⚠️ Common Issues

1. **🚫 Database Connection Error**
   - Verify DATABASE_URL is correct
   - Ensure PostgreSQL is running
   - Check database credentials

2. **❓ Prisma Client Not Found**
   ```bash
   npx prisma generate
   ```

3. **🚪 Port Already in Use**
   - Change PORT in .env file
   - Kill process using the port: `lsof -ti:8000 | xargs kill -9`

### 🆘 Getting Help

- 📋 Check the logs for detailed error messages
- ⚙️ Ensure all environment variables are set correctly
- 🔗 Verify database connectivity
- 📊 Review Prisma schema for any conflicts

## 📄 License

[Add your license information here]

---

**👨‍💻 Developer**: [hussainbinfazal](https://github.com/hussainbinfazal)

Found this useful? Give it a ⭐️!
