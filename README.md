# Error Logger App

A modern web application for tracking and managing application errors. Built with Next.js 16, Prisma, NextAuth, and TypeScript.

## Features

- 🔐 **User Authentication** - Secure login with seeded default user
- 📝 **Error Logging** - Log errors, warnings, and info messages with detailed metadata
- 🔍 **Error Management** - View, filter, and delete error logs
- 📊 **Dashboard** - Clean, organized interface to manage all your error logs
- 🎨 **Modern UI** - Beautiful, responsive design with dark mode support

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd error-logger-app
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` and set the following:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

To generate a secure AUTH_SECRET:

```bash
openssl rand -base64 32
```

4. Set up the database:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

5. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Setting Up Default User

The application comes with a seed script to create a default admin user:

```bash
npm run db:seed
```

This creates a default user with:

- **Email**: `admin@example.com` (or set `DEFAULT_USER_EMAIL` in `.env`)
- **Password**: `admin123` (or set `DEFAULT_USER_PASSWORD` in `.env`)

⚠️ **Important**: Change the default password after first login!

### Logging In

1. Navigate to the home page
2. Click "Sign In"
3. Enter the default credentials (or your custom credentials if you've changed them)
4. You'll be redirected to the dashboard

### Logging Errors

1. Sign in to your account
2. Use the "Log New Error" form on the dashboard
3. Fill in:
   - **Message** (required): The error message
   - **Stack Trace** (optional): Stack trace information
   - **Level**: Choose between Error, Warning, or Info
   - **Metadata** (optional): Additional JSON data
4. Click "Log Error"

### Viewing and Managing Errors

- View all your error logs in the dashboard
- Filter by level (All, Error, Warning, Info)
- Delete individual error logs by clicking the "Delete" button

## API Routes

### Authentication

- `POST /api/auth/[...nextauth]` - NextAuth endpoints (login, logout, etc.)

**Note**: User registration is disabled. Use the seed script to create users.

### Error Logs

- `GET /api/errors` - List all errors (supports `?level=error|warning|info` query params)
- `POST /api/errors` - Create a new error log
- `GET /api/errors/[id]` - Get a specific error by ID
- `DELETE /api/errors/[id]` - Delete an error log

All API routes require authentication.

## Project Structure

```
error-logger-app/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   └── errors/       # Error logging endpoints
│   ├── dashboard/        # Dashboard page
│   ├── login/            # Login page
│   ├── register/         # Registration page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── lib/
│   ├── auth.ts           # NextAuth configuration
│   └── prisma.ts         # Prisma client instance
├── prisma/
│   └── schema.prisma     # Database schema
├── types/
│   └── next-auth.d.ts    # NextAuth type definitions
└── middleware.ts          # Route protection middleware
```

## Database Schema

### User

- `id` - Unique identifier
- `email` - Email address (unique)
- `password` - Hashed password
- `name` - Optional name
- `createdAt` - Account creation timestamp
- `updatedAt` - Last update timestamp

### Error

- `id` - Unique identifier
- `message` - Error message
- `stack` - Optional stack trace
- `level` - Error level (error, warning, info)
- `metadata` - Optional JSON metadata
- `userId` - Foreign key to User
- `createdAt` - Log creation timestamp

## Development

### Database Migrations

Create a new migration:

```bash
npm run db:migrate
```

Seed the database with default user:

```bash
npm run db:seed
```

View database in Prisma Studio:

```bash
npm run db:studio
```

### Building for Production

```bash
npm run build
npm start
```

## Deployment

### Netlify Deployment

This app is configured for deployment on Netlify. See [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md) for detailed instructions.

**⚠️ Important**: SQLite will NOT work on Netlify's serverless platform. You must migrate to a hosted database like:

- **Turso** (SQLite-compatible, recommended)
- **PostgreSQL** (Supabase, Neon, Railway)
- **PlanetScale** (MySQL-compatible)

**🚀 Quick Start:**

1. **Get database URL** - See [QUICK_DATABASE_SETUP.md](./QUICK_DATABASE_SETUP.md) (recommended: Turso - 5 minutes)
2. **Set environment variables** - See [HOW_TO_SET_ENV_VARS.md](./HOW_TO_SET_ENV_VARS.md)
3. Connect repository to Netlify
4. Deploy!

**📚 Detailed Guides:**

- [HOW_TO_GET_DATABASE_URL.md](./HOW_TO_GET_DATABASE_URL.md) - Step-by-step database setup for all providers
- [HOW_TO_SET_ENV_VARS.md](./HOW_TO_SET_ENV_VARS.md) - How to set environment variables
- [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md) - Complete deployment guide

### Other Deployment Options

For traditional server deployment (Ubuntu, etc.), see [DEPLOYMENT.md](./DEPLOYMENT.md).

## License

MIT
/
