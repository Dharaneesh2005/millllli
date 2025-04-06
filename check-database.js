// Database connection test script
// Run with: node check-database.js

const postgres = require('postgres');
const { drizzle } = require('drizzle-orm/postgres-js');
const { sql } = require('drizzle-orm');
require('dotenv').config();

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

async function testConnection() {
  console.log('Database Connection Test');
  console.log('=======================');
  console.log('\nEnvironment Variables:');
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('PGHOST exists:', !!process.env.PGHOST);
  console.log('PGPORT exists:', !!process.env.PGPORT);
  console.log('PGUSER exists:', !!process.env.PGUSER);
  console.log('PGPASSWORD exists:', !!process.env.PGPASSWORD);
  console.log('PGDATABASE exists:', !!process.env.PGDATABASE);
  
  if (!databaseUrl) {
    console.error('\nERROR: No database connection string available!');
    console.error('Please set DATABASE_URL or individual PostgreSQL environment variables.');
    process.exit(1);
  }
  
  console.log('\nUsing connection string (credentials redacted):');
  console.log(databaseUrl.replace(/:[^:]*@/, ':[PASSWORD]@'));
  
  try {
    console.log('\nAttempting to connect to database...');
    
    // Create connection with short timeout
    const client = postgres(databaseUrl, {
      max: 1,
      idle_timeout: 3,
      connect_timeout: 5,
      prepare: false
    });
    
    // Initialize drizzle
    const db = drizzle(client);
    
    // Execute a simple query
    const result = await db.execute(sql`SELECT NOW() as server_time`);
    
    console.log('\nSUCCESS: Connected to database!');
    console.log('Server time:', result[0]?.server_time);
    
    // Try to test if the products table exists
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
        console.log('\nProducts table exists.');
        console.log('Product count:', productCount[0]?.count);
      } else {
        console.log('\nProducts table does not exist yet.');
        console.log('You may need to run database migrations.');
      }
    } catch (tableError) {
      console.error('\nERROR checking products table:', tableError.message);
    }
    
    // Clean up connection
    await client.end();
    
  } catch (error) {
    console.error('\nERROR: Database connection failed!');
    console.error(error.message);
    process.exit(1);
  }
}

testConnection().catch(console.error);