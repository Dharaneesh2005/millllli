// This is a JavaScript version of server/auth.ts
// Modified to work in Vercel's serverless environment without TypeScript global declarations
// Includes enhanced error handling and retry logic for serverless environments

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const crypto = require('crypto');
const { promisify } = require('util');

// Promisify crypto functions
const pbkdf2 = promisify(crypto.pbkdf2);

// Helper function for retrying operations with exponential backoff
const withRetry = async (fn, options = {}) => {
  const maxRetries = options.maxRetries || 3;
  const baseDelay = options.baseDelay || 200;
  const maxDelay = options.maxDelay || 3000;
  const factor = options.factor || 2;
  const jitter = options.jitter || 0.1;
  const context = options.context || 'operation';
  
  let retries = 0;
  let lastError = null;
  
  while (retries <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      retries++;
      
      if (retries > maxRetries) {
        console.error(`Max retries (${maxRetries}) exceeded for ${context}`);
        break;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        maxDelay,
        baseDelay * Math.pow(factor, retries) * (1 + Math.random() * jitter)
      );
      
      console.log(`Retry ${retries}/${maxRetries} for ${context} in ${Math.round(delay)}ms: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// Hash password with PBKDF2 (crypto native module)
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 10000;
  const keylen = 64;
  const digest = 'sha512';
  
  try {
    const derivedKey = await pbkdf2(password, salt, iterations, keylen, digest);
    return `${salt}:${iterations}:${keylen}:${digest}:${derivedKey.toString('hex')}`;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Password hashing failed');
  }
}

// Compare password with stored hash
async function comparePasswords(supplied, stored) {
  if (!supplied || !stored) {
    console.error('Missing password data for comparison');
    return false;
  }
  
  try {
    const parts = stored.split(':');
    if (parts.length !== 5) {
      console.error('Invalid password hash format');
      return false;
    }
    
    const [salt, iterations, keylen, digest, hash] = parts;
    const iterationsNum = parseInt(iterations, 10);
    const keylenNum = parseInt(keylen, 10);
    
    if (isNaN(iterationsNum) || isNaN(keylenNum)) {
      console.error('Invalid numeric parameters in password hash');
      return false;
    }
    
    const derivedKey = await pbkdf2(supplied, salt, iterationsNum, keylenNum, digest);
    return hash === derivedKey.toString('hex');
  } catch (err) {
    console.error('Password comparison error:', err);
    return false;
  }
}

// Enhanced storage retrieval with retry capability
const getStorageWithRetry = async () => {
  return withRetry(
    async () => {
      // Get the storage instance from the exports or global space
      const storage = global.storage || require('../../server/storage').storage;
      
      if (!storage) {
        throw new Error('Storage not initialized');
      }
      
      return storage;
    },
    { context: 'storage-retrieval', maxRetries: 2 }
  );
};

function setupAuth(app) {
  if (!app) {
    console.error('Express app is required for auth setup');
    throw new Error('Express app is required');
  }
  
  try {
    // Set up authentication with passport
    app.use(passport.initialize());
    app.use(passport.session());
    
    // Configure local strategy for use by Passport
    passport.use(
      new LocalStrategy(async (username, password, done) => {
        try {
          if (!username || !password) {
            return done(null, false, { message: 'Username and password are required' });
          }
          
          // Get storage with retry
          let storage;
          try {
            storage = await getStorageWithRetry();
          } catch (storageError) {
            console.error('Failed to get storage for authentication:', storageError);
            return done(storageError);
          }
          
          // Find user by username with retry
          let user;
          try {
            user = await withRetry(
              async () => storage.getUserByUsername(username),
              { context: 'user-lookup', maxRetries: 2 }
            );
          } catch (lookupError) {
            console.error(`Error looking up user ${username}:`, lookupError);
            return done(lookupError);
          }
          
          if (!user) {
            console.log(`Login failed: User ${username} not found`);
            return done(null, false, { message: 'Invalid username or password' });
          }
          
          // Check if password is correct
          let isValid = false;
          try {
            isValid = await comparePasswords(password, user.passwordHash);
          } catch (passwordError) {
            console.error(`Error comparing passwords for ${username}:`, passwordError);
            return done(passwordError);
          }
          
          if (!isValid) {
            console.log(`Login failed: Invalid password for ${username}`);
            return done(null, false, { message: 'Invalid username or password' });
          }
          
          // Check if 2FA is enabled and we need to verify OTP
          if (user.otpEnabled) {
            user.requiresOtp = true;
          }
          
          console.log(`User ${username} authenticated successfully`);
          return done(null, user);
        } catch (error) {
          console.error('Authentication error:', error);
          return done(error);
        }
      })
    );
    
    // Configure Passport to serialize/deserialize user instance to/from session
    passport.serializeUser((user, done) => {
      if (!user || !user.id) {
        return done(new Error('Invalid user object for serialization'));
      }
      done(null, user.id);
    });
    
    passport.deserializeUser(async (id, done) => {
      if (!id) {
        return done(new Error('Invalid user ID'));
      }
      
      try {
        // Get storage with retry
        let storage;
        try {
          storage = await getStorageWithRetry();
        } catch (storageError) {
          console.error('Failed to get storage for deserialization:', storageError);
          return done(storageError);
        }
        
        // Get user with retry
        let user;
        try {
          user = await withRetry(
            async () => storage.getUser(id),
            { context: 'user-deserialize', maxRetries: 2 }
          );
        } catch (userError) {
          console.error(`Error retrieving user ${id}:`, userError);
          return done(userError);
        }
        
        if (!user) {
          console.log(`Deserialization failed: User ID ${id} not found`);
          return done(null, false);
        }
        
        // Check admin status with retry
        let isAdmin = false;
        try {
          isAdmin = await withRetry(
            async () => storage.isAdmin(id),
            { context: 'admin-check', maxRetries: 2 }
          );
        } catch (adminError) {
          console.error(`Error checking admin status for ${id}:`, adminError);
          // Continue with non-admin status rather than failing completely
          console.log(`Treating user ${id} as non-admin due to error`);
          isAdmin = false;
        }
        
        // Add isAdmin flag to the user object
        const userWithRole = {
          ...user,
          isAdmin,
        };
        
        return done(null, userWithRole);
      } catch (error) {
        console.error('Deserialization error:', error);
        return done(error);
      }
    });
    
    // Add a middleware for admin authentication via API key for serverless environments
    app.use((req, res, next) => {
      // If user is already authenticated, continue
      if (req.isAuthenticated()) {
        return next();
      }
      
      // Check for admin key in header
      const adminKey = req.headers['x-admin-key'] || req.query.adminKey;
      const expectedAdminKey = process.env.ADMIN_KEY;
      
      if (adminKey && expectedAdminKey && adminKey === expectedAdminKey) {
        // Create admin session
        req.login({
          id: 0, // Special admin ID
          username: 'admin-api',
          isAdmin: true,
          apiAuthenticated: true
        }, (err) => {
          if (err) {
            console.error('API admin login error:', err);
            return next();
          }
          console.log('Admin authenticated via API key');
          next();
        });
      } else {
        next();
      }
    });
    
    return {
      hashPassword,
      comparePasswords
    };
  } catch (error) {
    console.error('Error setting up authentication:', error);
    throw error;
  }
}

module.exports = {
  hashPassword,
  comparePasswords,
  setupAuth,
};