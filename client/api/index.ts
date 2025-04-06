import type { VercelRequest, VercelResponse } from '@vercel/node';
import express, { Express, Request, Response, NextFunction } from 'express';
import { registerRoutes } from '../../server/routes';
import { initializeDatabase } from '../../server/db';
import { IStorage } from '../../server/storage';
import { PostgreSQLStorage } from '../../server/postgresql';
import { setStorage } from '../../server/storage';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import session-related modules
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { setupAuth } from '../../server/auth';

// When running locally, the DATABASE_URL usually includes these. When in Vercel, we use the separate env variables
const sslMode = process.env.NODE_ENV === 'production' ? '?sslmode=require' : '';
const pgHost = process.env.PGHOST;
const pgPort = process.env.PGPORT;
const pgUser = process.env.PGUSER;
const pgPassword = process.env.PGPASSWORD;
const pgDatabase = process.env.PGDATABASE;

// Build connection string from environment variables
let databaseUrl = process.env.DATABASE_URL || '';

// If we have individual PostgreSQL environment variables, use those to construct a connection string
if (pgHost && pgPort && pgUser && pgPassword && pgDatabase) {
  databaseUrl = `postgres://${pgUser}:${pgPassword}@${pgHost}:${pgPort}/${pgDatabase}${sslMode}`;
}

// Singleton instance for serverless environment
let app: Express | null = null;
let storage: IStorage | null = null;
let isInitialized = false;

// Initialize application and database only once per instance
const initializeServer = async () => {
  // Skip if already initialized
  if (isInitialized && app && storage) {
    return { app, storage };
  }

  console.log('Initializing server in Vercel environment...');
  
  // Create Express app
  app = express();
  
  // Use JSON middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  
  // Set up session
  const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'millikit-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  };
  
  app.use(session(sessionConfig));
  
  // Handle errors
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('API Error:', err);
    res.status(500).json({
      error: 'Server error',
      message: err.message || 'An unexpected error occurred',
    });
  });
  
  // Initialize database
  if (!databaseUrl) {
    throw new Error('DATABASE_URL or PostgreSQL environment variables are required');
  }
  
  console.log('Connecting to database...');
  const dbClient = await initializeDatabase(databaseUrl);
  
  // Create and set storage
  storage = new PostgreSQLStorage(databaseUrl);
  setStorage(storage);
  
  // Set up authentication
  setupAuth(app);
  
  // Register routes
  await registerRoutes(app);
  
  isInitialized = true;
  console.log('Server initialization complete');
  
  return { app, storage };
};

// Vercel serverless handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Add health check that doesn't require full initialization
    if (req.url === '/api/health') {
      return res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        initialized: isInitialized,
        env: {
          nodeEnv: process.env.NODE_ENV,
          hasDbUrl: !!process.env.DATABASE_URL,
          hasPgHost: !!process.env.PGHOST,
          hasPgUser: !!process.env.PGUSER,
          hasPgPassword: !!process.env.PGPASSWORD,
          hasPgDatabase: !!process.env.PGDATABASE,
          hasPgPort: !!process.env.PGPORT,
          hasAdminKey: !!process.env.ADMIN_KEY
        },
        dbUrl: databaseUrl ? databaseUrl.replace(/:[^:]*@/, ':[PASSWORD]@') : 'Not configured'
      });
    }
    
    // Initialize the server components
    const { app } = await initializeServer();

    // Create a middleware chain compatible with both Express and Vercel
    // This avoids type mismatches between Vercel and Express request/response objects
    const handleWithExpress = (req: VercelRequest, res: VercelResponse): Promise<void> => {
      return new Promise((resolve, reject) => {
        // Express can handle the Vercel request/response objects despite the TypeScript warning
        // We need to cast here to satisfy TypeScript
        app!(req as any, res as any, (err: any) => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    };
    
    // Handle the request
    await handleWithExpress(req, res);
    return;
    
  } catch (error) {
    console.error('Error in serverless handler:', error);
    res.status(500).json({
      error: 'Server error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    });
  }
}