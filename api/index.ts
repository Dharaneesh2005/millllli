import { VercelRequest, VercelResponse } from '@vercel/node';
import express, { Express, Request, Response, NextFunction } from 'express';
import { setupAuth } from '../server/auth';
import { registerRoutes } from '../server/routes';
import { Server } from 'http';
import dotenv from 'dotenv';
import cookie from 'cookie-parser';
import session from 'express-session';
import { initializeDatabase } from '../server/db';
import { PostgreSQLStorage } from '../server/postgresql';
import { setStorage } from '../server/storage';

// Load environment variables
dotenv.config();

// Configure session store based on environment
const sessionSecret = process.env.SESSION_SECRET || 'millikit-secret';

// When running locally, the DATABASE_URL usually includes these. When in Vercel, we use the separate env variables
const sslMode = process.env.NODE_ENV === 'production' ? '?sslmode=require' : '';
const pgHost = process.env.PGHOST;
const pgPort = process.env.PGPORT;
const pgUser = process.env.PGUSER;
const pgPassword = process.env.PGPASSWORD;
const pgDatabase = process.env.PGDATABASE;

// Database connection
let db: { client: any; db: any } | null = null;
let storage: PostgreSQLStorage | null = null;
// Singleton Express app instance for Lambda/serverless environment
let app: Express | null = null;

// Initialize database connection before handling requests
const initializeServerComponents = async () => {
  try {
    // Skip initialization if already done
    if (app && db && storage) {
      return { app, db, storage };
    }
    
    // Create and configure Express app
    app = express();
    
    // Common middleware
    app.use(express.json());
    app.use(cookie());
    
    // Initialize session middleware
    app.use(
      session({
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: process.env.NODE_ENV === 'production',
          maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        },
      })
    );
    
    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Global error handler caught:', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: err?.message || 'An unexpected error occurred',
      });
    });

    // Get database connection string
    let databaseUrl = process.env.DATABASE_URL;

    // If we have individual PostgreSQL environment variables, use those to construct a connection string
    if (pgHost && pgPort && pgUser && pgPassword && pgDatabase) {
      databaseUrl = `postgres://${pgUser}:${pgPassword}@${pgHost}:${pgPort}/${pgDatabase}${sslMode}`;
    }
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL or PostgreSQL environment variables are required');
    }

    console.log('Initializing database connection...');
    db = await initializeDatabase(databaseUrl);
    
    // Create the storage adapter
    storage = new PostgreSQLStorage(databaseUrl);
    setStorage(storage);
    
    // Setup authentication
    setupAuth(app);
    
    // Register API routes
    await registerRoutes(app);
    
    console.log('Server components initialized successfully');
    
    return { app, db, storage };
  } catch (error) {
    console.error('Failed to initialize server components:', error);
    throw error;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { app } = await initializeServerComponents();
    
    // Add health check endpoint for easier debugging
    if (req.url === '/api/health') {
      return res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        dbInitialized: !!db,
        dbConnected: !!storage,
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
        constructedDbUrl: pgHost && pgPort && pgUser && pgDatabase ? 
          `postgres://${pgUser}:[PASSWORD]@${pgHost}:${pgPort}/${pgDatabase}${sslMode}` : 
          'Using DATABASE_URL environment variable'
      });
    }
    
    // Forward the request to Express
    return new Promise<void>((resolve, reject) => {
      try {
        app!(req, res);
        res.on('finish', () => resolve());
        res.on('error', reject);
      } catch (error) {
        console.error('Vercel serverless function: Error handling request:', error);
        if (!res.headersSent) {
          res.status(500).json({ 
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Unknown error'
          });
        }
        resolve();
      }
    });
  } catch (error) {
    console.error('Failed to initialize server in serverless function:', error);
    
    // Return clear error for database connection issues
    return res.status(500).json({ 
      error: 'Database Connection Error',
      message: 'Could not connect to the database. Make sure DATABASE_URL or PostgreSQL environment variables are set correctly.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}