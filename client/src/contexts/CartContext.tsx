import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode 
} from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CartItem, Product } from "@shared/schema";

interface CartContextType {
  cartItems: (CartItem & { product?: Product })[];
  addToCart: (productId: number, quantity: number) => Promise<void>;
  updateCartItem: (itemId: number, quantity: number) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<(CartItem & { product?: Product })[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Initialize cart
  useEffect(() => {
    const fetchCart = async () => {
      try {
        setIsLoading(true);
        const savedSessionId = localStorage.getItem("cartSessionId");
        
        const response = await fetch("/api/cart", {
          headers: {
            "Session-Id": savedSessionId || "",
          },
        });
        
        const data = await response.json();
        setCartItems(data);
        
        // Get session ID from response header
        const responseSessionId = response.headers.get("session-id");
        if (responseSessionId) {
          setSessionId(responseSessionId);
          localStorage.setItem("cartSessionId", responseSessionId);
        }
      } catch (error) {
        console.error("Error fetching cart:", error);
        toast({
          title: "Error",
          description: "Failed to load your cart. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCart();
  }, [toast]);

  // Add item to cart
  const addToCart = async (productId: number, quantity: number) => {
    try {
      setIsLoading(true);
      
      const response = await apiRequest("POST", "/api/cart", {
        productId,
        quantity,
      });
      
      const newItem = await response.json();
      
      // Update local cart state
      const existingItemIndex = cartItems.findIndex(
        (item) => item.productId === productId
      );
      
      if (existingItemIndex !== -1) {
        // Item exists, update quantity
        const updatedItems = [...cartItems];
        updatedItems[existingItemIndex].quantity += quantity;
        setCartItems(updatedItems);
      } else {
        // Get product details to display in cart
        const productResponse = await fetch(`/api/products/${productId}`);
        const product = await productResponse.json();
        
        // Add new item
        setCartItems([...cartItems, { ...newItem, product }]);
      }
      
      toast({
        title: "Added to cart",
        description: "Item has been added to your cart",
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update cart item quantity
  const updateCartItem = async (itemId: number, quantity: number) => {
    try {
      setIsLoading(true);
      
      await apiRequest("PUT", `/api/cart/${itemId}`, { quantity });
      
      // Update local state
      setCartItems(
        cartItems.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        )
      );
      
      toast({
        title: "Cart updated",
        description: "Your cart has been updated",
      });
    } catch (error) {
      console.error("Error updating cart item:", error);
      toast({
        title: "Error",
        description: "Failed to update cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId: number) => {
    try {
      setIsLoading(true);
      
      await apiRequest("DELETE", `/api/cart/${itemId}`);
      
      // Update local state
      setCartItems(cartItems.filter((item) => item.id !== itemId));
      
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart",
      });
    } catch (error) {
      console.error("Error removing cart item:", error);
      toast({
        title: "Error",
        description: "Failed to remove item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      setIsLoading(true);
      
      await apiRequest("DELETE", "/api/cart");
      
      // Update local state
      setCartItems([]);
      
      toast({
        title: "Cart cleared",
        description: "Your cart has been cleared",
      });
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast({
        title: "Error",
        description: "Failed to clear cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
