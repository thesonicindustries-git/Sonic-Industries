"use client";

import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { X, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import {
  ProductBackend,
  ProductFeatures,
  ProductPackaged,
  CategoryBackend,
  ProductImage,
  ProductCharacteristics,
  FeaturesBlock,
  NewProductLabels,
} from "@/types";
import CreateProduct from "./CreateProduct";
import SearchBySlug from "./SearchBySlug";
import EditingModal from "./EditingModal";
import SearchAllProducts from "./SearchAllProducts";
import { toast } from "sonner";

const ProductsDashboard = () => {
  const [products, setProducts] = useState<ProductBackend[]>([]);
  const [categories, setCategories] = useState<CategoryBackend[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductBackend | null>(
    null
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"browse" | "search" | "create">(
    "browse"
  );
  const [activeFormTab, setActiveFormTab] = useState<
    | "basic"
    | "pricing"
    | "features"
    | "characteristics"
    | "labels"
    | "packaging"
    | "video"
  >("basic");

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    tagline: "",
    categoryId: "",
    price: 0,
    images: [] as ProductImage[],
    rating: 0,
    features: [] as ProductFeatures[],
    characteristics: {
      desc1: "",
      desc2: "",
      items: [] as ProductCharacteristics[],
    } as FeaturesBlock,
    labels: [] as NewProductLabels[],
    keywords: [] as string[],
    packaging: {
      length: 0,
      width: 0,
      height: 0,
    } as ProductPackaged,
    yt_video_url: "",
    unboxing_yt_video_url: "",
  });

  useEffect(() => {
    loadAllProducts();
    loadAllCategories();
  }, []);

  const loadAllProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/products`
      );
      setProducts(res.data.products || []);
      toast.success(res.data.message);
    } catch {
      setError("Failed to load products.");
      toast.error("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  const loadAllCategories = async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/categories`
      );
      setCategories(res.data.categories || []);
      toast.success(res.data.message);
    } catch (err) {
      console.error("Failed to load categories:", err);
      toast.error("Failed to load categories.");
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const productToDelete = products.find((p) => p._id === productId);
      if (!productToDelete) {
        setError("Product not found");
        return;
      }

      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/products/${productToDelete.slug}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setProducts((prev) => prev.filter((p) => p._id !== productId));
      setSuccess("Product deleted successfully!");
      toast.success(response.data.message);
      if (selectedProduct?._id === productId) {
        setSelectedProduct(null);
      }
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || "Failed to delete product");
      toast.error(error.response?.data?.message || "Failed to delete product");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (product: ProductBackend) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      tagline: product.tagline || "",
      categoryId: product.categoryId._id || "",
      price: product.price || 0,
      images: product.images.map((url) => ({
        file: null,
        preview: url,
        isNew: false,
      })),
      rating: product.rating || 0,
      features: product.features || [],
      characteristics: product.characteristics || {
        desc1: "",
        desc2: "",
        items: [],
      },
      labels: product.labels || [],
      keywords: product.keywords || [],
      packaging: {
        length: product.packaging?.length ?? 0,
        width: product.packaging?.width ?? 0,
        height: product.packaging?.height ?? 0,
      },
      yt_video_url: product.yt_video_url || "",
      unboxing_yt_video_url: product.unboxing_yt_video_url || "",
    });
    setIsEditing(true);
    setActiveFormTab("basic");
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const CreateProductProps = {
    formData,
    setFormData,
    loading,
    setLoading,
    setError,
    setProducts,
    setSuccess,
    setActiveTab,
    setIsEditing,
    setSelectedProduct,
    setActiveFormTab,
    products,
    categories,
    activeFormTab,
  };

  const SearchBySlugProps = {
    loading,
    setLoading,
    setError,
    startEdit,
    handleDelete,
  };

  const EditingModalProps = {
    selectedProduct,
    setSelectedProduct,
    formData,
    setFormData,
    loading,
    setLoading,
    setError,
    setSuccess,
    setIsEditing,
    products,
    setProducts,
    categories,
  };

  const SearchAllProductsProps = {
    onProductsChange: setProducts,
    products,
    categories,
    startEdit,
    handleDelete,
  };

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-900">
                Products Management
              </h1>
              <p className="mt-1 text-xs sm:text-sm md:text-base text-gray-600">
                Manage your product catalog with ease
              </p>
            </div>

            <button
              onClick={loadAllProducts}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs sm:text-sm md:text-base text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-xs sm:text-sm md:text-base">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="flex-1 text-red-800">{error}</span>
            <button onClick={clearMessages}>
              <X className="h-4 w-4 text-red-600" />
            </button>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-xs sm:text-sm md:text-base">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="flex-1 text-green-800">{success}</span>
            <button onClick={clearMessages}>
              <X className="h-4 w-4 text-green-600" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex overflow-x-auto border-b scrollbar-hide">
            {[
              { id: "browse", label: `Browse (${products.length})` },
              { id: "search", label: "Search by Slug" },
              { id: "create", label: "Create New" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`min-w-35 px-4 py-3 text-xs sm:text-sm font-medium transition ${
                  activeTab === tab.id
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-3 sm:p-5 lg:p-6">
            {activeTab === "browse" && (
              <>
                {loading ? (
                  <div className="py-10 text-center">
                    <RefreshCw className="mx-auto mb-2 h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600" />
                    <p className="text-xs sm:text-sm md:text-base text-gray-600">
                      Loading products...
                    </p>
                  </div>
                ) : products.length === 0 ? (
                  <p className="text-center text-xs sm:text-sm md:text-base text-gray-500">
                    No products found.
                  </p>
                ) : (
                  <SearchAllProducts {...SearchAllProductsProps} />
                )}
              </>
            )}

            {activeTab === "search" && <SearchBySlug {...SearchBySlugProps} />}

            {activeTab === "create" && (
              <CreateProduct {...CreateProductProps} />
            )}
          </div>
        </div>

        {/* Edit Modal */}
        {isEditing && selectedProduct && (
          <EditingModal {...EditingModalProps} />
        )}
      </div>
    </div>
  );
};

export default ProductsDashboard;
