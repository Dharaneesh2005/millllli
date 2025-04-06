import { useState, useEffect } from "react";
import { useLocation, useParams, useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Loader2, 
  Plus, 
  X, 
  FileImage,
  Star, 
  ShoppingCart,
  Info,
  Settings,
  ImageIcon,
  Weight,
  Utensils, 
  Leaf
} from "lucide-react";
import { insertProductSchema, type Product } from "@shared/schema";
import { z } from "zod";

// The admin key - in a real app, this would be retrieved securely
// Get admin key from environment variable or use fallback for local development
const ADMIN_KEY = import.meta.env.VITE_ADMIN_SECRET || "admin-secret";

// Extended schema with validation
const productFormSchema = insertProductSchema.extend({
  // Make optional fields required for the form
  shortDescription: z.string().min(10, "Short description must be at least 10 characters"),
  imageUrl: z.string().url("Please enter a valid image URL"),
  // Add validation to existing fields
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid number"),
  // Add slug field with validation
  slug: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

// For review management, we'll use a local type
interface ReviewItem {
  id: string;
  name: string;
  avatar?: string;
  date: string;
  rating: number;
  comment: string;
  helpfulCount: number;
}

export default function ProductForm() {
  const [_, navigate] = useLocation();
  const [__, params] = useRoute<{ id: string }>("/admin/products/:id");
  const isEditMode = params?.id && params.id !== "new";
  const productId = isEditMode ? parseInt(params?.id || "0") : null;
  
  const { toast } = useToast();
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  
  // Review management state
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [editingReview, setEditingReview] = useState<ReviewItem | null>(null);
  const [editReviewIndex, setEditReviewIndex] = useState<number>(-1);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      shortDescription: "",
      price: "",
      comparePrice: "",
      badge: "",
      category: "organic",
      imageUrl: "",
      imageGallery: [],
      inStock: true,
      stockQuantity: 0,
      featured: false,
      nutritionFacts: "",
      cookingInstructions: "",
      rating: "",
      reviewCount: 0,
      weightOptions: [],
      slug: "",
      reviews: "",
    },
  });

  // Load reviews when form data changes
  useEffect(() => {
    const reviewsStr = form.watch("reviews");
    if (reviewsStr) {
      try {
        setReviews(JSON.parse(reviewsStr));
      } catch (e) {
        console.error("Error parsing reviews:", e);
        setReviews([]);
      }
    } else {
      setReviews([]);
    }
  }, [form.watch("reviews")]);

  // Update form when reviews change
  useEffect(() => {
    form.setValue("reviews", JSON.stringify(reviews));
  }, [reviews, form]);

  useEffect(() => {
    if (isEditMode && productId) {
      fetchProduct(productId);
    }
  }, [isEditMode, productId]);

  const fetchProduct = async (id: number) => {
    try {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) throw new Error("Failed to fetch product");
      
      const product = await response.json();
      
      // Map API data to form values
      form.reset({
        name: product.name,
        description: product.description,
        shortDescription: product.shortDescription || "",
        price: product.price,
        comparePrice: product.comparePrice || "",
        badge: product.badge || "",
        category: product.category,
        imageUrl: product.imageUrl,
        imageGallery: product.imageGallery || [],
        inStock: product.inStock === true,
        stockQuantity: product.stockQuantity || 0,
        featured: product.featured === true,
        nutritionFacts: product.nutritionFacts || "",
        cookingInstructions: product.cookingInstructions || "",
        rating: product.rating || "",
        reviewCount: product.reviewCount || 0,
        weightOptions: product.weightOptions || [],
        slug: product.slug || "",
        reviews: product.reviews || "[]",
      });
    } catch (error) {
      console.error("Error fetching product:", error);
      toast({
        title: "Error",
        description: "Failed to load product details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = () => {
    const newReview: ReviewItem = {
      id: Date.now().toString(),
      name: "",
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      rating: 5,
      comment: "",
      helpfulCount: 0
    };
    setEditingReview(newReview);
    setEditReviewIndex(-1);
  };
  
  const handleEditReview = (review: ReviewItem, index: number) => {
    setEditingReview({ ...review });
    setEditReviewIndex(index);
  };
  
  const handleDeleteReview = (index: number) => {
    const updatedReviews = [...reviews];
    updatedReviews.splice(index, 1);
    setReviews(updatedReviews);
  };
  
  const handleSaveReview = () => {
    if (!editingReview) return;
    
    const updatedReviews = [...reviews];
    if (editReviewIndex >= 0) {
      // Update existing review
      updatedReviews[editReviewIndex] = editingReview;
    } else {
      // Add new review
      updatedReviews.push(editingReview);
    }
    
    setReviews(updatedReviews);
    setEditingReview(null);
    setEditReviewIndex(-1);
  };
  
  const handleCancelEdit = () => {
    setEditingReview(null);
    setEditReviewIndex(-1);
  };

  const onSubmit = async (data: ProductFormValues) => {
    setSubmitting(true);
    try {
      // Ensure imageGallery is an array with at least the main image
      if (!data.imageGallery || !data.imageGallery.length) {
        data.imageGallery = [data.imageUrl];
      }
      
      // Generate slug from product name if not editing an existing product
      if (!isEditMode) {
        // Generate a slug from the product name (convert to lowercase, replace spaces with hyphens)
        const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        data = { ...data, slug };
      }
      
      // Calculate the actual review count based on the reviews array
      let actualReviewCount = 0;
      if (data.reviews) {
        try {
          const reviewsArray = JSON.parse(data.reviews);
          if (Array.isArray(reviewsArray)) {
            actualReviewCount = reviewsArray.length;
          }
        } catch (e) {
          console.error("Error parsing reviews:", e);
        }
      }
      
      // Update the reviewCount to match the actual number of reviews
      data = { ...data, reviewCount: actualReviewCount };

      const url = isEditMode
        ? `/api/admin/products/${productId}`
        : "/api/admin/products";
      
      const method = isEditMode ? "PUT" : "POST";
      
      console.log("Submitting product data:", data);
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": ADMIN_KEY,
        },
        body: JSON.stringify(data),
      });
      
      const responseData = await response.json();
      console.log("Response:", response.status, responseData);
      
      if (!response.ok) {
        let errorMessage = `Failed to ${isEditMode ? "update" : "create"} product`;
        if (responseData && responseData.error) {
          errorMessage += `: ${responseData.error}`;
        } else if (responseData && responseData.message) {
          errorMessage += `: ${responseData.message}`;
        }
        throw new Error(errorMessage);
      }
      
      const savedProduct = responseData;
      
      toast({
        title: "Success",
        description: `Product ${isEditMode ? "updated" : "created"} successfully!`,
      });
      
      // Navigate back to dashboard
      navigate("/admin");
    } catch (error) {
      console.error(`Error ${isEditMode ? "updating" : "creating"} product:`, error);
      let errorMessage = `Failed to ${isEditMode ? "update" : "create"} product.`;
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </Layout>
    );
  }

  const categories = [
    { value: "organic", label: "Organic" },
    { value: "mixed", label: "Mixed" },
    { value: "specialty", label: "Specialty" },
    { value: "flour", label: "Flour" },
    { value: "other", label: "Other" },
  ];

  return (
    <Layout>
      <motion.div 
        className="container mx-auto py-8 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6">
          <Button variant="ghost" className="mb-4" asChild>
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-green-800">
            {isEditMode ? "Edit Product" : "Add New Product"}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isEditMode ? "Edit Product Details" : "Enter Product Details"}</CardTitle>
            <CardDescription>
              Fill out the form below to {isEditMode ? "update the" : "create a new"} product.
              Fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information Section */}
                  <div className="space-y-6 md:col-span-2">
                    <h2 className="text-xl font-semibold">Basic Information</h2>
                    
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Organic Foxtail Millet" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="shortDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Short Description *</FormLabel>
                          <FormControl>
                            <Input placeholder="A brief description for product listings" {...field} />
                          </FormControl>
                          <FormDescription>
                            This will be shown in product cards and listings.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Description *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Detailed product description with key features and benefits" 
                              className="min-h-32"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Pricing Section */}
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Pricing</h2>
                    
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (₹) *</FormLabel>
                          <FormControl>
                            <Input placeholder="299" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="comparePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Compare at Price (₹)</FormLabel>
                          <FormControl>
                            <Input placeholder="350" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormDescription>
                            Original price for showing discounts. Leave empty if not on sale.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="badge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Badge Text</FormLabel>
                          <FormControl>
                            <Input placeholder="New / Organic / Sale" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormDescription>
                            Optional badge to display on the product (e.g., "New", "Sale", "Organic")
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Categorization and Visibility */}
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Categorization & Visibility</h2>
                    
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map(category => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL Slug</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="product-url-slug" 
                              {...field} 
                              value={field.value || ""}
                              disabled={!isEditMode} // Only allow editing for existing products
                            />
                          </FormControl>
                          <FormDescription>
                            {isEditMode 
                              ? "Unique identifier for product URL. Edit with caution as it affects links."
                              : "Will be automatically generated from product name."}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="featured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value === true}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Featured Product</FormLabel>
                            <FormDescription>
                              Display this product on the homepage
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="inStock"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value === true}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>In Stock</FormLabel>
                            <FormDescription>
                              Is this product currently available for purchase?
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="stockQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Quantity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              placeholder="0" 
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                              value={field.value || 0}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Image Section */}
                  <div className="space-y-6 md:col-span-2">
                    <h2 className="text-xl font-semibold">Images</h2>
                    
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Main Product Image URL *</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/image.jpg" {...field} />
                          </FormControl>
                          <FormDescription>
                            URL to the main product image
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="imageGallery"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Image Gallery URLs</FormLabel>
                          <FormControl>
                            <div className="space-y-3">
                              {field.value && field.value.length > 0 ? (
                                <div className="space-y-2">
                                  {field.value.map((imgUrl, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                      <Input 
                                        value={imgUrl} 
                                        onChange={(e) => {
                                          const currentValues = Array.isArray(field.value) ? field.value : [];
                                          const newGallery = [...currentValues];
                                          newGallery[index] = e.target.value;
                                          field.onChange(newGallery);
                                        }}
                                        placeholder={`Image URL ${index + 1}`}
                                      />
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        type="button"
                                        onClick={() => {
                                          const currentValues = Array.isArray(field.value) ? field.value : [];
                                          const newGallery = [...currentValues];
                                          newGallery.splice(index, 1);
                                          field.onChange(newGallery);
                                        }}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => {
                                  const currentGallery = Array.isArray(field.value) ? field.value : [];
                                  field.onChange([...currentGallery, ""]);
                                }}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Image URL
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Additional Information Section */}
                  <div className="space-y-6 md:col-span-2">
                    <h2 className="text-xl font-semibold">Additional Information</h2>
                    
                    <FormField
                      control={form.control}
                      name="nutritionFacts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nutrition Facts</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder='{"calories": "350 kcal", "protein": "12g", "carbohydrates": "70g", "fat": "2g", "fiber": "8g"}' 
                              className="font-mono text-sm"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter nutrition information in JSON format.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cookingInstructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cooking Instructions</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Step-by-step cooking instructions for this product." 
                              className="min-h-32"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-base">Product Reviews</FormLabel>
                      </div>
                      
                      <Card className="border">
                        <CardContent className="pt-6">
                          {editingReview ? (
                            // Edit/Add Review Form
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="reviewName">Customer Name</Label>
                                  <Input 
                                    id="reviewName" 
                                    value={editingReview.name}
                                    onChange={(e) => setEditingReview({...editingReview, name: e.target.value})}
                                    placeholder="Customer name"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="reviewAvatar">Avatar URL (optional)</Label>
                                  <Input 
                                    id="reviewAvatar" 
                                    value={editingReview.avatar || ''}
                                    onChange={(e) => setEditingReview({...editingReview, avatar: e.target.value})}
                                    placeholder="https://example.com/avatar.jpg"
                                  />
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="reviewDate">Review Date</Label>
                                  <Input 
                                    id="reviewDate" 
                                    value={editingReview.date}
                                    onChange={(e) => setEditingReview({...editingReview, date: e.target.value})}
                                    placeholder="April 1, 2023"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="reviewRating">Rating (1-5)</Label>
                                  <div className="flex items-center space-x-4">
                                    {[1, 2, 3, 4, 5].map((rating) => (
                                      <Button 
                                        key={rating}
                                        type="button"
                                        variant={editingReview.rating >= rating ? "default" : "outline"}
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => setEditingReview({...editingReview, rating})}
                                      >
                                        {rating}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="reviewComment">Review Comment</Label>
                                <Textarea 
                                  id="reviewComment" 
                                  value={editingReview.comment}
                                  onChange={(e) => setEditingReview({...editingReview, comment: e.target.value})}
                                  placeholder="Customer review comment"
                                  className="min-h-20"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="helpfulCount">Helpful Count</Label>
                                <Input 
                                  id="helpfulCount" 
                                  type="number" 
                                  min="0"
                                  value={editingReview.helpfulCount}
                                  onChange={(e) => setEditingReview({...editingReview, helpfulCount: parseInt(e.target.value) || 0})}
                                />
                              </div>
                              
                              <div className="flex justify-end space-x-2 pt-2">
                                <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                                <Button onClick={handleSaveReview}>Save Review</Button>
                              </div>
                            </div>
                          ) : (
                            // Reviews List
                            <div className="space-y-4">
                              {reviews.length === 0 ? (
                                <div className="text-center py-6 text-muted-foreground">
                                  No reviews yet. Add your first review!
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {reviews.map((review, index) => (
                                    <div key={review.id} className="flex items-start justify-between border-b pb-4">
                                      <div className="space-y-1">
                                        <div className="flex items-center space-x-2">
                                          <span className="font-medium">{review.name}</span>
                                          <span className="text-muted-foreground text-sm">{review.date}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                          {Array.from({ length: 5 }).map((_, i) => (
                                            <Star 
                                              key={i} 
                                              className={`h-4 w-4 ${i < review.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`} 
                                            />
                                          ))}
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{review.comment}</p>
                                      </div>
                                      <div className="flex space-x-2">
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => handleEditReview(review, index)}
                                        >
                                          Edit
                                        </Button>
                                        <Button 
                                          variant="destructive" 
                                          size="sm"
                                          onClick={() => handleDeleteReview(index)}
                                        >
                                          Delete
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              <div className="flex justify-center pt-2">
                                <Button 
                                  onClick={handleAddReview}
                                  className="w-full"
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add Review
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    <FormField
                      control={form.control}
                      name="weightOptions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight Options</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="250g, 500g, 1kg (comma separated)" 
                              {...field}
                              value={(field.value || []).join(", ")}
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(value.split(",").map(option => option.trim()).filter(Boolean));
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter comma-separated weight options (e.g., "250g, 500g, 1kg")
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4">
                  <Button variant="outline" type="button" asChild>
                    <Link href="/admin">Cancel</Link>
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="min-w-[120px]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      isEditMode ? "Update Product" : "Create Product"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
}