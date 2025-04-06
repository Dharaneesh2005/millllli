# Railway Deployment Guide for Millikit E-Commerce

This guide provides step-by-step instructions for deploying the Millikit E-Commerce application to Railway.

## Prerequisites

1. [Railway account](https://railway.app/)
2. [GitHub repository](https://github.com/) with your code
3. [Railway CLI](https://docs.railway.app/develop/cli) (optional, but recommended)

## Step 1: Push Your Code to GitHub

Make sure your code is pushed to a GitHub repository including all the configuration files:
- `railway.json`
- `Procfile`
- `.railwayignore`
- `.env.production`

## Step 2: Connect Your Project to Railway

### Option A: Using the Railway Dashboard

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository from the list
5. Railway will automatically detect your `railway.json` configuration

### Option B: Using the Railway CLI

1. Install the Railway CLI if you haven't already:
   ```bash
   npm i -g @railway/cli
   ```

2. Login to your Railway account:
   ```bash
   railway login
   ```

3. Link your local project to Railway:
   ```bash
   railway link
   ```

4. Deploy your application:
   ```bash
   railway up
   ```

## Step 3: Configure Environment Variables (if needed)

If you need to add any additional environment variables beyond what's in `.env.production`:

1. Go to your project in the Railway dashboard
2. Click on your service
3. Navigate to the "Variables" tab
4. Add your environment variables

## Step 4: Set Up Custom Domain (Optional)

1. Go to your service in the Railway dashboard
2. Click on the "Settings" tab
3. Scroll down to the "Custom Domain" section
4. Add your domain and follow the DNS configuration instructions

## Step 5: Monitor Your Deployment

1. Go to your service in the Railway dashboard
2. Check the "Deployments" tab to see the deployment status
3. Once deployed, click the generated URL to access your application

## Troubleshooting

### Build Failures

If your build fails, check the build logs in the Railway dashboard for error messages. Common issues include:

- Missing dependencies
- Build script errors
- Incompatible Node.js version

### Application Crashes

If your application starts but crashes, check the logs in the Railway dashboard. Common issues include:

- Missing environment variables
- Database connection errors
- Port conflicts

### API Routes Not Working

If your API routes return 404 errors:

1. Check that your server is correctly handling API routes
2. Verify that your frontend is making requests to the correct URL
3. Check for CORS issues in the server logs

## Maintenance and Updates

For future updates:

1. Push changes to your GitHub repository
2. Railway will automatically detect changes and redeploy
3. Monitor the deployment in the Railway dashboard

## Admin Access

Access the admin panel at `/admin/login` with:
- Username: `admin_millikit`
- Password: `the_millikit`

## Support

If you encounter issues with Railway deployment, you can:

1. Check [Railway documentation](https://docs.railway.app/)
2. Visit [Railway community support](https://discord.com/invite/railway)