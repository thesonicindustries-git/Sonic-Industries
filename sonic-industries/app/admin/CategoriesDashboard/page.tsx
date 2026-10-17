"use client";

import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { X, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { CategoryBackend, CategoryFeatures, FeaturesBlock } from "@/types";
import CreateCategory from "./CreateCategory";
import SearchBySlug from "./SearchBySlug";
import EditingModal from "./EditingModal";
import SearchAllCategories from "./SearchAllCategories";
import { toast } from "sonner";

const CategoriesDashboard = () => {
  const [categories, setCategories] = useState<CategoryBackend[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryBackend | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"browse" | "search" | "create">(
    "browse"
  );
  const [activeFormTab, setActiveFormTab] = useState<
    "basic" | "features"
  >("basic");

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    title: "",
    description: "",
    keywords: [] as string[],
    features: {
      desc1: "",
      desc2: "",
      items: [] as CategoryFeatures[],
    } as FeaturesBlock,
  });

  useEffect(() => {
    loadAllCategories();
  }, []);

  const loadAllCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/categories`
      );
      setCategories(response.data.categories || []);
      toast.success(response.data.message);
    } catch {
      setError("Failed to load categories.");
      toast.error("Failed to load categories.");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const categoryToDelete = categories.find((c) => c._id === categoryId);
      if (!categoryToDelete) {
        setError("Category not found");
        return;
      }

      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/categories/${categoryToDelete.slug}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setCategories((prev) => prev.filter((c) => c._id !== categoryId));
      setSuccess("Category deleted successfully!");
      toast.success(response.data.message);
      if (selectedCategory?._id === categoryId) {
        setSelectedCategory(null);
      }
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || "Delete failed");
      toast.error(error.response?.data?.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (category: CategoryBackend) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      title: category.title,
      description: category.description || "",
      keywords: category.keywords || [],
      features: category.features || {
        desc1: "",
        desc2: "",
        items: [],
      },
    });
    setIsEditing(true);
    setActiveFormTab("basic");
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6">

        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-900">
                Categories Management
              </h1>
              <p className="mt-1 text-xs sm:text-sm md:text-base text-gray-600">
                Manage your website categories
              </p>
            </div>

            <button
              onClick={loadAllCategories}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs sm:text-sm md:text-base text-white hover:bg-blue-700 disabled:opacity-50 transition"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-xs sm:text-sm md:text-base">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="flex-1 text-red-800">{error}</span>
            <button onClick={clearMessages}>
              <X className="h-4 w-4 text-red-600" />
            </button>
          </div>
        )}

        {/* Success */}
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
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex overflow-x-auto border-b scrollbar-hide">
            {[
              { id: "browse", label: `Browse (${categories.length})` },
              { id: "search", label: "Search by Slug" },
              { id: "create", label: "Create New" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`min-w-30 px-4 py-3 text-xs sm:text-sm font-medium transition ${
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
                      Loading categories...
                    </p>
                  </div>
                ) : categories.length === 0 ? (
                  <p className="text-center text-xs sm:text-sm md:text-base text-gray-500">
                    No categories found.
                  </p>
                ) : (
                  <SearchAllCategories
                    categories={categories}
                    startEdit={startEdit}
                    handleDelete={handleDelete}
                  />
                )}
              </>
            )}

            {activeTab === "search" && (
              <SearchBySlug
                loading={loading}
                setLoading={setLoading}
                setError={setError}
                startEdit={startEdit}
                handleDelete={handleDelete}
              />
            )}

            {activeTab === "create" && (
              <CreateCategory
                formData={formData}
                setFormData={setFormData}
                loading={loading}
                setLoading={setLoading}
                setError={setError}
                setCategories={setCategories}
                setSuccess={setSuccess}
                setActiveTab={setActiveTab}
                setIsEditing={setIsEditing}
                setSelectedCategory={setSelectedCategory}
                setActiveFormTab={setActiveFormTab}
                categories={categories}
                activeFormTab={activeFormTab}
              />
            )}
          </div>
        </div>

        {/* Edit Modal */}
        {isEditing && selectedCategory && (
          <EditingModal
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            formData={formData}
            setFormData={setFormData}
            loading={loading}
            setLoading={setLoading}
            setError={setError}
            setSuccess={setSuccess}
            setIsEditing={setIsEditing}
            categories={categories}
            setCategories={setCategories}
          />
        )}
      </div>
    </div>
  );
};

export default CategoriesDashboard;