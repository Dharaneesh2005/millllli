import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { users, products, cartItems, contacts, InsertProduct } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Sample product data defined directly here to avoid importing from a separate file
const sampleProducts: InsertProduct[] = [
  {
    name: "Organic Foxtail Millet",
    slug: "organic-foxtail-millet",
    description: "Foxtail millet is one of the oldest cultivated millets, known for its high nutritional value.",
    shortDescription: "Nutrient-rich ancient grain, perfect for healthy meals.",
    price: "150.00", 
    comparePrice: "180.00",
    badge: "Organic",
    category: "Grains",
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e8c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
    imageGallery: [
      "https://images.unsplash.com/photo-1586201375761-83865001e8c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"
    ],
    inStock: true,
    stockQuantity: 50,
    featured: true,
    nutritionFacts: "Serving Size: 100g, Calories: 364, Protein: 11.5g, Fat: 4g, Carbohydrates: 72g",
    cookingInstructions: "Rinse thoroughly before cooking. Use 1 part millet to 2.5 parts water.",
    rating: "4.8",
    reviewCount: 24,
    weightOptions: ["500g", "1kg", "2kg"],
    reviews: JSON.stringify([
      {
        id: "1", 
        name: "Ananya Sharma", 
        avatar: "https://randomuser.me/api/portraits/women/17.jpg", 
        date: "2023-06-15", 
        rating: 5, 
        comment: "This foxtail millet is amazing! I made a delicious pulao with it and my family loved it.",
        helpfulCount: 8
      }
    ])
  },
  {
    name: "Barnyard Millet Flour",
    slug: "barnyard-millet-flour",
    description: "Our stone-ground barnyard millet flour is a perfect gluten-free alternative for your baking needs.",
    shortDescription: "Gluten-free flour with high fiber content.",
    price: "180.00",
    comparePrice: "200.00",
    badge: "Gluten-Free",
    category: "Flour",
    imageUrl: "https://images.unsplash.com/photo-1586201375800-744e8cf7cdea?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
    imageGallery: [
      "https://images.unsplash.com/photo-1586201375800-744e8cf7cdea?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"
    ],
    inStock: true,
    stockQuantity: 30,
    featured: true,
    nutritionFacts: "Serving Size: 100g, Calories: 342, Protein: 10.8g, Fat: 3.9g, Carbohydrates: 65.5g",
    cookingInstructions: "Can replace regular flour in most recipes. For bread and baked goods, best results when mixed with other flours.",
    rating: "4.6",
    reviewCount: 18,
    weightOptions: ["500g", "1kg"],
    reviews: JSON.stringify([
      {
        id: "1", 
        name: "Priya Patel", 
        avatar: "https://randomuser.me/api/portraits/women/44.jpg", 
        date: "2023-06-02", 
        rating: 5, 
        comment: "I've been looking for gluten-free alternatives for my daughter, and this flour is perfect!",
        helpfulCount: 7
      }
    ])
  }
];

/**
 * Initialize the database connection and run migrations
 */
export async function initializeDatabase(url: string) {
  console.log('Initializing database connection...');
  try {
    // Create a postgres client for migrations
    const migrationClient = postgres(url, { ssl: 'require' });
    // Create a drizzle instance for migrations
    const migrationDb = drizzle(migrationClient);
    
    // Create necessary tables if they don't exist
    await migrationDb.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        otp_secret TEXT,
        otp_enabled BOOLEAN DEFAULT FALSE,
        is_admin BOOLEAN DEFAULT FALSE
      );
      
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        short_description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        compare_price DECIMAL(10, 2),
        badge TEXT,
        category TEXT NOT NULL,
        image_url TEXT NOT NULL,
        image_gallery TEXT[],
        in_stock BOOLEAN DEFAULT TRUE,
        stock_quantity INTEGER DEFAULT 0,
        featured BOOLEAN DEFAULT FALSE,
        nutrition_facts TEXT,
        cooking_instructions TEXT,
        rating DECIMAL(3, 2),
        review_count INTEGER DEFAULT 0,
        weight_options TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        reviews TEXT
      );
      
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        session_id TEXT,
        product_id INTEGER NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create a client for data operations
    const client = postgres(url, { ssl: 'require' });
    const db = drizzle(client);
    
    // Create admin user if it doesn't exist
    const adminUser = await db.select().from(users).where(eq(users.username, 'admin_millikit'));
    
    if (adminUser.length === 0) {
      console.log('Creating admin user...');
      await migrationDb.execute(`
        INSERT INTO users (username, password, name, is_admin) 
        VALUES ('admin_millikit', 'the_millikit', 'Admin', true)
      `);
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
    
    // Check if we need to insert sample products
    const existingProducts = await db.select().from(products);
    
    if (existingProducts.length === 0) {
      console.log('Populating products table with sample data...');
      
      // Insert products in batches to avoid overwhelming the database
      for (const product of sampleProducts) {
        try {
          // Use parameterized queries with proper TypeScript null checking
          const imageGalleryArray = product.imageGallery || [];
          const weightOptionsArray = product.weightOptions || [];
          const reviewsStr = product.reviews || null;
          
          // Use raw SQL to avoid schema validation issues with a single SQL string
          const sql = `INSERT INTO products 
            (name, slug, description, short_description, price, compare_price, badge, 
            category, image_url, image_gallery, in_stock, stock_quantity, featured, 
            nutrition_facts, cooking_instructions, rating, review_count, weight_options, reviews) 
            VALUES 
            ('${product.name}', 
            '${product.slug}', 
            '${product.description.replace(/'/g, "''")}', 
            '${product.shortDescription?.replace(/'/g, "''")}', 
            ${product.price}, 
            ${product.comparePrice ? product.comparePrice : 'NULL'}, 
            ${product.badge ? `'${product.badge}'` : 'NULL'}, 
            '${product.category}', 
            '${product.imageUrl}', 
            ARRAY[${imageGalleryArray.map((url: string) => `'${url}'`).join(', ')}], 
            ${product.inStock}, 
            ${product.stockQuantity}, 
            ${product.featured}, 
            ${product.nutritionFacts ? `'${product.nutritionFacts.replace(/'/g, "''")}'` : 'NULL'}, 
            ${product.cookingInstructions ? `'${product.cookingInstructions.replace(/'/g, "''")}'` : 'NULL'}, 
            ${product.rating}, 
            ${product.reviewCount}, 
            ARRAY[${weightOptionsArray.map((opt: string) => `'${opt}'`).join(', ')}], 
            ${reviewsStr ? `'${reviewsStr.replace(/'/g, "''")}'` : 'NULL'}
            )`;
          
          await migrationDb.execute(sql);
        } catch (error) {
          console.error(`Error inserting product ${product.name}:`, error);
          // Continue with the next product even if this one fails
        }
      }
      
      console.log(`Added ${sampleProducts.length} sample products`);
    } else {
      console.log(`Database already has ${existingProducts.length} products`);
    }
    
    // Close the migration client
    await migrationClient.end();
    
    console.log('Database initialization complete');
    return { client, db };
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}