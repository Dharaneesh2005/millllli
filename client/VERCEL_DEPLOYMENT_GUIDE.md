# Vercel Deployment Guide for Millikit E-Commerce

This guide explains how to deploy the Millikit E-Commerce application to Vercel using the client directory as the deployment root.

## Prerequisites

Before deploying to Vercel, make sure you have:

1. A Vercel account (you can sign up at [vercel.com](https://vercel.com))
2. Access to a PostgreSQL database (we recommend using Neon, Supabase, or any PostgreSQL provider)
3. Your database credentials ready

## Setup Environment Variables

You'll need to configure the following environment variables in your Vercel project settings:

### Required Database Variables
- `DATABASE_URL`: The complete PostgreSQL connection string
  
  **OR** individual PostgreSQL connection parameters:
  - `PGHOST`: PostgreSQL host address
  - `PGPORT`: PostgreSQL port (usually 5432)
  - `PGUSER`: PostgreSQL username
  - `PGPASSWORD`: PostgreSQL password
  - `PGDATABASE`: PostgreSQL database name

### Other Required Variables
- `ADMIN_KEY`: A secure key for admin API access
- `SESSION_SECRET`: A secure string to encrypt session cookies

## Deployment Steps

### Option 1: Deploy from GitHub

1. Push your code to a GitHub repository
2. Connect your Vercel account to GitHub
3. Create a new project in Vercel and select your repository
4. Configure the following settings:
   - Framework Preset: Next.js
   - Root Directory: `./client`
   - Build Command: `npm run build`
   - Install Command: `npm install`
   - Output Directory: `.next`
5. Add all required environment variables
6. Click "Deploy"

### Option 2: Deploy from CLI

1. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Login to Vercel:
   ```
   vercel login
   ```

3. Navigate to your project's root directory and deploy:
   ```
   vercel --cwd ./client
   ```

4. Follow the CLI prompts to configure your project

## Verification

After deployment:

1. Visit your deployed site at the URL provided by Vercel
2. Check the health endpoint at `https://your-domain.vercel.app/api/health`
3. Verify that you can log in as an admin and that product data is loading correctly

## Troubleshooting

If you encounter issues:

1. **Database Connection Errors**: 
   - Verify that your database credentials are correct
   - Make sure your database allows connections from Vercel's IP range
   - For Neon, enable the "Pooled connection" option

2. **API Routes Not Working**:
   - Check the Vercel Function Logs in your Vercel dashboard
   - Verify that `/api/*` routes are being handled correctly

3. **Static Content Issues**:
   - Make sure your static assets are properly referenced

4. **Performance Issues**:
   - Consider enabling Vercel's Edge Functions for better global performance

## Support

If you need additional assistance with deployment, please refer to Vercel's documentation at [vercel.com/docs](https://vercel.com/docs).