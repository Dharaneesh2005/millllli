import { 
  users, type User, type InsertUser,
  products, type Product, type InsertProduct,
  cartItems, type CartItem, type InsertCartItem,
  contacts, type Contact, type InsertContact
} from "@shared/schema";
import { verifyToken } from './otpUtils';
import { PostgreSQLStorage } from './postgresql';
import 'dotenv/config';

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  isAdmin(userId: number): Promise<boolean>;
  enableOtp(userId: number, secret: string): Promise<User | undefined>;
  verifyOtp(userId: number, token: string): Promise<boolean>;

  // Product operations
  getProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  getProductsByCategory(category: string): Promise<Product[]>;
  getFeaturedProducts(): Promise<Product[]>;
  searchProducts(query: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<void>;

  // Cart operations
  getCartItems(sessionId: string): Promise<CartItem[]>;
  getCartItemWithProduct(sessionId: string, productId: number): Promise<CartItem | undefined>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: number): Promise<void>;
  clearCart(sessionId: string): Promise<void>;

  // Contact operations
  createContact(contact: InsertContact): Promise<Contact>;
  getContacts(): Promise<Contact[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private cartItems: Map<number, CartItem>;
  private contacts: Map<number, Contact>;
  private userIdCounter: number;
  private productIdCounter: number;
  private cartItemIdCounter: number;
  private contactIdCounter: number;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.cartItems = new Map();
    this.contacts = new Map();
    this.productIdCounter = 1;
    this.cartItemIdCounter = 1;
    this.contactIdCounter = 1;
    
    // Create a predefined admin user with ID 1
    // This is the only admin user allowed in the system
    const adminUser: User = {
      id: 1,
      username: "admin_millikit",
      password: "the_millikit",
      name: null,
      email: null,
      phone: null,
      address: null,
      otpSecret: null,
      otpEnabled: false,
      isAdmin: true
    };
    
    // Set the admin user directly in the map with ID 1
    this.users.set(1, adminUser);
    console.log("Predefined admin user created with ID: 1");
    
    // Start user ID counter at 2 to preserve admin as ID 1
    this.userIdCounter = 2;

    // Initialize with some sample products
    this.initProducts();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id,
      name: insertUser.name || null,
      email: insertUser.email || null,
      phone: insertUser.phone || null,
      address: insertUser.address || null,
      otpSecret: null,
      otpEnabled: false,
      isAdmin: false
    };
    this.users.set(id, user);
    return user;
  }
  
  async isAdmin(userId: number): Promise<boolean> {
    // Check if user exists and has isAdmin flag set to true
    const user = this.users.get(userId);
    return user ? Boolean(user.isAdmin) : false;
  }

  async enableOtp(userId: number, secret: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    // Only allow enabling OTP for the admin user (userId === 1)
    if (userId !== 1) {
      console.error("Attempted to enable OTP for non-admin user:", userId);
      return undefined;
    }
    
    const updatedUser = { 
      ...user, 
      otpSecret: secret,
      otpEnabled: true,
      // Preserve admin status - should already be true for the predefined admin
      isAdmin: true
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async verifyOtp(userId: number, token: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user || !user.otpSecret || !user.otpEnabled) return false;
    
    // Use the imported verifyToken function directly
    return verifyToken(token, user.otpSecret);
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProductById(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(
      (product) => product.slug === slug
    );
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.category === category
    );
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.featured
    );
  }

  async searchProducts(query: string): Promise<Product[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.products.values()).filter(
      (product) => 
        product.name.toLowerCase().includes(lowercaseQuery) ||
        product.description.toLowerCase().includes(lowercaseQuery) ||
        product.category.toLowerCase().includes(lowercaseQuery)
    );
  }
  
  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    const slug = product.slug || product.name.toLowerCase().replace(/\s+/g, '-');
    const newProduct: Product = {
      ...product,
      id,
      slug,
      shortDescription: product.shortDescription || null,
      comparePrice: product.comparePrice || null,
      badge: product.badge || null,
      imageGallery: product.imageGallery || [product.imageUrl],
      inStock: product.inStock !== undefined ? product.inStock : true,
      stockQuantity: product.stockQuantity || 0,
      featured: product.featured || false,
      nutritionFacts: product.nutritionFacts || null,
      cookingInstructions: product.cookingInstructions || null,
      rating: product.rating || null,
      reviewCount: product.reviewCount || 0,
      reviews: product.reviews || null,
      weightOptions: product.weightOptions || [],
      createdAt: new Date()
    };
    this.products.set(id, newProduct);
    return newProduct;
  }
  
  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const existingProduct = this.products.get(id);
    if (!existingProduct) return undefined;
    
    const updatedProduct: Product = {
      ...existingProduct,
      ...product,
      // Ensure required fields maintain their values
      id: existingProduct.id,
      slug: product.slug || existingProduct.slug,
      createdAt: existingProduct.createdAt // Ensure createdAt is preserved
    };
    
    // Update image gallery if main image changed
    if (product.imageUrl && !product.imageGallery) {
      const gallery = [...(existingProduct.imageGallery || [])];
      // Replace first image or add if empty
      if (gallery.length > 0) {
        gallery[0] = product.imageUrl;
      } else {
        gallery.push(product.imageUrl);
      }
      updatedProduct.imageGallery = gallery;
    }
    
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<void> {
    this.products.delete(id);
  }

  // Cart operations
  async getCartItems(sessionId: string): Promise<CartItem[]> {
    return Array.from(this.cartItems.values()).filter(
      (item) => item.sessionId === sessionId
    );
  }

  async getCartItemWithProduct(sessionId: string, productId: number): Promise<CartItem | undefined> {
    return Array.from(this.cartItems.values()).find(
      (item) => item.sessionId === sessionId && item.productId === productId
    );
  }

  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    const id = this.cartItemIdCounter++;
    const now = new Date();
    const cartItem: CartItem = { 
      ...insertCartItem, 
      id, 
      createdAt: now,
      userId: insertCartItem.userId || null,
      sessionId: insertCartItem.sessionId || null,
      quantity: insertCartItem.quantity || 1
    };
    this.cartItems.set(id, cartItem);
    return cartItem;
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const cartItem = this.cartItems.get(id);
    if (!cartItem) return undefined;

    const updatedItem: CartItem = { ...cartItem, quantity };
    this.cartItems.set(id, updatedItem);
    return updatedItem;
  }

  async removeFromCart(id: number): Promise<void> {
    this.cartItems.delete(id);
  }

  async clearCart(sessionId: string): Promise<void> {
    Array.from(this.cartItems.entries())
      .filter(([_, item]) => item.sessionId === sessionId)
      .forEach(([id, _]) => this.cartItems.delete(id));
  }

  // Contact operations
  async createContact(insertContact: InsertContact): Promise<Contact> {
    const id = this.contactIdCounter++;
    const now = new Date();
    const contact: Contact = { ...insertContact, id, createdAt: now };
    this.contacts.set(id, contact);
    return contact;
  }
  
  async getContacts(): Promise<Contact[]> {
    return Array.from(this.contacts.values());
  }

  // Initialize products
  private initProducts() {
    const products: Product[] = [
      {
        id: this.productIdCounter++,
        name: "Foxtail Millet",
        slug: "foxtail-millet",
        description: "Foxtail millet (தினை) is one of the oldest cultivated millet species, and it continues to be an important crop in many parts of India. Our premium foxtail millet is grown organically in the fertile soils of Tamil Nadu with traditional farming methods. Foxtail millet is rich in complex carbohydrates and has a lower glycemic index compared to rice or wheat. It's an excellent choice for those managing diabetes or looking to maintain stable blood sugar levels.",
        shortDescription: "Premium quality organic foxtail millet grown in the fertile soils of Tamil Nadu.",
        price: "299",
        comparePrice: "349",
        badge: "Organic",
        category: "organic",
        imageUrl: "https://images.pexels.com/photos/7511774/pexels-photo-7511774.jpeg",
        imageGallery: [
          "https://images.pexels.com/photos/7511774/pexels-photo-7511774.jpeg",
          "https://images.pexels.com/photos/7511778/pexels-photo-7511778.jpeg",
          "https://images.pexels.com/photos/7511753/pexels-photo-7511753.jpeg",
          "https://images.pexels.com/photos/7511768/pexels-photo-7511768.jpeg"
        ],
        inStock: true,
        stockQuantity: 24,
        featured: true,
        nutritionFacts: JSON.stringify({
          servingSize: "100g",
          calories: 351,
          totalFat: 4.0,
          saturatedFat: 0.7,
          cholesterol: 0,
          sodium: 5,
          totalCarbohydrate: 63.2,
          dietaryFiber: 8.5,
          sugars: 0.6,
          protein: 11.2,
          vitamins: {
            iron: "3.0mg (16% DV)",
            calcium: "31mg (3% DV)",
            magnesium: "81mg (20% DV)",
            phosphorus: "290mg (29% DV)",
            potassium: "250mg (7% DV)",
            zinc: "2.4mg (16% DV)"
          }
        }),
        cookingInstructions: "Rinse 1 cup of foxtail millet under cold water until the water runs clear. In a pot, add 2.5 cups of water and the rinsed millet. Bring to a boil, then reduce heat to low and cover with a lid. Simmer for 15-20 minutes or until all the water is absorbed and the millet is tender. Remove from heat and let it sit, covered, for 5 minutes. Fluff with a fork before serving.",
        rating: "4.8",
        reviewCount: 42,
        weightOptions: ["250g", "500g", "1kg"],
        reviews: JSON.stringify([
          {
            id: "r1",
            name: "Ananya Sharma",
            avatar: "https://i.pravatar.cc/150?img=32",
            date: "2023-12-15",
            rating: 5,
            comment: "Excellent quality foxtail millet! The packaging was great and the millet cooks perfectly. I've been using it for breakfast porridge and love the nutty flavor.",
            helpfulCount: 12
          },
          {
            id: "r2",
            name: "Raj Patel",
            avatar: "https://i.pravatar.cc/150?img=68",
            date: "2023-11-22",
            rating: 4,
            comment: "Very good product. I've switched from rice to this millet and noticed better digestion. Would recommend for anyone looking for healthier alternatives.",
            helpfulCount: 8
          }
        ]),
        createdAt: new Date()
      },
      {
        id: this.productIdCounter++,
        name: "Pearl Millet",
        slug: "pearl-millet",
        description: "Pearl millet (Bajra) is highly nutritious and one of the most drought-resistant crops. Our organic pearl millet is carefully sourced and processed to retain its nutritional benefits.",
        shortDescription: "Organic pearl millet (Bajra)",
        price: "249",
        comparePrice: "299",
        badge: "Best Seller",
        category: "organic",
        imageUrl: "https://images.pexels.com/photos/7511729/pexels-photo-7511729.jpeg",
        imageGallery: [
          "https://images.pexels.com/photos/7511729/pexels-photo-7511729.jpeg"
        ],
        inStock: true,
        stockQuantity: 15,
        featured: true,
        nutritionFacts: null,
        cookingInstructions: null,
        rating: "4.6",
        reviewCount: 28,
        weightOptions: ["500g", "1kg"],
        reviews: null,
        createdAt: new Date()
      },
      {
        id: this.productIdCounter++,
        name: "Finger Millet",
        slug: "finger-millet",
        description: "Finger millet (Ragi) is rich in calcium and protein. It helps in strengthening bones and is ideal for growing children and the elderly.",
        shortDescription: "Fresh finger millet (Ragi)",
        price: "279",
        comparePrice: "329",
        badge: null,
        category: "organic",
        imageUrl: "https://images.pexels.com/photos/7511761/pexels-photo-7511761.jpeg",
        imageGallery: [
          "https://images.pexels.com/photos/7511761/pexels-photo-7511761.jpeg"
        ],
        inStock: true,
        stockQuantity: 18,
        featured: true,
        nutritionFacts: null,
        cookingInstructions: null,
        rating: "4.5",
        reviewCount: 32,
        weightOptions: ["250g", "500g", "750g"],
        reviews: null,
        createdAt: new Date()
      },
      {
        id: this.productIdCounter++,
        name: "Little Millet",
        slug: "little-millet",
        description: "Little millet (Samai) is a good source of protein and minerals. It helps in controlling blood sugar levels and aids in digestion.",
        shortDescription: "Organic little millet (Samai)",
        price: "319",
        comparePrice: null,
        badge: "New",
        category: "organic",
        imageUrl: "https://images.pexels.com/photos/7511771/pexels-photo-7511771.jpeg",
        imageGallery: [
          "https://images.pexels.com/photos/7511771/pexels-photo-7511771.jpeg"
        ],
        inStock: true,
        stockQuantity: 22,
        featured: false,
        nutritionFacts: null,
        cookingInstructions: null,
        rating: "4.3",
        reviewCount: 18,
        weightOptions: ["250g", "500g"],
        reviews: null,
        createdAt: new Date()
      },
      {
        id: this.productIdCounter++,
        name: "Millet Mix",
        slug: "millet-mix",
        description: "A nutritious blend of different millets that provides a balanced mix of nutrients. Perfect for daily consumption.",
        shortDescription: "Mixed millet blend",
        price: "349",
        comparePrice: "399",
        badge: null,
        category: "mixed",
        imageUrl: "https://images.pexels.com/photos/7511751/pexels-photo-7511751.jpeg",
        imageGallery: [
          "https://images.pexels.com/photos/7511751/pexels-photo-7511751.jpeg"
        ],
        inStock: true,
        stockQuantity: 10,
        featured: false,
        nutritionFacts: null,
        cookingInstructions: null,
        rating: "4.2",
        reviewCount: 15,
        weightOptions: ["500g", "1kg"],
        reviews: null,
        createdAt: new Date()
      },
      {
        id: this.productIdCounter++,
        name: "Barnyard Millet",
        slug: "barnyard-millet",
        description: "Barnyard millet is high in fiber and iron. It helps in controlling diabetes and maintaining heart health.",
        shortDescription: "Organic barnyard millet",
        price: "269",
        comparePrice: null,
        badge: null,
        category: "organic",
        imageUrl: "https://images.pexels.com/photos/7511756/pexels-photo-7511756.jpeg",
        imageGallery: [
          "https://images.pexels.com/photos/7511756/pexels-photo-7511756.jpeg"
        ],
        inStock: true,
        stockQuantity: 12,
        featured: false,
        nutritionFacts: null,
        cookingInstructions: null,
        rating: "4.0",
        reviewCount: 12,
        weightOptions: ["250g", "500g"],
        reviews: null,
        createdAt: new Date()
      },
      {
        id: this.productIdCounter++,
        name: "Millet Porridge Mix",
        slug: "millet-porridge-mix",
        description: "A healthy breakfast option made with a mix of millets and essential nutrients. Easy to prepare and delicious.",
        shortDescription: "Ready-to-cook millet porridge mix",
        price: "379",
        comparePrice: "429",
        badge: "Special",
        category: "specialty",
        imageUrl: "https://images.pexels.com/photos/7511760/pexels-photo-7511760.jpeg",
        imageGallery: [
          "https://images.pexels.com/photos/7511760/pexels-photo-7511760.jpeg"
        ],
        inStock: true,
        stockQuantity: 7,
        featured: false,
        nutritionFacts: null,
        cookingInstructions: null,
        rating: "4.7",
        reviewCount: 24,
        weightOptions: ["250g", "400g"],
        reviews: null,
        createdAt: new Date()
      },
      {
        id: this.productIdCounter++,
        name: "Millet Flour",
        slug: "millet-flour",
        description: "Fine millet flour perfect for making rotis, dosas, and other recipes. Gluten-free and nutritious.",
        shortDescription: "Stone-ground millet flour",
        price: "259",
        comparePrice: "299",
        badge: null,
        category: "specialty",
        imageUrl: "https://images.pexels.com/photos/7511768/pexels-photo-7511768.jpeg",
        imageGallery: [
          "https://images.pexels.com/photos/7511768/pexels-photo-7511768.jpeg"
        ],
        inStock: true,
        stockQuantity: 20,
        featured: false,
        nutritionFacts: null,
        cookingInstructions: null,
        rating: "4.4",
        reviewCount: 19,
        weightOptions: ["250g", "500g", "1kg"],
        reviews: null,
        createdAt: new Date()
      }
    ];

    products.forEach(product => {
      this.products.set(product.id, product);
    });
  }
}

// Determine which storage implementation to use
// Use PostgreSQL in production and when DATABASE_URL is available
// Otherwise, fall back to in-memory storage for development
let storage: IStorage;

// Initialize storage with default implementation
if (process.env.DATABASE_URL) {
  console.log('Using PostgreSQL storage implementation with DATABASE_URL');
  storage = new PostgreSQLStorage(process.env.DATABASE_URL);
} else {
  console.log('DATABASE_URL not found, using in-memory storage implementation');
  storage = new MemStorage();
}

// Function to set the storage implementation (useful for serverless environments)
export function setStorage(newStorage: IStorage): void {
  storage = newStorage;
  console.log('Storage implementation updated');
}

export { storage };
