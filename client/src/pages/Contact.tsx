import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "@/contexts/LanguageContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Form validation schema
const contactSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits" }),
  subject: z.string().min(1, { message: "Please select a subject" }),
  message: z.string().min(10, { message: "Message must be at least 10 characters" })
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function Contact() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema)
  });

  // Set page title
  useEffect(() => {
    document.title = `${t('contactUs')} - Millikit`;
  }, [t]);

  const onSubmit = async (data: ContactFormValues) => {
    try {
      setIsSubmitting(true);
      
      await apiRequest("POST", "/api/contact", data);
      
      toast({
        title: "Success!",
        description: t('messageSent'),
      });
      
      // Reset form
      reset();
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast({
        title: "Error",
        description: t('errorOccurred'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="contact-hero-gradient pt-32 pb-20">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{t('contactUs')}</h1>
          <p className="text-green-100 text-lg">{t('getInTouch')}</p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('send')}</h2>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-700 mb-2" htmlFor="name">{t('name')}</label>
                    <input 
                      type="text" 
                      id="name" 
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none form-input ${errors.name ? 'border-red-500' : ''}`}
                      {...register("name")}
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2" htmlFor="email">{t('email')}</label>
                    <input 
                      type="email" 
                      id="email" 
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none form-input ${errors.email ? 'border-red-500' : ''}`}
                      {...register("email")}
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2" htmlFor="phone">{t('phone')}</label>
                    <input 
                      type="tel" 
                      id="phone" 
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none form-input ${errors.phone ? 'border-red-500' : ''}`}
                      {...register("phone")}
                    />
                    {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2" htmlFor="subject">{t('subject')}</label>
                    <select 
                      id="subject" 
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none form-input ${errors.subject ? 'border-red-500' : ''}`}
                      {...register("subject")}
                    >
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="support">Product Support</option>
                      <option value="wholesale">Wholesale Query</option>
                      <option value="feedback">Feedback</option>
                    </select>
                    {errors.subject && <p className="mt-1 text-sm text-red-500">{errors.subject.message}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2" htmlFor="message">{t('message')}</label>
                    <textarea 
                      id="message" 
                      rows={4} 
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none form-input ${errors.message ? 'border-red-500' : ''}`}
                      {...register("message")}
                    ></textarea>
                    {errors.message && <p className="mt-1 text-sm text-red-500">{errors.message.message}</p>}
                  </div>
                  <button 
                    type="submit" 
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : t('send')}
                  </button>
                </div>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('contactInfo')}</h2>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-map-marker-alt text-xl text-green-600"></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Address</h3>
                      <p className="text-gray-600">
                        123 Millet Street<br />
                        Anna Nagar, Chennai<br />
                        Tamil Nadu, India 600040
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-phone text-xl text-green-600"></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Phone</h3>
                      <p className="text-gray-600">
                        +91 234 567 890<br />
                        +91 987 654 321
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-envelope text-xl text-green-600"></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Email</h3>
                      <p className="text-gray-600">
                        info@millikit.com<br />
                        support@millikit.com
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Hours */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('businessHours')}</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monday - Friday</span>
                    <span className="text-gray-800 font-medium">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saturday</span>
                    <span className="text-gray-800 font-medium">10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sunday</span>
                    <span className="text-gray-800 font-medium">Closed</span>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('connectWithUs')}</h2>
                <div className="flex space-x-4">
                  <a href="#" className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors">
                    <i className="fab fa-facebook-f text-xl text-green-600"></i>
                  </a>
                  <a href="#" className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors">
                    <i className="fab fa-twitter text-xl text-green-600"></i>
                  </a>
                  <a href="#" className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors">
                    <i className="fab fa-instagram text-xl text-green-600"></i>
                  </a>
                  <a href="#" className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors">
                    <i className="fab fa-linkedin-in text-xl text-green-600"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
