# Vercel Deployment Troubleshooting Guide

## Common Errors

### "Specified 'src' for '@vercel/next' has to be 'package.json' or 'next.config.js'"

This error occurs when Vercel can't find a proper Next.js configuration at the source path.

**Solution:**

1. Make sure your deployment settings specify the `client` directory as the root directory:
   - In Vercel dashboard: Settings → General → Root Directory → Set to `client`
   - When using CLI: `vercel --cwd ./client`

2. Your `vercel.json` in the client directory should point to `next.config.js`:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "next.config.js",
         "use": "@vercel/next"
       }
     ]
   }
   ```

3. Alternatively, deploy directly from the client directory without a custom vercel.json file and let Vercel auto-detect your Next.js project.

## Database Connection Issues

- Verify your database credentials are correct
- Make sure your database allows connections from Vercel's IP range
- For Neon, enable the "Pooled connection" option

## Deployment Tips

- The most reliable way to deploy a Next.js app on Vercel is to treat the client directory as a standalone project
- Use environment variables to configure your database connection
- Test your API endpoints using the `/api/health` endpoint after deployment