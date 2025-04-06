// This is a special debug page that returns information about the environment
// and optionally tests database connection

import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';

export default async function handler(req, res) {
  // Only GET requests allowed
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Initialize response object with basic info
  const responseData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: {
      isVercel: !!process.env.VERCEL,
      region: process.env.VERCEL_REGION || 'unknown',
      url: process.env.VERCEL_URL || 'unknown',
    },
    database: {
      // Check if database environment variables are set but don't expose values
      hasDbUrl: !!process.env.DATABASE_URL,
      hasPgHost: !!process.env.PGHOST,
      hasPgPort: !!process.env.PGPORT,
      hasPgUser: !!process.env.PGUSER,
      hasPgPassword: !!process.env.PGPASSWORD,
      hasPgDatabase: !!process.env.PGDATABASE,
      connectionTested: false,
      connectionStatus: 'not_tested'
    },
    admin: {
      hasAdminKey: !!process.env.ADMIN_KEY,
      hasSessionSecret: !!process.env.SESSION_SECRET,
    },
    nextconfig: {
      distDir: 'dist',
    }
  };

  // If test_db query parameter is present, test the database connection
  if (req.query.test_db === 'true' && process.env.DATABASE_URL) {
    try {
      // Create a connection with a short timeout
      const client = postgres(process.env.DATABASE_URL, {
        max: 1,
        idle_timeout: 3,
        connect_timeout: 5,
        prepare: false
      });
      
      // Initialize drizzle
      const db = drizzle(client);
      
      // Execute a simple query to test connection
      const result = await db.execute(sql`SELECT NOW() as server_time`);
      
      // Update response with successful connection info
      responseData.database.connectionTested = true;
      responseData.database.connectionStatus = 'connected';
      responseData.database.serverTime = result[0]?.server_time || 'unknown';
      
      // Try to get a count of products table if it exists
      try {
        const tableCheck = await db.execute(sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'products'
          ) as table_exists
        `);
        
        if (tableCheck[0]?.table_exists) {
          const productCount = await db.execute(sql`SELECT COUNT(*) as count FROM products`);
          responseData.database.productsTable = {
            exists: true,
            count: productCount[0]?.count || 0
          };
        } else {
          responseData.database.productsTable = {
            exists: false
          };
        }
      } catch (tableError) {
        responseData.database.productsTable = {
          exists: 'error',
          error: tableError.message
        };
      }
      
      // Clean up connection
      await client.end();
    } catch (error) {
      // Update response with connection error
      responseData.database.connectionTested = true;
      responseData.database.connectionStatus = 'error';
      responseData.database.connectionError = error.message;
    }
  }

  // Return the response
  res.status(200).json(responseData);
}