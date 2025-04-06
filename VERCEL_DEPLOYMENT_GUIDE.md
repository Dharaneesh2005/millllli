# Millikit E-Commerce Vercel Deployment Guide

This guide walks you through deploying this Millikit E-Commerce application to Vercel, ensuring that your PostgreSQL database integration works correctly in a serverless environment.

## Prerequisites

Before deploying, make sure you have:

1. A Vercel account (https://vercel.com/signup)
2. A PostgreSQL database (such as [Neon](https://neon.tech) or [Supabase](https://supabase.com))
3. Your database connection string and credentials

## Option 1: Deploy from the Client Directory (Recommended)

This approach deploys only the Next.js application in the `client` directory and is the simplest method.

### Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

### Step 2: Configure Environment Variables

Log in to your Vercel dashboard, create a new project, and configure the following environment variables:

- `DATABASE_URL`: Your PostgreSQL connection string
- `PGHOST`: PostgreSQL host
- `PGPORT`: PostgreSQL port
- `PGUSER`: PostgreSQL username
- `PGPASSWORD`: PostgreSQL password
- `PGDATABASE`: PostgreSQL database name
- `ADMIN_KEY`: A secure key for admin API access
- `SESSION_SECRET`: A secure secret for session management
- `NODE_ENV`: Set to `production`

### Step 3: Deploy to Vercel

Navigate to the client directory and deploy:

```bash
cd client
vercel
```

Follow the prompts to set up your project.

## Option 2: Deploy from Root Directory

This approach deploys the entire application, including both the client and server components.

### Step 1: Configure Environment Variables

Same as Option 1, set up the environment variables in your Vercel project.

### Step 2: Deploy to Vercel

In the root directory of the project:

```bash
vercel
```

## Troubleshooting

If you encounter any issues during deployment, check the following:

### Database Connection Issues

1. Verify your database credentials and connection string
2. Ensure your database allows connections from Vercel's IP addresses
3. Use the `/api/debug` endpoint to check connection status
4. Use the `/api/debug/database?test_db=true` endpoint to test database connectivity

### TypeScript Errors

If you see TypeScript compilation errors:

1. Make sure both root and client directories have the necessary TypeScript dependencies
2. The build scripts (`vercel-build.js`) should handle this automatically, but you might need to manually install:
   ```bash
   npm install --save-dev typescript @types/react @types/react-dom @types/node
   ```

### 502 Bad Gateway or Timeout Errors

These are often related to database connection problems:

1. Check if your database is online and accessible
2. Verify that SSL requirements match your connection string (if using SSL)
3. The application includes retry logic, but you might need to increase timeouts in your database service

## Monitoring

After deployment, use these endpoints to monitor your application:

- `/api/health`: Basic health check
- `/api/debug`: Environment and configuration check
- `/api/debug/database`: Database connection status

## Migrating Your Database

This application uses Drizzle ORM. To migrate your database schema:

1. Make sure your local development environment is connected to your production database
2. Run the database migration:
   ```bash
   npm run db:push
   ```

This will apply your schema changes to the production database.