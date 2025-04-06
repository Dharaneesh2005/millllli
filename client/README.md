# Millikit E-Commerce Client

This is the Next.js client application for Millikit E-Commerce platform.

## Vercel Deployment Instructions

### Important: Fixing the "Specified 'src' for '@vercel/next'" Error

If you encounter the error: "Specified 'src' for '@vercel/next' has to be 'package.json' or 'next.config.js'", follow these steps:

1. **Deploy from this client directory directly**
   - When using Vercel CLI: run `vercel` from within this directory
   - When using Vercel Dashboard: set Root Directory to this client directory

2. **Required Environment Variables**:
   - DATABASE_URL: Your PostgreSQL connection string
   - PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE (as alternative to DATABASE_URL)
   - ADMIN_KEY: Your admin access key
   - SESSION_SECRET: Session encryption key

3. **Verify Deployment**:
   - After deployment, check the health endpoint at `/api/health`
   - Verify database connectivity and proper routing

For more details, refer to the main VERCEL_DEPLOYMENT_GUIDE.md file in the repository root.