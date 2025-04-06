import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/contexts/LanguageContext";
import ProductCard from "@/components/ProductCard";
import { Product } from "@shared/schema";

export default function Products() {
  const { t } = useTranslation();
  const [category, setCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const productsPerPage = 6;
  
  // Fetch all products
  const { data: allProducts, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  
  // Fetch products by search if query exists
  const { data: searchResults, isLoading: isSearchLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/search", debouncedQuery],
    queryFn: () => fetch(`/api/products/search?q=${encodeURIComponent(debouncedQuery)}`).then(res => res.json()),
    enabled: debouncedQuery.length > 0,
  });
  
  // Set page title
  useEffect(() => {
    document.title = `${t('products')} - Millikit`;
  }, [t]);
  
  // Debounce search query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        setDebouncedQuery(searchQuery);
      } else {
        setDebouncedQuery("");
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);
  
  // Filter and sort products
  const filteredProducts = (() => {
    let filtered = searchQuery ? searchResults || [] : allProducts || [];
    
    // Apply category filter if not searching
    if (category !== "all" && !searchQuery) {
      filtered = filtered.filter(product => product.category === category);
    }
    
    // Apply sorting
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return parseFloat(a.price) - parseFloat(b.price);
        case "price-desc":
          return parseFloat(b.price) - parseFloat(a.price);
        case "name-asc":
          return a.name.localeCompare(b.name);
        default: // "featured"
          return a.featured === b.featured ? 0 : a.featured ? -1 : 1;
      }
    });
  })();
  
  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );
  
  // Generate pagination buttons
  const paginationButtons = [];
  for (let i = 1; i <= totalPages; i++) {
    paginationButtons.push(
      <button
        key={i}
        onClick={() => setCurrentPage(i)}
        className={`px-3 py-1 mx-1 rounded ${
          currentPage === i
            ? "bg-green-600 text-white"
            : "bg-white text-gray-800 hover:bg-gray-100"
        }`}
      >
        {i}
      </button>
    );
  }
  
  // Handle previous page
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Handle next page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [category, sortBy, debouncedQuery]);
  
  return (
    <>
      {/* Products Header */}
      <section className="pt-24 pb-12 bg-gradient-to-r from-green-700 to-green-600">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl font-bold text-white mb-4">{t('products')}</h1>
          <p className="text-green-100 text-lg">{t('getInTouch')}</p>
          
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 mt-4 text-green-100">
            <a href="/" className="hover:text-white transition-colors">{t('home')}</a>
            <span>/</span>
            <span className="text-white">{t('products')}</span>
          </div>
        </div>
      </section>
      
      {/* Filter Section */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-6">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full md:w-1/3 px-4 py-2 border rounded-full text-gray-700 focus:outline-none focus:border-green-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">{t('filterBy')}:</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="border rounded-full px-4 py-2 text-gray-700 focus:outline-none focus:border-green-500 cursor-pointer"
                >
                  <option value="all">{t('allCategories')}</option>
                  <option value="organic">{t('organic')}</option>
                  <option value="mixed">{t('mixed')}</option>
                  <option value="specialty">{t('specialty')}</option>
                </select>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">{t('sortBy')}:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border rounded-full px-4 py-2 text-gray-700 focus:outline-none focus:border-green-500 cursor-pointer"
                >
                  <option value="featured">{t('featured')}</option>
                  <option value="price-asc">{t('priceLowToHigh')}</option>
                  <option value="price-desc">{t('priceHighToLow')}</option>
                  <option value="name-asc">{t('nameAToZ')}</option>
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-700">{t('view')}:</span>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 ${
                  viewMode === "grid" ? "text-green-600" : "text-gray-400"
                } hover:bg-green-50 rounded-lg transition-colors`}
                aria-label="Grid view"
              >
                <i className="fas fa-th-large text-lg"></i>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 ${
                  viewMode === "list" ? "text-green-600" : "text-gray-400"
                } hover:bg-green-50 rounded-lg transition-colors`}
                aria-label="List view"
              >
                <i className="fas fa-list text-lg"></i>
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Products Grid */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          {isLoading || isSearchLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className={`${viewMode === "grid" ? "grid-view" : "list-view"}`}>
              {currentProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No products found.</p>
            </div>
          )}
          
          {/* Results Count */}
          {filteredProducts.length > 0 && (
            <div className="mt-8 text-center text-gray-600">
              {t('showing')} {(currentPage - 1) * productsPerPage + 1}-
              {Math.min(currentPage * productsPerPage, filteredProducts.length)} {t('of')}{" "}
              {filteredProducts.length} {t('products')}
            </div>
          )}
          
          {/* Pagination */}
          {filteredProducts.length > productsPerPage && (
            <div className="mt-8 flex justify-center">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-white text-gray-800 rounded disabled:opacity-50"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                {paginationButtons}
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-white text-gray-800 rounded disabled:opacity-50"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </nav>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
