import { 
  users, type User, type InsertUser,
  products, type Product, type InsertProduct, type ProductReview,
  cartItems, type CartItem, type InsertCartItem,
  contacts, type Contact, type InsertContact
} from "@shared/schema";
import { IStorage } from "./storage";
import { verifyToken } from './otpUtils';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, like, ilike, desc, and, or, count, max, asc, sql } from 'drizzle-orm';
import postgres from 'postgres';
import { PgTable } from 'drizzle-orm/pg-core';

/**
 * PostgreSQL implementation of the storage interface
 * Uses Drizzle ORM to interact with the database
 */
export class PostgreSQLStorage implements IStorage {
  private db!: ReturnType<typeof drizzle>; // Using ! to tell TypeScript this will be initialized
  private client!: ReturnType<typeof postgres>; // Using ! to tell TypeScript this will be initialized
  private connectionString: string;
  private maxRetries: number = 5;
  private retryDelay: number = 2000; // 2 seconds delay between retries

  constructor(connectionString: string) {
    console.log('Connecting to PostgreSQL database...');
    this.connectionString = connectionString;
    this.initConnection();
  }
  
  private initConnection() {
    try {
      // Check if we're in a serverless environment
      const isServerless = process.env.VERCEL || process.env.NODE_ENV === 'production';
      
      // Configure PostgreSQL client options for serverless or traditional environment
      const clientOptions: any = { 
        ssl: "require",
        max: isServerless ? 1 : 10, // Reduce connection pool for serverless
        idle_timeout: isServerless ? 20 : 30, // Shorter timeout for serverless
        connect_timeout: isServerless ? 15 : 10, // Longer initial connect timeout for serverless
        connection: {
          application_name: isServerless ? 'millikit-serverless' : 'millikit-standard'
        },
        onnotice: () => {}, // ignore notices
        onparameter: () => {}, // ignore parameter updates
        // Serverless-specific optimizations
        ...(isServerless ? {
          prepare: false, // Disable prepared statements in serverless
          debug: process.env.DEBUG === 'true', // Enable debug logs only when DEBUG is true
          keepAlive: false, // Don't send keepalive queries in serverless
          transform: { undefined: null }, // Transform undefined to null for better compatibility
        } : {})
      };
      
      console.log(`Initializing database in ${isServerless ? 'serverless' : 'standard'} mode`);
      
      // Create a Postgres client with the appropriate options
      this.client = postgres(this.connectionString, clientOptions);
      
      // Initialize Drizzle with the client
      this.db = drizzle(this.client);
      
      console.log('Database connection established successfully');
    } catch (error) {
      console.error('Failed to initialize database connection:', error);
      throw error;
    }
  }

