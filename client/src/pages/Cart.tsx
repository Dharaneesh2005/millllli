import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useTranslation } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { calculateCartSummary } from "@/lib/cart";

export default function Cart() {
  const { t } = useTranslation();
  const { cartItems, updateCartItem, removeFromCart, clearCart, isLoading } = useCart();
  const { user } = useAuth();
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const { toast } = useToast();
  const { subtotal, shipping, tax, total } = calculateCartSummary(cartItems);
  
  // Set page title
  useEffect(() => {
    document.title = `${t('cart')} - Millikit`;
  }, [t]);
  
  // Initialize quantities state from cart items
  useEffect(() => {
    const initialQuantities: { [key: number]: number } = {};
    cartItems.forEach(item => {
      initialQuantities[item.id] = item.quantity;
    });
    setQuantities(initialQuantities);
  }, [cartItems]);
  
  // Update quantity locally
  const handleQuantityChange = (itemId: number, value: string) => {
    const newQuantity = parseInt(value);
    if (!isNaN(newQuantity) && newQuantity > 0) {
      setQuantities(prev => ({
        ...prev,
        [itemId]: newQuantity
      }));
    }
  };
  
  // Update cart item quantity
  const handleUpdateItem = async (itemId: number) => {
    try {
      const newQuantity = quantities[itemId];
      if (newQuantity > 0) {
        await updateCartItem(itemId, newQuantity);
      }
    } catch (error) {
      console.error("Error updating cart item:", error);
      toast({
        title: "Error",
        description: t('errorOccurred'),
        variant: "destructive",
      });
    }
  };
  
  // Remove item from cart
  const handleRemoveItem = async (itemId: number) => {
    try {
      await removeFromCart(itemId);
    } catch (error) {
      console.error("Error removing cart item:", error);
      toast({
        title: "Error",
        description: t('errorOccurred'),
        variant: "destructive",
      });
    }
  };
  
  // Clear entire cart
  const handleClearCart = async () => {
    try {
      await clearCart();
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast({
        title: "Error",
        description: t('errorOccurred'),
        variant: "destructive",
      });
    }
  };
  
  return (
    <>
      {/* Cart Header */}
      <section className="pt-28 pb-8 bg-white">
        <div className="container mx-auto px-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{t('cart')}</h1>
          
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-green-600 transition-colors">
              {t('home')}
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-green-600">{t('cart')}</span>
          </div>
        </div>
      </section>
      
      {/* Cart Content */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
            </div>
          ) : cartItems.length > 0 ? (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-800">
                      {t('cart')} ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
                    </h2>
                  </div>
                  
                  <ul>
                    {cartItems.map(item => (
                      <li key={item.id} className="p-6 border-b">
                        <div className="flex flex-col md:flex-row items-center gap-4">
                          <div className="w-24 h-24 flex-shrink-0">
                            <img 
                              src={item.product?.imageUrl} 
                              alt={item.product?.name} 
                              className="w-full h-full object-cover rounded-md"
                            />
                          </div>
                          
                          <div className="flex-grow">
                            <h3 className="text-lg font-medium text-gray-800">
                              {item.product?.name}
                            </h3>
                            <p className="text-sm text-gray-500 mb-2">
                              {item.product?.shortDescription?.substring(0, 60)}
                              {item.product?.shortDescription && item.product.shortDescription.length > 60 ? '...' : ''}
                            </p>
                            <p className="text-green-600 font-bold">
                              ₹{item.product?.price}
                            </p>
                          </div>
                          
                          <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="flex items-center border rounded-md overflow-hidden">
                              <button 
                                className="px-3 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200 focus:outline-none"
                                onClick={() => {
                                  const newQuantity = Math.max(1, quantities[item.id] - 1);
                                  handleQuantityChange(item.id, newQuantity.toString());
                                }}
                              >-</button>
                              <input 
                                type="number" 
                                className="w-12 text-center py-1 focus:outline-none" 
                                value={quantities[item.id] || item.quantity}
                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                min="1"
                              />
                              <button 
                                className="px-3 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200 focus:outline-none"
                                onClick={() => {
                                  const newQuantity = (quantities[item.id] || item.quantity) + 1;
                                  handleQuantityChange(item.id, newQuantity.toString());
                                }}
                              >+</button>
                            </div>
                            
                            <div className="flex gap-2">
                              <button 
                                className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 focus:outline-none transition-colors text-sm"
                                onClick={() => handleUpdateItem(item.id)}
                              >
                                {t('updateCart')}
                              </button>
                              <button 
                                className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 focus:outline-none transition-colors text-sm"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                {t('removeItem')}
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="p-6 flex justify-between items-center">
                    <button 
                      className="text-red-600 hover:text-red-700 transition-colors"
                      onClick={handleClearCart}
                    >
                      {t('clearCart')}
                    </button>
                    <Link href="/products" className="text-green-600 hover:text-green-700 transition-colors">
                      {t('continueShopping')}
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* Cart Summary */}
              <div>
                <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">
                    {t('cart')} {t('summary')}
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between border-b pb-4">
                      <span className="text-gray-600">{t('subtotal')}</span>
                      <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b pb-4">
                      <span className="text-gray-600">{t('shipping')}</span>
                      <span className="font-medium">₹{shipping.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b pb-4">
                      <span className="text-gray-600">{t('tax')}</span>
                      <span className="font-medium">₹{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pb-4">
                      <span className="text-gray-800 font-semibold">{t('total')}</span>
                      <span className="text-green-600 font-bold text-xl">₹{total.toFixed(2)}</span>
                    </div>
                    
                    <Link href="/checkout" className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center">
                      {t('proceedToCheckout')}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="flex flex-col items-center">
                <i className="fas fa-shopping-cart text-gray-300 text-6xl mb-6"></i>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  {t('emptyCart')}
                </h2>
                <p className="text-gray-600 mb-8">
                  Browse our collection and discover our premium millet products.
                </p>
                <Link href="/products" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
                  {t('continueShopping')}
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
