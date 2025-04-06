// This is a modified version of api/index.ts optimized for Vercel's serverless environment
// It includes improved error handling, connection retries, and better debugging

const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

// Import server code with JS imports instead of TS imports
const { registerRoutes } = require('../../server/routes');
const { initializeDatabase } = require('../../server/db');
const { PostgreSQLStorage } = require('../../server/postgresql');
const { setStorage } = require('../../server/storage');

// Import our Vercel-safe auth module instead of the one with TypeScript global declarations
const { setupAuth } = require('./auth-serverless');

// Load environment variables
dotenv.config();

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
let app = null;
let storage = null;
let isInitialized = false;
let initializationError = null;
let lastInitAttempt = 0;
const INIT_COOLDOWN = 10000; // 10 seconds between initialization attempts

// Helper function to wait for some time
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Retry function with exponential backoff
const withRetry = async (fn, options = {}) => {
  const maxRetries = options.maxRetries || 3;
  const baseDelay = options.baseDelay || 200;
  const maxDelay = options.maxDelay || 3000;
  const factor = options.factor || 2;
  const jitter = options.jitter || 0.1;
  
  let retries = 0;
  let lastError = null;
  
  while (retries <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      retries++;
      
      if (retries > maxRetries) {
        console.error(`Max retries (${maxRetries}) exceeded`);
        break;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        maxDelay,
        baseDelay * Math.pow(factor, retries) * (1 + Math.random() * jitter)
      );
      
      console.log(`Retry ${retries}/${maxRetries} in ${Math.round(delay)}ms after error: ${error.message}`);
      await wait(delay);
    }
  }
  
  throw lastError;
};

// Initialize application and database only once per instance
const initializeServer = async () => {
  // Check if we're already initialized successfully
  if (isInitialized && app && storage) {
    return { app, storage };
  }
  
  // Check if we've tried recently and failed
  const now = Date.now();
  if (initializationError && (now - lastInitAttempt < INIT_COOLDOWN)) {
    console.log(`Using cached initialization error (${Math.round((now - lastInitAttempt) / 1000)}s ago)`);
    throw initializationError;
  }
  
  // Reset error state for new attempt
  initializationError = null;
  lastInitAttempt = now;
  
  try {
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
    app.use((err, _req, res, _next) => {
      console.error('API Error:', err);
      res.status(500).json({
        error: 'Server error',
        message: err.message || 'An unexpected error occurred',
      });
    });
    
    // Validate database connection string
    if (!databaseUrl) {
      const error = new Error('DATABASE_URL or PostgreSQL environment variables are required');
      error.code = 'MISSING_DB_CONFIG';
      throw error;
    }
    
    // Initialize database with retry
    console.log('Connecting to database with retry logic...');
    await withRetry(
      async () => {
        await initializeDatabase(databaseUrl);
        console.log('Database connection established');
      }, 
      { 
        maxRetries: 3,
        baseDelay: 300,
        maxDelay: 5000,
        jitter: 0.2
      }
    );
    
    // Create storage instance with retry capability built-in
    console.log('Setting up PostgreSQL storage...');
    storage = new PostgreSQLStorage(databaseUrl);
    setStorage(storage);
    
    // Test the database connection with a simple query
    console.log('Testing database connection...');
    await withRetry(
      async () => {
        try {
          // Try to get user count as a simple test query
          const testResult = await storage.isAdmin(1);
          console.log('Database test query completed successfully');
        } catch (queryError) {
          console.error('Database test query failed:', queryError);
          throw queryError;
        }
      },
      { maxRetries: 2 }
    );
    
    // Set up authentication
    console.log('Setting up authentication...');
    setupAuth(app);
    
    // Register routes
    console.log('Registering API routes...');
    await registerRoutes(app);
    
    isInitialized = true;
    console.log('Server initialization completed successfully');
    
    return { app, storage };
  } catch (error) {
    console.error('Server initialization failed:', error);
    initializationError = error;
    isInitialized = false;
    throw error;
  }
};

// Add enhanced diagnostics data to any error response
const enhanceErrorResponse = (error, req) => {
  return {
    error: 'Server error',
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
    code: error.code || 'UNKNOWN_ERROR',
    path: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    serverInfo: {
      initialized: isInitialized,
      environment: process.env.NODE_ENV || 'development',
      hasDbUrl: !!databaseUrl,
      vercel: !!process.env.VERCEL,
    }
  };
};

// Vercel serverless handler
module.exports = async function handler(req, res) {
  // Start timing the request for debugging
  const requestStart = Date.now();
  
  try {
    // Add health check that doesn't require full initialization
    if (req.url === '/api/health') {
      return res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        initialized: isInitialized,
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
      });
    }
    
    // Add database debug endpoint for Vercel deployment verification
    if (req.url === '/api/debug/database') {
      return res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: {
          connected: isInitialized,
          hasDbUrl: !!process.env.DATABASE_URL,
          hasPgHost: !!process.env.PGHOST,
          hasPgPort: !!process.env.PGPORT, 
          hasPgUser: !!process.env.PGUSER,
          hasPgPassword: !!process.env.PGPASSWORD,
          hasPgDatabase: !!process.env.PGDATABASE,
          url: databaseUrl ? databaseUrl.replace(/:[^:]*@/, ':[PASSWORD]@') : 'Not configured',
          error: initializationError ? initializationError.message : null,
          lastAttempt: lastInitAttempt ? new Date(lastInitAttempt).toISOString() : null
        },
        environment: process.env.NODE_ENV,
        engine: 'serverless',
        memory: process.memoryUsage(),
        uptime: process.uptime()
      });
    }
    
    // Initialize the server components for non-diagnostic requests
    const { app } = await initializeServer();

    // Create a middleware chain compatible with both Express and Vercel
    const handleWithExpress = (req, res) => {
      return new Promise((resolve, reject) => {
        app(req, res, (err) => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    };
    
    // Handle the request
    await handleWithExpress(req, res);
    
    // Log successful request handling time
    const requestTime = Date.now() - requestStart;
    console.log(`Request to ${req.url} completed in ${requestTime}ms`);
    
    return;
    
  } catch (error) {
    // Log the full error with stack trace
    console.error('Error in serverless handler:', error);
    
    // Calculate request handling time even for errors
    const requestTime = Date.now() - requestStart;
    console.log(`Request to ${req.url} failed after ${requestTime}ms: ${error.message}`);
    
    // Return an enhanced error response
    res.status(500).json(enhanceErrorResponse(error, req));
  }
};