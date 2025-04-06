import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useTranslation } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import ProductCard from "@/components/ProductCard";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Product, ProductReview } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function ProductDetail() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const { toast } = useToast();
  
  // State for quantity, selected weight and active tab
  const [quantity, setQuantity] = useState(1);
  const [selectedWeight, setSelectedWeight] = useState("1kg");
  const [activeTab, setActiveTab] = useState("description");
  const [mainImage, setMainImage] = useState("");
  
  // Fetch product details
  const { data: product, isLoading } = useQuery<Product>({
    queryKey: [`/api/products/slug/${slug}`],
  });
  
  // State for reviews
  const [productReviews, setProductReviews] = useState<ProductReview[]>([]);
  
  // Parse reviews from product data
  useEffect(() => {
    if (product?.reviews) {
      try {
        const parsedReviews = JSON.parse(product.reviews);
        setProductReviews(Array.isArray(parsedReviews) ? parsedReviews : []);
      } catch (e) {
        console.error("Failed to parse reviews:", e);
        setProductReviews([]);
      }
    } else {
      setProductReviews([]);
    }
  }, [product]);
  
  // Handle marking a review as helpful
  const markReviewHelpful = useMutation({
    mutationFn: async (reviewId: string) => {
      if (!product) return;
      
      // Find the review and increment helpfulCount
      const updatedReviews = productReviews.map(review => 
        review.id === reviewId 
          ? { ...review, helpfulCount: (review.helpfulCount || 0) + 1 }
          : review
      );
      
      // Update local state immediately for better UX
      setProductReviews(updatedReviews);
      
      // Send the updated reviews to the server
      await apiRequest("PATCH", `/api/products/${product.id}`, {
        reviews: JSON.stringify(updatedReviews)
      });
      
      return updatedReviews;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/slug/${slug}`] });
      toast({
        title: "Thank you for your feedback",
        description: "Your vote has been counted.",
      });
    },
    onError: (error) => {
      // Revert local state if there was an error
      if (product?.reviews) {
        try {
          const parsedReviews = JSON.parse(product.reviews);
          setProductReviews(Array.isArray(parsedReviews) ? parsedReviews : []);
        } catch (e) {
          console.error("Failed to revert reviews:", e);
        }
      }
      
      toast({
        title: "Failed to mark review as helpful",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Fetch related products
  const { data: allProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  
  // Get related products (same category but different product)
  const relatedProducts = allProducts
    ?.filter(p => p.category === product?.category && p.id !== product?.id)
    .slice(0, 4);
  
  // Set main image when product data is loaded
  useEffect(() => {
    if (product && product.imageUrl) {
      setMainImage(product.imageUrl);
    }
  }, [product]);
  
  // Handle clicking on gallery thumbnail
  const handleImageClick = (image: string) => {
    setMainImage(image);
  };
  
  // Set page title
  useEffect(() => {
    if (product) {
      document.title = `${product.name} - Millikit`;
    }
  }, [product]);
  
  // Handle quantity change
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };
  
  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };
  
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1) {
      setQuantity(value);
    } else {
      setQuantity(1);
    }
  };
  
  // Handle add to cart
  const handleAddToCart = () => {
    if (product) {
      addToCart(product.id, quantity);
    }
  };
  
  // Handle buy now
  const handleBuyNow = () => {
    if (product) {
      addToCart(product.id, quantity);
      window.location.href = "/checkout";
    }
  };
  
  // Change main image
  const changeMainImage = (src: string) => {
    setMainImage(src);
  };
  
  // Parse nutrition facts if available
  let nutritionFacts = null;
  if (product?.nutritionFacts) {
    try {
      // Try to parse it as JSON
      nutritionFacts = JSON.parse(product.nutritionFacts);
    } catch (e) {
      // If it's not valid JSON, use it as plain text
      nutritionFacts = { text: product.nutritionFacts };
    }
  }
  
  if (isLoading) {
    return (
      <div className="pt-28 flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="pt-28 container mx-auto px-6 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Product not found</h2>
        <p className="mt-4 text-gray-600">The product you are looking for does not exist.</p>
        <Link href="/products" className="mt-6 inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
          Browse Products
        </Link>
      </div>
    );
  }
  
  return (
    <>
      {/* Breadcrumb */}
      <section className="pt-28 pb-6 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-green-600 transition-colors">
              {t('home')}
            </Link>
            <span className="text-gray-400">/</span>
            <Link href="/products" className="text-gray-500 hover:text-green-600 transition-colors">
              {t('products')}
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-green-600">{product.name}</span>
          </div>
        </div>
      </section>
      
      {/* Product Detail */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div>
              <div className="mb-4">
                <img 
                  src={mainImage} 
                  alt={product.name} 
                  className="w-full h-96 object-cover rounded-xl shadow-md"
                />
              </div>
              <div className="product-image-gallery grid grid-cols-4 gap-2">
                {/* Main product image thumbnail */}
                <img 
                  src={product.imageUrl} 
                  alt={`${product.name} - Main`} 
                  className={`w-full h-24 object-cover rounded-lg border-2 cursor-pointer ${
                    mainImage === product.imageUrl ? 'border-green-500' : 'border-transparent'
                  }`}
                  onClick={() => handleImageClick(product.imageUrl)}
                />
                
                {/* Additional gallery images */}
                {product.imageGallery?.map((img, index) => (
                  <img 
                    key={index}
                    src={img} 
                    alt={`${product.name} - Image ${index + 1}`} 
                    className={`w-full h-24 object-cover rounded-lg border-2 cursor-pointer ${
                      mainImage === img ? 'border-green-500' : 'border-transparent'
                    }`}
                    onClick={() => handleImageClick(img)}
                  />
                ))}
              </div>
            </div>
            
            {/* Product Info */}
            <div>
              <div className="flex items-center mb-4">
                {product.badge && (
                  <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {product.badge}
                  </span>
                )}
                <div className="star-rating ml-4">
                  {[...Array(5)].map((_, i) => (
                    <i 
                      key={i} 
                      className={`fa${i < Math.floor(Number(product.rating || 0)) ? 's' : 
                                  i < Math.ceil(Number(product.rating || 0)) && i >= Math.floor(Number(product.rating || 0)) ? 's fa-star-half-alt' : 'r'} fa-star`}
                    ></i>
                  ))}
                  <span className="text-gray-500 text-sm ml-2">({product.reviewCount || 0} {t('reviews')})</span>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>
              <p className="text-gray-600 mb-6">{product.shortDescription}</p>
              
              <div className="flex items-baseline mb-6">
                <span className="text-3xl font-bold text-green-600 mr-2">₹{product.price}</span>
                {product.comparePrice && (
                  <>
                    <span className="text-gray-500 line-through">₹{product.comparePrice}</span>
                    <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                      Save {Math.round((1 - (parseFloat(product.price) / parseFloat(product.comparePrice))) * 100)}%
                    </span>
                  </>
                )}
              </div>
              
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">{t('weight')}</h3>
                <div className="flex flex-wrap gap-2">
                  {["500g", "1kg", "2kg", "5kg"].map((weight) => (
                    <label key={weight} className="flex items-center">
                      <input 
                        type="radio" 
                        name="weight" 
                        value={weight} 
                        checked={selectedWeight === weight}
                        onChange={() => setSelectedWeight(weight)}
                        className="sr-only peer" 
                      />
                      <span className="px-4 py-2 border rounded-lg peer-checked:bg-green-50 peer-checked:border-green-500 cursor-pointer">
                        {weight}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center space-x-4">
                  <h3 className="text-sm font-medium text-gray-700">{t('quantity')}:</h3>
                  <div className="flex items-center border rounded-lg overflow-hidden">
                    <button 
                      className="px-3 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 focus:outline-none"
                      onClick={decreaseQuantity}
                    >-</button>
                    <input 
                      type="number" 
                      value={quantity}
                      onChange={handleQuantityChange}
                      min="1" 
                      className="w-12 text-center border-x py-2 focus:outline-none" 
                    />
                    <button 
                      className="px-3 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 focus:outline-none"
                      onClick={increaseQuantity}
                    >+</button>
                  </div>
                  <span className="text-green-600 text-sm">
                    {product.inStock 
                      ? `${t('inStock')} (${product.stockQuantity} ${t('items')})` 
                      : t('outOfStock')}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-4 mb-8">
                <button 
                  className="flex-1 bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                >
                  <i className="fas fa-shopping-cart mr-2"></i>
                  {t('addToCart')}
                </button>
                <button 
                  className="flex-1 bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleBuyNow}
                  disabled={!product.inStock}
                >
                  <i className="fas fa-bolt mr-2"></i>
                  {t('buyNow')}
                </button>
              </div>
              
              <div className="border-t pt-6">
                <div className="flex items-center space-x-8 mb-4">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <i className="fas fa-check-circle text-green-600"></i>
                    <span>100% Organic</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <i className="fas fa-truck text-green-600"></i>
                    <span>Free shipping over ₹1000</span>
                  </div>
                </div>
                <div className="flex items-center space-x-8">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <i className="fas fa-sync-alt text-green-600"></i>
                    <span>Easy 30-day returns</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <i className="fas fa-shield-alt text-green-600"></i>
                    <span>Secure payments</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Product Tabs */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-6">
          {/* Tabs Navigation */}
          <div className="border-b flex overflow-x-auto">
            <button
              onClick={() => setActiveTab("description")}
              className={`px-8 py-4 font-medium focus:outline-none ${
                activeTab === "description"
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-500 hover:text-green-600"
              }`}
            >
              {t('description')}
            </button>
            <button
              onClick={() => setActiveTab("nutrition")}
              className={`px-8 py-4 font-medium focus:outline-none ${
                activeTab === "nutrition"
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-500 hover:text-green-600"
              }`}
            >
              {t('nutritionFacts')}
            </button>
            <button
              onClick={() => setActiveTab("cooking")}
              className={`px-8 py-4 font-medium focus:outline-none ${
                activeTab === "cooking"
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-500 hover:text-green-600"
              }`}
            >
              {t('cookingInstructions')}
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`px-8 py-4 font-medium focus:outline-none ${
                activeTab === "reviews"
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-500 hover:text-green-600"
              }`}
            >
              {t('reviews')} ({product.reviewCount || 0})
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="py-6">
            {/* Description Tab */}
            <div className={`tab-content ${activeTab === "description" ? "active" : ""}`}>
              <div className="space-y-4">
                <p className="text-gray-700">{product.description}</p>
                
                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Benefits:</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>High in dietary fiber, helping with digestion and promoting a feeling of fullness</li>
                  <li>Rich in essential minerals including iron, calcium, and zinc</li>
                  <li>Contains antioxidants that fight free radicals and reduce oxidative stress</li>
                  <li>Good source of protein, making it an excellent grain choice for vegetarians</li>
                  <li>Gluten-free and suitable for those with celiac disease or gluten sensitivity</li>
                </ul>
                
                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Storage:</h3>
                <p className="text-gray-700">Store in a cool, dry place in an airtight container. For extended shelf life, refrigeration is recommended. Once opened, consume within 3-4 months for optimal taste and nutritional value.</p>
              </div>
            </div>
            
            {/* Nutrition Facts Tab */}
            <div className={`tab-content ${activeTab === "nutrition" ? "active" : ""}`}>
              {nutritionFacts ? (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Nutrition Facts</h3>
                  
                  {/* If nutritionFacts is just plain text */}
                  {nutritionFacts.text ? (
                    <div className="whitespace-pre-line">
                      <p>{nutritionFacts.text}</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 mb-4">Serving Size: {nutritionFacts.servingSize}</p>
                      
                      <div className="border-t pt-4">
                        <div className="flex justify-between border-b py-2">
                          <span className="font-medium">Calories</span>
                          <span>{nutritionFacts.calories} kcal</span>
                        </div>
                        <div className="flex justify-between border-b py-2">
                          <span className="font-medium">Total Fat</span>
                          <span>{nutritionFacts.totalFat}g</span>
                        </div>
                        <div className="flex justify-between border-b py-2 pl-6">
                          <span>Saturated Fat</span>
                          <span>{nutritionFacts.saturatedFat}g</span>
                        </div>
                        <div className="flex justify-between border-b py-2">
                          <span className="font-medium">Cholesterol</span>
                          <span>{nutritionFacts.cholesterol}mg</span>
                        </div>
                        <div className="flex justify-between border-b py-2">
                          <span className="font-medium">Sodium</span>
                          <span>{nutritionFacts.sodium}mg</span>
                        </div>
                        <div className="flex justify-between border-b py-2">
                          <span className="font-medium">Total Carbohydrate</span>
                          <span>{nutritionFacts.totalCarbohydrate}g</span>
                        </div>
                        <div className="flex justify-between border-b py-2 pl-6">
                          <span>Dietary Fiber</span>
                          <span>{nutritionFacts.dietaryFiber}g</span>
                        </div>
                        <div className="flex justify-between border-b py-2 pl-6">
                          <span>Sugars</span>
                          <span>{nutritionFacts.sugars}g</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="font-medium">Protein</span>
                          <span>{nutritionFacts.protein}g</span>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <h4 className="font-medium text-gray-800 mb-2">Vitamins & Minerals</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {nutritionFacts.vitamins && typeof nutritionFacts.vitamins === 'object' && 
                            Object.entries(nutritionFacts.vitamins as Record<string, string>).map(([name, value]) => (
                              <div key={name} className="flex justify-between">
                                <span>{name}</span>
                                <span>{value}</span>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-6">*Percent Daily Values (DV) are based on a 2,000 calorie diet. Your daily values may be higher or lower depending on your calorie needs.</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">Nutrition information is not available for this product.</p>
                </div>
              )}
            </div>
            
            {/* Cooking Instructions Tab */}
            <div className={`tab-content ${activeTab === "cooking" ? "active" : ""}`}>
              {product.cookingInstructions ? (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Basic Preparation</h3>
                    <p className="text-gray-700">{product.cookingInstructions}</p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Traditional Recipes</h3>
                    
                    <div className="mb-6">
                      <h4 className="font-medium text-green-700 mb-2">Thinai Pongal (Millet Sweet Pongal)</h4>
                      <p className="text-gray-700 mb-3">A traditional Tamil sweet dish made with foxtail millet, jaggery, ghee, and cardamom.</p>
                      <button 
                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                        onClick={() => {
                          const recipeDiv = document.getElementById('pongal-recipe');
                          if (recipeDiv) {
                            recipeDiv.classList.toggle('hidden');
                          }
                        }}
                      >
                        View Recipe <i className="fas fa-chevron-down ml-1"></i>
                      </button>
                      <div id="pongal-recipe" className="hidden mt-3 pl-4 border-l-2 border-green-200">
                        <h5 className="font-medium mb-2">Ingredients:</h5>
                        <ul className="list-disc pl-5 mb-3 text-gray-600 text-sm">
                          <li>1 cup Foxtail Millet</li>
                          <li>½ cup Moong Dal (Yellow Lentils)</li>
                          <li>1 cup Jaggery, grated</li>
                          <li>3 cups Water</li>
                          <li>4 tbsp Ghee</li>
                          <li>10-12 Cashews</li>
                          <li>1 tbsp Raisins</li>
                          <li>¼ tsp Cardamom powder</li>
                          <li>A pinch of Edible Camphor (optional)</li>
                        </ul>
                        
                        <h5 className="font-medium mb-2">Method:</h5>
                        <ol className="list-decimal pl-5 text-gray-600 text-sm">
                          <li>Dry roast moong dal until light golden and aromatic.</li>
                          <li>Wash foxtail millet and roasted moong dal thoroughly.</li>
                          <li>In a pressure cooker, add millet, dal, and 3 cups of water. Pressure cook for 3-4 whistles.</li>
                          <li>In a separate pan, melt jaggery with ¼ cup water to make a syrup.</li>
                          <li>Add the jaggery syrup to the cooked millet-dal mixture and mix well.</li>
                          <li>In another small pan, heat ghee and fry cashews and raisins until golden.</li>
                          <li>Add the ghee with fried nuts and cardamom powder to the pongal.</li>
                          <li>Mix well and serve hot.</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">Cooking instructions are not available for this product.</p>
                </div>
              )}
            </div>
            
            {/* Reviews Tab */}
            <div className={`tab-content ${activeTab === "reviews" ? "active" : ""}`}>
              <div className="space-y-8">
                {/* Review Summary */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-800">Customer Reviews</h3>
                    <button className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                      Write a Review
                    </button>
                  </div>
                  
                  <div className="flex items-center mt-4">
                    <div className="text-5xl font-bold text-gray-800 mr-4">{Number(product.rating || 0).toFixed(1)}</div>
                    <div>
                      <div className="star-rating text-xl">
                        {[...Array(5)].map((_, i) => (
                          <i 
                            key={i} 
                            className={`fa${i < Math.floor(Number(product.rating || 0)) ? 's' : 
                                      i < Math.ceil(Number(product.rating || 0)) && i >= Math.floor(Number(product.rating || 0)) ? 's fa-star-half-alt' : 'r'} fa-star`}
                          ></i>
                        ))}
                      </div>
                      <p className="text-gray-600 mt-1">Based on {product.reviewCount || 0} reviews</p>
                    </div>
                  </div>
                  
                  {productReviews.length > 0 && (
                    <div className="mt-6 space-y-2">
                      {[5, 4, 3, 2, 1].map(rating => {
                        // Count reviews for this rating
                        const ratingCount = productReviews.filter(r => Math.round(r.rating) === rating).length;
                        const percentage = productReviews.length > 0 
                          ? Math.round((ratingCount / productReviews.length) * 100) 
                          : 0;
                          
                        return (
                          <div key={rating} className="flex items-center">
                            <span className="text-xs w-8">{rating} ★</span>
                            <div className="w-full bg-gray-200 h-2 ml-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs w-8 ml-2">{percentage}%</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {/* Individual Reviews */}
                <div className="space-y-6">
                  {productReviews.length > 0 ? (
                    <>
                      {productReviews.map((review) => (
                        <div key={review.id} className="bg-white p-6 rounded-lg shadow-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-gray-800">{review.name}</h4>
                              <div className="flex items-center mt-1">
                                <div className="star-rating text-sm">
                                  {[...Array(5)].map((_, i) => (
                                    <i key={i} className={`fa${i < review.rating ? 's' : 'r'} fa-star`}></i>
                                  ))}
                                </div>
                                <span className="text-xs text-gray-500 ml-2">Verified Purchase</span>
                              </div>
                            </div>
                            <span className="text-sm text-gray-500">{review.date}</span>
                          </div>
                          <p className="mt-3 text-gray-700">{review.comment}</p>
                          <div className="flex mt-4">
                            <button 
                              className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                              onClick={() => markReviewHelpful.mutate(review.id)}
                              disabled={markReviewHelpful.isPending}
                            >
                              <i className="far fa-thumbs-up mr-1"></i> 
                              Helpful ({review.helpfulCount || 0})
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {/* More Reviews Button */}
                      {productReviews.length > 2 && (
                        <div className="text-center">
                          <button className="text-green-600 hover:text-green-700 font-medium flex items-center justify-center mx-auto">
                            Load More Reviews <i className="fas fa-chevron-down ml-2"></i>
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                      <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="py-12 bg-white">
          <div className="container mx-auto px-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">{t('relatedProducts')}</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
