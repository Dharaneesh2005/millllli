import { Link } from "wouter";
import { motion } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { t } = useTranslation();
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCart(product.id, 1);
  };
  
  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg overflow-hidden product-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ 
        scale: 1.05,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}
    >
      <Link href={`/product/${product.slug}`}>
        <div className="relative">
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-48 object-cover product-image"
          />
          {product.badge && (
            <motion.span 
              className="absolute top-2 left-2 bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {product.badge}
            </motion.span>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{product.name}</h3>
          <p className="text-gray-600 mb-4">{product.shortDescription}</p>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <motion.span 
                className="text-xl font-bold text-green-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                ₹{product.price}
              </motion.span>
              {product.comparePrice && (
                <span className="text-gray-500 line-through text-sm ml-2">₹{product.comparePrice}</span>
              )}
            </div>
            
            <motion.button 
              onClick={handleAddToCart} 
              className="bg-green-700 text-white px-3 py-1 rounded-full hover:bg-green-600 transition-colors text-sm"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {t('addToCart')}
            </motion.button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
