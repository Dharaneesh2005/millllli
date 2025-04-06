import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Pencil, 
  Trash2, 
  Plus, 
  ShoppingBag, 
  MessageSquare, 
  LayoutDashboard,
  Check,
  X,
  Filter,
  MoreHorizontal,
  Tag,
  Banknote,
  PackageCheck,
  ChevronDown,
  AlertTriangle,
  LogOut
} from "lucide-react";
import type { Product, Contact } from "@shared/schema";
import { formatPrice } from "@/lib/cart";

// The admin key - in a real app, this would be retrieved securely (e.g., from auth context)
// Get admin key from environment variable or use fallback for local development
const ADMIN_KEY = import.meta.env.VITE_ADMIN_SECRET || "admin-secret";

// Format a phone number for better readability (e.g., (123) 456-7890)
const formatPhoneNumber = (phoneNumber: string) => {
  // Clean the phone number to only contain digits
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a valid phone number (10 digits for US numbers)
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length > 10) {
    // For international numbers with country code
    return `+${cleaned.slice(0, cleaned.length-10)} (${cleaned.slice(-10, -7)}) ${cleaned.slice(-7, -4)}-${cleaned.slice(-4)}`;
  }
  
  // If it doesn't match expected formats, return the original number
  return phoneNumber;
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeTab, setActiveTab] = useState("products");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [featuredFilter, setFeaturedFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  useEffect(() => {
    // Fetch products when component mounts
    fetchProducts();
    fetchContacts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await fetch("/api/admin/contacts", {
        headers: {
          "x-admin-key": ADMIN_KEY,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch contacts");
      const data = await response.json();
      setContacts(data);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast({
        title: "Error",
        description: "Failed to load contact messages. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteProduct = async (productId: number) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
        headers: {
          "x-admin-key": ADMIN_KEY,
        },
      });
      
      if (!response.ok) throw new Error("Failed to delete product");
      
      // Update UI by removing the deleted product
      setProducts(products.filter(product => product.id !== productId));
      
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
      
      toast({
        title: "Success",
        description: "Product has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleProductFeatured = async (product: Product) => {
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": ADMIN_KEY,
        },
        body: JSON.stringify({
          featured: !product.featured,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to update product");
      
      const updatedProduct = await response.json();
      
      // Update the product in the UI
      setProducts(products.map(p => 
        p.id === updatedProduct.id ? updatedProduct : p
      ));
      
      toast({
        title: "Success",
        description: `Product has been ${updatedProduct.featured ? 'added to' : 'removed from'} featured products.`,
      });
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleProductInStock = async (product: Product) => {
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": ADMIN_KEY,
        },
        body: JSON.stringify({
          inStock: !product.inStock,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to update product");
      
      const updatedProduct = await response.json();
      
      // Update the product in the UI
      setProducts(products.map(p => 
        p.id === updatedProduct.id ? updatedProduct : p
      ));
      
      toast({
        title: "Success",
        description: `Product is now ${updatedProduct.inStock ? 'in stock' : 'out of stock'}.`,
      });
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const bulkDeleteProducts = async () => {
    try {
      // Execute delete operations in parallel
      await Promise.all(
        selectedProductIds.map(id => 
          fetch(`/api/admin/products/${id}`, {
            method: "DELETE",
            headers: {
              "x-admin-key": ADMIN_KEY,
            },
          })
        )
      );
      
      // Update UI by removing the deleted products
      setProducts(products.filter(product => !selectedProductIds.includes(product.id)));
      
      // Reset selections
      setSelectedProductIds([]);
      setIsBulkDeleteDialogOpen(false);
      
      toast({
        title: "Success",
        description: `${selectedProductIds.length} products have been deleted successfully.`,
      });
    } catch (error) {
      console.error("Error deleting products:", error);
      toast({
        title: "Error",
        description: "Failed to delete one or more products. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCheckboxChange = (productId: number, checked: boolean) => {
    if (checked) {
      setSelectedProductIds([...selectedProductIds, productId]);
    } else {
      setSelectedProductIds(selectedProductIds.filter(id => id !== productId));
    }
  };

  const handleSelectAllChange = (checked: boolean) => {
    if (checked) {
      const allProductIds = filteredProducts.map(product => product.id);
      setSelectedProductIds(allProductIds);
    } else {
      setSelectedProductIds([]);
    }
  };

  const bulkSetFeatured = async (featured: boolean) => {
    try {
      // Execute update operations in parallel
      await Promise.all(
        selectedProductIds.map(id => 
          fetch(`/api/admin/products/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "x-admin-key": ADMIN_KEY,
            },
            body: JSON.stringify({ featured }),
          })
        )
      );
      
      // Update products in the UI
      setProducts(products.map(p => 
        selectedProductIds.includes(p.id) 
          ? { ...p, featured } 
          : p
      ));
      
      // Reset selections
      setSelectedProductIds([]);
      
      toast({
        title: "Success",
        description: `${selectedProductIds.length} products have been ${featured ? 'featured' : 'unfeatured'}.`,
      });
    } catch (error) {
      console.error("Error updating products:", error);
      toast({
        title: "Error",
        description: "Failed to update products. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filtering and sorting logic
  const filteredProducts = useMemo(() => {
    return products
      .filter(product => {
        const matchesSearch = searchQuery === "" || 
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCategory = categoryFilter === "" || categoryFilter === "all" || 
          product.category === categoryFilter;
        
        const matchesFeatured = featuredFilter === "" || featuredFilter === "all" || 
          (featuredFilter === "featured" && product.featured) ||
          (featuredFilter === "not-featured" && !product.featured);
        
        const matchesStock = stockFilter === "" || stockFilter === "all" || 
          (stockFilter === "in-stock" && product.inStock) ||
          (stockFilter === "out-of-stock" && !product.inStock) ||
          (stockFilter === "low-stock" && 
            product.inStock && 
            product.stockQuantity !== null && 
            product.stockQuantity <= 5);
        
        return matchesSearch && matchesCategory && matchesFeatured && matchesStock;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "name-asc":
            return a.name.localeCompare(b.name);
          case "name-desc":
            return b.name.localeCompare(a.name);
          case "price-asc":
            return parseFloat(a.price) - parseFloat(b.price);
          case "price-desc":
            return parseFloat(b.price) - parseFloat(a.price);
          case "category":
            return a.category.localeCompare(b.category);
          case "date-asc":
            if (!a.createdAt && !b.createdAt) return 0;
            if (!a.createdAt) return 1;
            if (!b.createdAt) return -1;
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case "date-desc":
            if (!a.createdAt && !b.createdAt) return 0;
            if (!a.createdAt) return 1;
            if (!b.createdAt) return -1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          default:
            return 0;
        }
      });
  }, [products, searchQuery, categoryFilter, featuredFilter, stockFilter, sortBy]);

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    const categorySet = new Set(products.map(p => p.category));
    return Array.from(categorySet);
  }, [products]);

  return (
    <Layout>
      <motion.div 
        className="container mx-auto py-8 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 mt-16 md:mt-20">
          <motion.h1 
            className="text-3xl font-bold text-green-800"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Admin Dashboard
          </motion.h1>
          <div className="flex space-x-4 mt-4 md:mt-0 z-10">
            <Button variant="outline" asChild>
              <Link href="/admin/products/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => {
                sessionStorage.removeItem("adminAuthenticated");
                sessionStorage.removeItem("adminSessionId");
                window.location.href = "/admin/login";
                toast({
                  title: "Logged out successfully",
                  description: "You have been logged out of the admin area",
                });
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Tabs defaultValue="products" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full max-w-md mb-8">
              <TabsTrigger value="products" className="flex items-center">
                <ShoppingBag className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Products</span>
              </TabsTrigger>
              <TabsTrigger value="contacts" className="flex items-center">
                <MessageSquare className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Contacts</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Stats</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <CardTitle>Products Management</CardTitle>
                  <CardDescription>
                    Manage your products, update details, and control visibility.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
                    </div>
                  ) : (
                    <>
                      {/* Filters and Search */}
                      <div className="mb-6 space-y-4">
                        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                          <div className="flex-1">
                            <div className="relative">
                              <Input
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                              />
                              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  fill="none" 
                                  viewBox="0 0 24 24" 
                                  strokeWidth={1.5} 
                                  stroke="currentColor" 
                                  className="w-5 h-5"
                                >
                                  <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" 
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Select 
                              value={categoryFilter} 
                              onValueChange={(value) => setCategoryFilter(value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Select
                              value={featuredFilter}
                              onValueChange={(value) => setFeaturedFilter(value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Featured" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Products</SelectItem>
                                <SelectItem value="featured">Featured</SelectItem>
                                <SelectItem value="not-featured">Not Featured</SelectItem>
                              </SelectContent>
                            </Select>

                            <Select
                              value={stockFilter}
                              onValueChange={(value) => setStockFilter(value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Stock" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Stock</SelectItem>
                                <SelectItem value="in-stock">In Stock</SelectItem>
                                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                                <SelectItem value="low-stock">Low Stock (≤5)</SelectItem>
                              </SelectContent>
                            </Select>

                            <Select
                              value={sortBy}
                              onValueChange={(value) => setSortBy(value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sort By" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                                <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                                <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                                <SelectItem value="category">Category</SelectItem>
                                <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                                <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Bulk Actions */}
                        {selectedProductIds.length > 0 && (
                          <div className="flex items-center space-x-4 bg-muted p-3 rounded-md">
                            <span className="text-sm font-medium">
                              {selectedProductIds.length} selected
                            </span>
                            <div className="flex-1"></div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Bulk Actions <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => bulkSetFeatured(true)}>
                                  <Tag className="mr-2 h-4 w-4" />
                                  <span>Set Featured</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => bulkSetFeatured(false)}>
                                  <Tag className="mr-2 h-4 w-4" />
                                  <span>Unset Featured</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600" 
                                  onClick={() => setIsBulkDeleteDialogOpen(true)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Delete Selected</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </div>

                      {/* Products Table */}
                      {filteredProducts.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No products found with the selected filters.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableCaption>
                              Showing {filteredProducts.length} of {products.length} total products.
                            </TableCaption>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12">
                                  <Checkbox 
                                    checked={
                                      filteredProducts.length > 0 && 
                                      selectedProductIds.length === filteredProducts.length
                                    }
                                    onCheckedChange={handleSelectAllChange}
                                  />
                                </TableHead>
                                <TableHead>Image</TableHead>
                                <TableHead>Product Information</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredProducts.map((product) => (
                                <TableRow key={product.id}>
                                  <TableCell>
                                    <Checkbox 
                                      checked={selectedProductIds.includes(product.id)}
                                      onCheckedChange={(checked) => 
                                        handleCheckboxChange(product.id, checked === true)
                                      }
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <img 
                                      src={product.imageUrl} 
                                      alt={product.name} 
                                      className="w-16 h-16 object-cover rounded"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://placehold.co/300x300?text=No+Image";
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-1">
                                      <div className="font-medium">{product.name}</div>
                                      <div className="text-sm text-muted-foreground">
                                        Category: {product.category}
                                      </div>
                                      <div className="text-sm text-muted-foreground truncate max-w-xs">
                                        {product.shortDescription}
                                      </div>
                                      {product.badge && (
                                        <Badge variant="outline" className="mt-1">
                                          {product.badge}
                                        </Badge>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-1">
                                      <div className="font-medium">₹{formatPrice(product.price)}</div>
                                      {product.comparePrice && (
                                        <div className="text-sm line-through text-muted-foreground">
                                          ₹{formatPrice(product.comparePrice)}
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm">
                                      {product.createdAt ? 
                                        new Date(product.createdAt).toLocaleString('en-US', {
                                          year: 'numeric', 
                                          month: 'short', 
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        }) : 'N/A'}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-2">
                                      <div className="flex items-center space-x-2">
                                        <Button 
                                          variant={product.featured ? "default" : "outline"} 
                                          size="sm"
                                          onClick={() => toggleProductFeatured(product)}
                                          className="h-8 px-2"
                                        >
                                          {product.featured ? (
                                            <>
                                              <Check className="mr-1 h-3 w-3" />
                                              Featured
                                            </>
                                          ) : (
                                            <>
                                              <X className="mr-1 h-3 w-3" />
                                              Not Featured
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                      <div className="flex items-center">
                                        <Badge 
                                          variant={product.inStock ? "outline" : "destructive"}
                                          className="h-7"
                                        >
                                          {product.inStock ? (
                                            <span className="flex items-center">
                                              <Check className="mr-1 h-3 w-3" />
                                              In Stock
                                              {product.stockQuantity !== null && (
                                                <span className="ml-1">
                                                  ({product.stockQuantity})
                                                </span>
                                              )}
                                            </span>
                                          ) : (
                                            <span className="flex items-center">
                                              <X className="mr-1 h-3 w-3" />
                                              Out of Stock
                                            </span>
                                          )}
                                        </Badge>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreHorizontal className="h-4 w-4" />
                                          <span className="sr-only">Actions</span>
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem asChild>
                                          <Link href={`/admin/products/${product.id}`}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            <span>Edit</span>
                                          </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => toggleProductFeatured(product)}
                                        >
                                          <Tag className="mr-2 h-4 w-4" />
                                          <span>
                                            {product.featured ? "Remove from Featured" : "Add to Featured"}
                                          </span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => toggleProductInStock(product)}
                                        >
                                          <PackageCheck className="mr-2 h-4 w-4" />
                                          <span>
                                            {product.inStock ? "Mark Out of Stock" : "Mark In Stock"}
                                          </span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-red-600"
                                          onClick={() => {
                                            setSelectedProduct(product);
                                            setIsDeleteDialogOpen(true);
                                          }}
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          <span>Delete</span>
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="contacts">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Messages</CardTitle>
                  <CardDescription>
                    View and manage customer inquiries and messages.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {contacts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No contact messages found.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {contacts.map((contact) => (
                        <Card key={contact.id}>
                          <CardHeader>
                            <div className="flex justify-between">
                              <div>
                                <CardTitle>{contact.name}</CardTitle>
                                <CardDescription>
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center">
                                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                      </svg>
                                      {contact.email}
                                    </div>
                                    <div className="flex items-center">
                                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                      </svg>
                                      <a href={`tel:${contact.phone}`} className="hover:text-green-600 transition-colors">
                                        {formatPhoneNumber(contact.phone)}
                                      </a>
                                    </div>
                                  </div>
                                </CardDescription>
                              </div>
                              <div className="text-sm text-gray-500">
                                {contact.createdAt ? 
                                  new Date(contact.createdAt).toLocaleString('en-US', {
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : ''}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="whitespace-pre-line">{contact.message}</p>
                          </CardContent>
                          <CardFooter className="flex justify-end">
                            <Button variant="outline" asChild>
                              <a href={`mailto:${contact.email}`}>Reply</a>
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="stats">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Store Statistics</CardTitle>
                    <CardDescription>
                      Key metrics and performance indicators for your store
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardDescription className="flex items-center">
                            <ShoppingBag className="mr-2 h-4 w-4 text-muted-foreground" />
                            Total Products
                          </CardDescription>
                          <CardTitle className="text-3xl">{products.length}</CardTitle>
                        </CardHeader>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardDescription className="flex items-center">
                            <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                            Featured Products
                          </CardDescription>
                          <CardTitle className="text-3xl">
                            {products.filter(p => p.featured).length}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardDescription className="flex items-center">
                            <PackageCheck className="mr-2 h-4 w-4 text-muted-foreground" />
                            In Stock Products
                          </CardDescription>
                          <CardTitle className="text-3xl">
                            {products.filter(p => p.inStock).length}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardDescription className="flex items-center">
                            <MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                            Contact Messages
                          </CardDescription>
                          <CardTitle className="text-3xl">{contacts.length}</CardTitle>
                        </CardHeader>
                      </Card>
                    </div>

                    <div className="mt-8">
                      <h3 className="text-lg font-medium mb-4">Product Categories</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categories.map(category => {
                          const count = products.filter(p => p.category === category).length;
                          const percentage = Math.round((count / products.length) * 100);
                          
                          return (
                            <div key={category} className="bg-card rounded-lg p-4 border">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium">{category}</h4>
                                <Badge variant="outline">{count} products</Badge>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2.5">
                                <div 
                                  className="bg-primary h-2.5 rounded-full" 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <p className="text-sm text-muted-foreground mt-2">{percentage}% of total products</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Inventory Status</CardTitle>
                    <CardDescription>
                      Monitoring product stock levels
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Out of Stock */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-sm font-medium flex items-center">
                            <AlertTriangle className="mr-2 h-4 w-4 text-destructive" />
                            Out of Stock
                          </h3>
                          <Badge variant="destructive">
                            {products.filter(p => !p.inStock).length} products
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {products.filter(p => !p.inStock).slice(0, 3).map(product => (
                            <div key={product.id} className="flex items-center justify-between bg-card p-2 rounded-md border">
                              <div className="flex items-center">
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.name} 
                                  className="w-8 h-8 rounded-md mr-2 object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "https://placehold.co/300x300?text=No+Image";
                                  }}
                                />
                                <span className="text-sm truncate max-w-[150px]">{product.name}</span>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8"
                                onClick={() => toggleProductInStock(product)}
                              >
                                Restock
                              </Button>
                            </div>
                          ))}
                          {products.filter(p => !p.inStock).length > 3 && (
                            <Button variant="link" className="text-xs" asChild>
                              <Link href="/admin/products?stock=out-of-stock">
                                View all out of stock products
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Low Stock */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-sm font-medium flex items-center">
                            <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
                            Low Stock (≤5)
                          </h3>
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                            {products.filter(p => 
                              p.inStock && 
                              p.stockQuantity !== null && 
                              p.stockQuantity <= 5
                            ).length} products
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {products.filter(p => 
                            p.inStock && 
                            p.stockQuantity !== null && 
                            p.stockQuantity <= 5
                          ).slice(0, 3).map(product => (
                            <div key={product.id} className="flex items-center justify-between bg-card p-2 rounded-md border">
                              <div className="flex items-center">
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.name} 
                                  className="w-8 h-8 rounded-md mr-2 object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "https://placehold.co/300x300?text=No+Image";
                                  }}
                                />
                                <span className="text-sm truncate max-w-[150px]">
                                  {product.name}
                                  <span className="text-xs text-muted-foreground ml-1">
                                    ({product.stockQuantity} left)
                                  </span>
                                </span>
                              </div>
                              <Link href={`/admin/products/${product.id}`}>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="h-8"
                                >
                                  Update
                                </Button>
                              </Link>
                            </div>
                          ))}
                          {products.filter(p => 
                            p.inStock && 
                            p.stockQuantity !== null && 
                            p.stockQuantity <= 5
                          ).length > 3 && (
                            <Button variant="link" className="text-xs" asChild>
                              <Link href="/admin/products?stock=low-stock">
                                View all low stock products
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Recently Added */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-sm font-medium">Recent Products</h3>
                        </div>
                        <div className="space-y-2">
                          {[...products]
                            .sort((a, b) => {
                              if (!a.createdAt && !b.createdAt) return 0;
                              if (!a.createdAt) return 1;
                              if (!b.createdAt) return -1;
                              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                            })
                            .slice(0, 3)
                            .map(product => (
                              <div key={product.id} className="flex items-center justify-between bg-card p-2 rounded-md border">
                                <div className="flex items-center">
                                  <img 
                                    src={product.imageUrl} 
                                    alt={product.name} 
                                    className="w-8 h-8 rounded-md mr-2 object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "https://placehold.co/300x300?text=No+Image";
                                    }}
                                  />
                                  <span className="text-sm truncate max-w-[150px]">{product.name}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {product.createdAt ? 
                                    new Date(product.createdAt).toLocaleString('en-US', {
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    }) : ''}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the product
              "{selectedProduct?.name}" from your store.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedProduct && deleteProduct(selectedProduct.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Multiple Products</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete {selectedProductIds.length} products
              from your store.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={bulkDeleteProducts}
            >
              Delete {selectedProductIds.length} Products
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}