  // Helper method to execute queries with auto-reconnection logic
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    retries: number = this.maxRetries
  ): Promise<T> {
    try {
      // For serverless functions, pre-warm the connection with a simple query
      const isServerless = process.env.VERCEL || process.env.NODE_ENV === 'production';
      if (isServerless && this.db) {
        try {
          // Simple query to ensure connection is established before running the operation
          await this.db.execute(sql`SELECT 1`);
        } catch (warmupError) {
          console.log('Connection warmup failed, will continue with operation:', 
            warmupError instanceof Error ? warmupError.message : 'Unknown error');
          // We'll continue even if the warmup fails; the retry logic will handle reconnection if needed
        }
      }
      
      return await operation();
    } catch (error) {
      // List of all possible connection error messages
      const connectionErrorPatterns = [
        // PostgreSQL specific connection errors
        'terminating connection', 'Connection terminated', 'Connection closed',
        'connection lost', 'could not connect', 'timeout', 'idle_in_transaction',
        'query_canceled', 'connection has been closed', 'connection is closed',
        // Serverless environment specific errors
        'socket hang up', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND',
        'Connection timeout', 'Network error', 'connection timed out',
        // Neon DB specific errors (if using Neon)
        'connection has been terminated', 'Timed out waiting for connection',
        'Idle connection has been terminated'
      ];
      
      // Check if the error message contains any of the connection error patterns
      const isConnectionError = error instanceof Error && 
        connectionErrorPatterns.some(pattern => 
          error.message.toLowerCase().includes(pattern.toLowerCase())
        );
      
      if (isConnectionError && retries > 0) {
        console.log(`Database connection error detected: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.log(`Reconnecting... (${retries} retries left)`);
        
        // Exponential backoff: increase delay with each retry, plus some jitter
        const baseDelay = this.retryDelay * (this.maxRetries - retries + 1);
        const jitter = Math.floor(Math.random() * 500); // Add 0-500ms of jitter
        const currentDelay = baseDelay + jitter;
        
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        
        try {
          // Close existing connection if possible
          try {
            if (this.client && typeof this.client.end === 'function') {
              await this.client.end({ timeout: 5 }).catch(e => 
                console.log('Non-critical: Error closing previous connection:', e.message)
              );
            }
          } catch (endError) {
            console.log('Non-critical: Error while attempting to close previous connection:', 
              endError instanceof Error ? endError.message : 'Unknown error');
            // Continue even if closing fails - this is non-critical
          }
          
          // Reinitialize the connection
          this.initConnection();
          
          // Verify connection with a simple query
          try {
            await this.db.execute(sql`SELECT 1`);
            console.log('Successfully reconnected and verified database connection');
          } catch (verifyError) {
            console.log('Connection verification failed, but continuing with retry');
          }
          
          // Retry the operation
          return this.executeWithRetry(operation, retries - 1);
        } catch (reconnectError) {
          console.error('Failed to reconnect to database:', 
            reconnectError instanceof Error ? reconnectError.message : 'Unknown error');
          
          if (retries > 1) {
            console.log('Will try again after delay...');
            // Increase delay for next retry
            await new Promise(resolve => setTimeout(resolve, currentDelay * 2));
            return this.executeWithRetry(operation, retries - 1);
          }
          
          // If we're out of retries, throw a more descriptive error
          if (error instanceof Error) {
            console.error('All database reconnection attempts failed after multiple retries');
            throw new Error(`Database error after ${this.maxRetries} retries: ${error.message}`);
          } else {
            throw error; // Throw the original error if it's not an Error object
          }
        }
      }
      
      // For other errors or if we're out of retries, just throw the original error
      throw error;
    }
  }

  // Helper function to ensure reviews are properly serialized/deserialized
  private parseReviews(reviewsStr: string | null): ProductReview[] {
    if (!reviewsStr) return [];
    try {
      return JSON.parse(reviewsStr) as ProductReview[];
    } catch (error) {
      console.error('Error parsing reviews:', error);
      return [];
    }
  }

  // Helper function to stringify reviews for storage
  private stringifyReviews(reviews: ProductReview[]): string {
    return JSON.stringify(reviews);
  }

  /** 
   * User Operations
   */
  async getUser(id: number): Promise<User | undefined> {
    return this.executeWithRetry(async () => {
      const results = await this.db.select().from(users).where(eq(users.id, id));
      return results.length > 0 ? results[0] : undefined;
    });
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.executeWithRetry(async () => {
      const results = await this.db.select().from(users).where(eq(users.username, username));
      return results.length > 0 ? results[0] : undefined;
    });
  }

  async createUser(user: InsertUser): Promise<User> {
    return this.executeWithRetry(async () => {
      const newUser = await this.db.insert(users).values(user).returning();
      return newUser[0];
    });
  }

  async isAdmin(userId: number): Promise<boolean> {
    return this.executeWithRetry(async () => {
      const user = await this.getUser(userId);
      return user?.isAdmin || false;
    });
  }

  async enableOtp(userId: number, secret: string): Promise<User | undefined> {
    return this.executeWithRetry(async () => {
      const updated = await this.db
        .update(users)
        .set({ otpSecret: secret, otpEnabled: true })
        .where(eq(users.id, userId))
        .returning();
      
      return updated.length > 0 ? updated[0] : undefined;
    });
  }

  async verifyOtp(userId: number, token: string): Promise<boolean> {
    return this.executeWithRetry(async () => {
      const user = await this.getUser(userId);
      if (!user || !user.otpEnabled || !user.otpSecret) {
        return false;
      }
      
      return verifyToken(token, user.otpSecret);
    });
  }

  /** 
   * Product Operations
   */
  async getProducts(): Promise<Product[]> {
    return this.executeWithRetry(async () => {
      const results = await this.db.select().from(products);
      return results;
    });
  }

  async getProductById(id: number): Promise<Product | undefined> {
    return this.executeWithRetry(async () => {
      const results = await this.db.select().from(products).where(eq(products.id, id));
      return results.length > 0 ? results[0] : undefined;
    });
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    return this.executeWithRetry(async () => {
      const results = await this.db.select().from(products).where(eq(products.slug, slug));
      return results.length > 0 ? results[0] : undefined;
    });
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return this.executeWithRetry(async () => {
      return await this.db.select().from(products).where(eq(products.category, category));
    });
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return this.executeWithRetry(async () => {
      return await this.db.select().from(products).where(eq(products.featured, true));
    });
  }

  async searchProducts(query: string): Promise<Product[]> {
    return this.executeWithRetry(async () => {
      if (!query) {
        return this.getProducts();
      }
      
      // Search in name, description, and category
      return await this.db.select().from(products).where(
        or(
          ilike(products.name, `%${query}%`),
          ilike(products.description, `%${query}%`), 
          ilike(products.category, `%${query}%`)
        )
      );
    });
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    return this.executeWithRetry(async () => {
      console.log("Creating product with data:", product);
      const newProduct = await this.db.insert(products).values(product).returning();
      console.log("Product created successfully:", newProduct[0]);
      return newProduct[0];
    });
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    return this.executeWithRetry(async () => {
      console.log(`Updating product ${id} with data:`, product);
      const updated = await this.db
        .update(products)
        .set(product)
        .where(eq(products.id, id))
        .returning();
      
      if (updated.length > 0) {
        console.log("Product updated successfully:", updated[0]);
        return updated[0];
      }
      console.log("No product found to update with ID:", id);
      return undefined;
    });
  }

  async deleteProduct(id: number): Promise<void> {
    return this.executeWithRetry(async () => {
      await this.db.delete(products).where(eq(products.id, id));
    });
  }

  /** 
   * Cart Operations
   */
  async getCartItems(sessionId: string): Promise<CartItem[]> {
    return this.executeWithRetry(async () => {
      return await this.db.select().from(cartItems).where(eq(cartItems.sessionId, sessionId));
    });
  }

  async getCartItemWithProduct(sessionId: string, productId: number): Promise<CartItem | undefined> {
    return this.executeWithRetry(async () => {
      const results = await this.db
        .select()
        .from(cartItems)
        .where(
          and(
            eq(cartItems.sessionId, sessionId),
            eq(cartItems.productId, productId)
          )
        );
      
      return results.length > 0 ? results[0] : undefined;
    });
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    return this.executeWithRetry(async () => {
      const newCartItem = await this.db.insert(cartItems).values(cartItem).returning();
      return newCartItem[0];
    });
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    return this.executeWithRetry(async () => {
      const updated = await this.db
        .update(cartItems)
        .set({ quantity })
        .where(eq(cartItems.id, id))
        .returning();
      
      return updated.length > 0 ? updated[0] : undefined;
    });
  }

  async removeFromCart(id: number): Promise<void> {
    return this.executeWithRetry(async () => {
      await this.db.delete(cartItems).where(eq(cartItems.id, id));
    });
  }

  async clearCart(sessionId: string): Promise<void> {
    return this.executeWithRetry(async () => {
      await this.db.delete(cartItems).where(eq(cartItems.sessionId, sessionId));
    });
  }

  /** 
   * Contact Operations
   */
  async createContact(contact: InsertContact): Promise<Contact> {
    return this.executeWithRetry(async () => {
      const newContact = await this.db.insert(contacts).values(contact).returning();
      return newContact[0];
    });
  }

  async getContacts(): Promise<Contact[]> {
    return this.executeWithRetry(async () => {
      return await this.db.select().from(contacts);
    });
  }
}