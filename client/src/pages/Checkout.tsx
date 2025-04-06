import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { calculateCartSummary } from "@/lib/cart";
import { Link } from "wouter";

// Form validation schema
const checkoutSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits" }),
  address: z.string().min(5, { message: "Address is required and must be at least 5 characters" }),
  city: z.string().min(1, { message: "City is required" }),
  state: z.string().min(1, { message: "State is required" }),
  postalCode: z.string().min(6, { message: "Postal code is required" }),
  country: z.string().min(1, { message: "Country is required" }),
  paymentMethod: z.enum(["card", "cod", "upi"], {
    errorMap: () => ({ message: "Please select a payment method" }),
  }),
  
  // Card details (conditional based on payment method)
  cardNumber: z.string().optional(),
  nameOnCard: z.string().optional(),
  expiryDate: z.string().optional(),
  cvv: z.string().optional(),
});

// Add conditional validation based on payment method
const checkoutFormSchema = checkoutSchema.superRefine((data, ctx) => {
  if (data.paymentMethod === "card") {
    if (!data.cardNumber || data.cardNumber.length < 16) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Card number is required and must be 16 digits",
        path: ["cardNumber"],
      });
    }
    if (!data.nameOnCard) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Name on card is required",
        path: ["nameOnCard"],
      });
    }
    if (!data.expiryDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Expiry date is required",
        path: ["expiryDate"],
      });
    }
    if (!data.cvv || data.cvv.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CVV is required and must be 3 or 4 digits",
        path: ["cvv"],
      });
    }
  }
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const { t } = useTranslation();
  const { cartItems, clearCart, isLoading: cartLoading } = useCart();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("card");
  
  const { subtotal, shipping, tax, total } = calculateCartSummary(cartItems);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      paymentMethod: "card",
    }
  });
  
  // Watch payment method changes to conditionally render card fields
  const paymentMethod = watch("paymentMethod");
  
  // Set page title
  useEffect(() => {
    document.title = `${t('checkout')} - Millikit`;
  }, [t]);
  
  // Handle payment method change
  useEffect(() => {
    setSelectedPaymentMethod(paymentMethod);
  }, [paymentMethod]);
  
  // Redirect to products if cart is empty
  useEffect(() => {
    if (!cartLoading && cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty. Please add some products before checkout.",
        variant: "destructive",
      });
      navigate("/products");
    }
  }, [cartItems, cartLoading, navigate, toast]);
  
  const onSubmit = async (data: CheckoutFormValues) => {
    try {
      setIsProcessing(true);
      
      // Simulate API call for order processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Clear cart on successful order
      await clearCart();
      
      toast({
        title: "Success!",
        description: t('orderPlaced'),
      });
      
      // Redirect to a thank you page (needs to be created)
      navigate("/");
    } catch (error) {
      console.error("Error processing order:", error);
      toast({
        title: "Error",
        description: t('errorOccurred'),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (cartLoading) {
    return (
      <div className="pt-28 flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }
  
  return (
    <>
      {/* Checkout Header */}
      <section className="pt-28 pb-8 bg-white">
        <div className="container mx-auto px-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{t('checkout')}</h1>
          
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-green-600 transition-colors">
              {t('home')}
            </Link>
            <span className="text-gray-400">/</span>
            <Link href="/cart" className="text-gray-500 hover:text-green-600 transition-colors">
              {t('cart')}
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-green-600">{t('checkout')}</span>
          </div>
        </div>
      </section>
      
      {/* Checkout Content */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Billing & Shipping Details */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
                  <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-800">
                      {t('billingDetails')}
                    </h2>
                  </div>
                  
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 mb-2" htmlFor="firstName">
                        {t('firstName')} <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        id="firstName" 
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none form-input ${errors.firstName ? 'border-red-500' : ''}`}
                        {...register("firstName")}
                      />
                      {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName.message}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 mb-2" htmlFor="lastName">
                        {t('lastName')} <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        id="lastName" 
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none form-input ${errors.lastName ? 'border-red-500' : ''}`}
                        {...register("lastName")}
                      />
                      {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName.message}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 mb-2" htmlFor="email">
                        {t('email')} <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="email" 
                        id="email" 
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none form-input ${errors.email ? 'border-red-500' : ''}`}
                        {...register("email")}
                      />
                      {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 mb-2" htmlFor="phone">
                        {t('phone')} <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="tel" 
                        id="phone" 
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none form-input ${errors.phone ? 'border-red-500' : ''}`}
                        {...register("phone")}
                      />
                      {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>}
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-gray-700 mb-2" htmlFor="address">
                        {t('address')} <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        id="address" 
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none form-input ${errors.address ? 'border-red-500' : ''}`}
                        {...register("address")}
                      />
                      {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address.message}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 mb-2" htmlFor="city">
                        {t('city')} <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        id="city" 
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none form-input ${errors.city ? 'border-red-500' : ''}`}
                        {...register("city")}
                      />
                      {errors.city && <p className="mt-1 text-sm text-red-500">{errors.city.message}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 mb-2" htmlFor="state">
                        {t('state')} <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        id="state" 
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none form-input ${errors.state ? 'border-red-500' : ''}`}
                        {...register("state")}
                      />
                      {errors.state && <p className="mt-1 text-sm text-red-500">{errors.state.message}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 mb-2" htmlFor="postalCode">
                        {t('postalCode')} <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        id="postalCode" 
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none form-input ${errors.postalCode ? 'border-red-500' : ''}`}
                        {...register("postalCode")}
                      />
                      {errors.postalCode && <p className="mt-1 text-sm text-red-500">{errors.postalCode.message}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 mb-2" htmlFor="country">
                        {t('country')} <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        id="country" 
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none form-input ${errors.country ? 'border-red-500' : ''}`}
                        {...register("country")}
                      />
                      {errors.country && <p className="mt-1 text-sm text-red-500">{errors.country.message}</p>}
                    </div>
                  </div>
                </div>
                
                {/* Payment Method */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-800">
                      {t('paymentMethod')}
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="mb-6">
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input 
                            type="radio" 
                            id="card" 
                            value="card" 
                            className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                            {...register("paymentMethod")}
                          />
                          <label htmlFor="card" className="ml-2 text-gray-700">
                            Credit/Debit Card <i className="fas fa-credit-card ml-2 text-gray-500"></i>
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input 
                            type="radio" 
                            id="cod" 
                            value="cod" 
                            className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                            {...register("paymentMethod")}
                          />
                          <label htmlFor="cod" className="ml-2 text-gray-700">
                            Cash on Delivery <i className="fas fa-money-bill-wave ml-2 text-gray-500"></i>
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input 
                            type="radio" 
                            id="upi" 
                            value="upi" 
                            className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                            {...register("paymentMethod")}
                          />
                          <label htmlFor="upi" className="ml-2 text-gray-700">
                            UPI <i className="fas fa-mobile-alt ml-2 text-gray-500"></i>
                          </label>
                        </div>
                      </div>
                      {errors.paymentMethod && <p className="mt-2 text-sm text-red-500">{errors.paymentMethod.message}</p>}
                    </div>
                    
                    {/* Card Payment Fields (conditionally rendered) */}
                    {selectedPaymentMethod === "card" && (
                      <div className="border rounded-lg p-4 mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-gray-700 mb-2" htmlFor="cardNumber">
                            {t('cardNumber')} <span className="text-red-500">*</span>
                          </label>
                          <input 
                            type="text" 
                            id="cardNumber" 
                            placeholder="1234 5678 9012 3456"
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none form-input ${errors.cardNumber ? 'border-red-500' : ''}`}
                            {...register("cardNumber")}
                          />
                          {errors.cardNumber && <p className="mt-1 text-sm text-red-500">{errors.cardNumber.message}</p>}
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-gray-700 mb-2" htmlFor="nameOnCard">
                            {t('nameOnCard')} <span className="text-red-500">*</span>
                          </label>
                          <input 
                            type="text" 
                            id="nameOnCard" 
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none form-input ${errors.nameOnCard ? 'border-red-500' : ''}`}
                            {...register("nameOnCard")}
                          />
                          {errors.nameOnCard && <p className="mt-1 text-sm text-red-500">{errors.nameOnCard.message}</p>}
                        </div>
                        
                        <div>
                          <label className="block text-gray-700 mb-2" htmlFor="expiryDate">
                            {t('expiryDate')} <span className="text-red-500">*</span>
                          </label>
                          <input 
                            type="text" 
                            id="expiryDate" 
                            placeholder="MM/YY"
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none form-input ${errors.expiryDate ? 'border-red-500' : ''}`}
                            {...register("expiryDate")}
                          />
                          {errors.expiryDate && <p className="mt-1 text-sm text-red-500">{errors.expiryDate.message}</p>}
                        </div>
                        
                        <div>
                          <label className="block text-gray-700 mb-2" htmlFor="cvv">
                            {t('cvv')} <span className="text-red-500">*</span>
                          </label>
                          <input 
                            type="text" 
                            id="cvv" 
                            placeholder="123"
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none form-input ${errors.cvv ? 'border-red-500' : ''}`}
                            {...register("cvv")}
                          />
                          {errors.cvv && <p className="mt-1 text-sm text-red-500">{errors.cvv.message}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Order Summary */}
              <div>
                <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">
                    {t('cart')} {t('summary')}
                  </h2>
                  
                  {/* Order items */}
                  <div className="mb-6 max-h-64 overflow-y-auto">
                    <ul className="divide-y">
                      {cartItems.map(item => (
                        <li key={item.id} className="py-3 flex items-center gap-3">
                          <div className="w-16 h-16">
                            <img 
                              src={item.product?.imageUrl} 
                              alt={item.product?.name} 
                              className="w-full h-full object-cover rounded-md"
                            />
                          </div>
                          <div className="flex-grow">
                            <h4 className="text-sm font-medium text-gray-800">
                              {item.product?.name}
                            </h4>
                            <div className="flex justify-between text-sm text-gray-500">
                              <span>{item.quantity} x ₹{item.product?.price}</span>
                              <span>₹{(parseFloat(item.product?.price || "0") * item.quantity).toFixed(2)}</span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Order total */}
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
                    
                    <button 
                      type="submit" 
                      className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : t('placeOrder')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
