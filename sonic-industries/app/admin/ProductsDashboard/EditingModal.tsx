"use client";

import { Save, Plus, X } from "lucide-react";
import axios, { AxiosError } from "axios";
import {
  CategoryBackend,
  ProductBackend,
  ProductEditingModalProps,
} from "@/types";
import { useState } from "react";
import * as LucideIcons from "lucide-react";
import { toast } from "sonner";
// CHANGE: Labels tab now uses LabelsForm (has the position preview)
import LabelsForm from "./LabelsForm";

const EditingModal = ({
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
}: ProductEditingModalProps) => {
  const [activeTab, setActiveTab] = useState<
    | "basic"
    | "details"
    | "features"
    | "characteristics"
    | "labels"
    | "packaging"
  >("basic");

  const [keywordInput, setKeywordInput] = useState("");

  const handleUpdate = async () => {
    if (!selectedProduct || !formData.name.trim() || !formData.slug.trim()) {
      setError("Name and slug are required");
      return;
    }

    if (!formData.price || formData.price <= 0) {
      setError("Price must be greater than 0");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      // Build FormData because we might have new files
      const payload = new FormData();
      payload.append("originalSlug", selectedProduct.slug); // your backend expects this (per your earlier code)
      payload.append("name", formData.name);
      payload.append("slug", formData.slug);
      if (formData.description)
        payload.append("description", formData.description);
      if (formData.tagline) payload.append("tagline", formData.tagline);
      payload.append("price", String(formData.price));
      payload.append("rating", String(formData.rating || 0));
      payload.append("features", JSON.stringify(formData.features || []));
      payload.append(
        "characteristics",
        JSON.stringify(formData.characteristics || []),
      );
      payload.append("categoryId", formData.categoryId);
      payload.append("labels", JSON.stringify(formData.labels || []));
      payload.append("keywords", JSON.stringify(formData.keywords || []));
      payload.append("packaging", JSON.stringify(formData.packaging || {}));
      if (formData.yt_video_url)
        payload.append("yt_video_url", formData.yt_video_url);
      if (formData.unboxing_yt_video_url)
        payload.append("unboxing_yt_video_url", formData.unboxing_yt_video_url);

      const existingImageUrls: string[] = [];

      (formData.images || []).forEach((img) => {
        if (!img.isNew && img.preview) {
          // existing image → keep
          existingImageUrls.push(img.preview);
        }

        if (img.isNew && img.file instanceof File) {
          // new image → upload
          payload.append("images", img.file);
        }
      });

      // send existing ones as a JSON string so backend can keep them
      payload.append("existingImages", JSON.stringify(existingImageUrls));

      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/products`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setProducts(
        products.map((prod: ProductBackend) =>
          prod._id === selectedProduct._id
            ? response.data.updatedProduct
            : prod,
        ),
      );
      setSuccess("Product updated successfully!");
      toast.success(response.data.message);
      setIsEditing(false);
      setSelectedProduct(response.data.updatedProduct);
    } catch (err) {
      const error = err as AxiosError<{ message: string; error?: any }>;
      setError(
        error.response?.data?.error?.message || "Failed to update product",
      );
      toast.error(
        error.response?.data?.error?.message || "Failed to update product",
      );
    } finally {
      setLoading(false);
    }
  };

  const addCharacteristic = () => {
    setFormData((prev: typeof formData) => ({
      ...prev,
      characteristics: {
        ...prev.characteristics,
        items: [
          ...(prev.characteristics?.items || []),
          { name: "", image: "", desc: "", iconSearch: "" },
        ],
      },
    }));
  };

  const removeCharacteristic = (index: number) => {
    setFormData((prev: typeof formData) => ({
      ...prev,
      characteristics: {
        ...prev.characteristics,
        items: prev.characteristics?.items?.filter((_, i) => i !== index) || [],
      },
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const updateCharacteristic = (
    index: number,
    field: "name" | "image" | "desc" | "iconSearch",
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      characteristics: {
        ...prev.characteristics,
        items:
          prev.characteristics?.items?.map((characteristic, i) =>
            i === index
              ? { ...characteristic, [field]: value }
              : characteristic,
          ) || [],
      },
    }));
  };

  const addFeature = () => {
    setFormData((prev: typeof formData) => ({
      ...prev,
      features: [...(prev.features || []), { name: "", weight: "" }],
    }));
  };

  const removeFeature = (index: number) => {
    setFormData((prev: typeof formData) => ({
      ...prev,
      features: prev.features?.filter((_, i) => i !== index) || [],
    }));
  };

  const updateFeature = (
    index: number,
    field: "name" | "weight",
    value: string | number,
  ) => {
    setFormData((prev: typeof formData) => ({
      ...prev,
      features:
        prev.features?.map((feature, i) =>
          i === index ? { ...feature, [field]: value } : feature,
        ) || [],
    }));
  };

  // CHANGE: label add / remove / update functions moved into LabelsForm.tsx

  // Images editing helpers (works with hybrid images)
  const addImage = () => {
    setFormData((prev: typeof formData) => ({
      ...prev,
      images: [
        ...(prev.images || []),
        { file: null, preview: "", isNew: true },
      ],
    }));
  };

  const removeImage = (index: number) => {
    setFormData((prev: typeof formData) => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || [],
    }));
  };

  const updateImage = (index: number, file: File) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img, i) =>
        i === index
          ? {
              file,
              preview: URL.createObjectURL(file),
              isNew: true,
            }
          : img,
      ),
    }));
  };

  const addKeywords = (text: string) => {
    const newKeywords = text
      .split(/[,\n]/)
      .map((k) => k.trim())
      .filter(Boolean);

    setFormData((prev) => {
      const existing = prev.keywords ?? [];

      const keywords = [...existing];

      newKeywords.forEach((keyword) => {
        const exists = keywords.some(
          (k) => k.toLowerCase() === keyword.toLowerCase(),
        );

        if (!exists) {
          keywords.push(keyword);
        }
      });

      return {
        ...prev,
        keywords,
      };
    });
  };

  const tabs = [
    { id: "basic", label: "Basic Info" },
    { id: "details", label: "Details" },
    { id: "features", label: "Features" },
    { id: "characteristics", label: "Characteristics" },
    { id: "labels", label: "Labels" },
    { id: "packaging", label: "Packaging" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Edit Product
        </h3>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {/* Basic Info Tab */}
          {activeTab === "basic" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev: typeof formData) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev: typeof formData) => ({
                        ...prev,
                        slug: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  value={formData.tagline || ""}
                  onChange={(e) =>
                    setFormData((prev: typeof formData) => ({
                      ...prev,
                      tagline: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData((prev: typeof formData) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SEO Keywords
                </label>

                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onPaste={(e) => {
                    e.preventDefault();
                    addKeywords(e.clipboardData.getData("text"));
                    setKeywordInput("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addKeywords(keywordInput);
                      setKeywordInput("");
                    }
                  }}
                  placeholder="Type or paste keywords"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <p className="text-xs text-gray-500 mt-1">
                  Press Enter or comma (,) to add a keyword.
                </p>

                <div className="flex flex-wrap gap-2 mt-3">
                  {(formData.keywords ?? []).map((keyword, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                    >
                      <span>{keyword}</span>

                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            keywords: (prev.keywords ?? []).filter(
                              (_, i) => i !== index,
                            ),
                          }))
                        }
                        className="font-bold text-blue-700 hover:text-red-600 cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="categoryId"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Category *
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category: CategoryBackend) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev: typeof formData) => ({
                        ...prev,
                        price: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rating
                  </label>
                  <input
                    type="number"
                    value={formData.rating || 0}
                    onChange={(e) =>
                      setFormData((prev: typeof formData) => ({
                        ...prev,
                        rating: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Images
                </label>
                <div className="space-y-2">
                  {(formData.images || []).map((image, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      {image.isNew ? (
                        <>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) updateImage(index, file);
                            }}
                            className="flex-1"
                          />
                          {image.preview && (
                            <img
                              src={image.preview}
                              className="w-16 h-16 object-cover rounded"
                              alt={`img-${index}`}
                            />
                          )}
                        </>
                      ) : (
                        <>
                          <input
                            type="text"
                            value={image.preview}
                            disabled
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                          />
                          <img
                            src={image.preview}
                            className="w-16 h-16 object-cover rounded"
                            alt={`img-${index}`}
                          />
                        </>
                      )}

                      <button
                        onClick={() => removeImage(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={addImage}
                    className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                    Add Image
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Details Tab */}
          {activeTab === "details" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  YouTube Video URL
                </label>
                <input
                  type="url"
                  value={formData.yt_video_url || ""}
                  onChange={(e) =>
                    setFormData((prev: typeof formData) => ({
                      ...prev,
                      yt_video_url: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unboxing YouTube Video URL
                </label>
                <input
                  type="url"
                  value={formData.unboxing_yt_video_url || ""}
                  onChange={(e) =>
                    setFormData((prev: typeof formData) => ({
                      ...prev,
                      unboxing_yt_video_url: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Features Tab */}
          {activeTab === "features" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Features
                </label>
                <button
                  onClick={addFeature}
                  className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  Add Feature
                </button>
              </div>

              <div className="space-y-2">
                {formData.features?.map((feature, index: number) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={feature.name}
                      onChange={(e) =>
                        updateFeature(index, "name", e.target.value)
                      }
                      placeholder="Feature name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg 
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    <input
                      type="text"
                      value={feature.weight || ""}
                      onChange={(e) =>
                        updateFeature(index, "weight", e.target.value)
                      }
                      placeholder="Weight"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg 
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    <button
                      onClick={() => removeFeature(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------------- Characteristics ---------------- */}
          {activeTab === "characteristics" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description 1
                </label>
                <textarea
                  value={formData.characteristics?.desc1 || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      characteristics: {
                        ...prev.characteristics,
                        desc1: e.target.value,
                        items: prev.characteristics?.items || [],
                      },
                    }))
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description 2
                </label>
                <textarea
                  value={formData.characteristics?.desc2 || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      characteristics: {
                        ...prev.characteristics,
                        desc2: e.target.value,
                        items: prev.characteristics?.items || [],
                      },
                    }))
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Characteristic Items
                </label>
                <button
                  onClick={addCharacteristic}
                  className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  Add Characteristic
                </button>
              </div>

              {formData.characteristics?.items?.length ? (
                formData.characteristics.items.map((characteristic, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 space-y-3 bg-gray-50"
                  >
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">
                        Characteristic {index + 1}
                      </span>
                      <button
                        onClick={() => removeCharacteristic(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Characteristic Name"
                      value={characteristic.name || ""}
                      onChange={(e) =>
                        updateCharacteristic(index, "name", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <textarea
                      placeholder="Characteristic Description"
                      value={characteristic.desc || ""}
                      onChange={(e) =>
                        updateCharacteristic(index, "desc", e.target.value)
                      }
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Icon
                      </label>
                      <input
                        type="text"
                        placeholder="Search icon (e.g. home, user)"
                        value={characteristic.iconSearch || ""}
                        onChange={(e) =>
                          updateCharacteristic(
                            index,
                            "iconSearch",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border p-2 rounded-md">
                        {Object.entries(LucideIcons)
                          .filter(([name, Component]) => {
                            return (
                              name !== "default" &&
                              typeof Component === "object" && // icons are objects now
                              name
                                .toLowerCase()
                                .includes(
                                  (
                                    characteristic?.iconSearch ?? ""
                                  ).toLowerCase(),
                                )
                            );
                          })
                          .slice(0, 15)
                          .map(([name, IconComponent]) => {
                            const Icon = IconComponent as React.ComponentType<{
                              className?: string;
                            }>;
                            return (
                              <button
                                key={name}
                                type="button"
                                className={`flex items-center gap-2 p-2 rounded hover:bg-blue-100 ${
                                  characteristic.image === name
                                    ? "bg-blue-200"
                                    : ""
                                }`}
                                onClick={() =>
                                  updateCharacteristic(index, "image", name)
                                }
                              >
                                <Icon className="w-4 h-4" />
                                <span className="text-xs">{name}</span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">
                  No characteristics added yet. Click &quot;Add
                  Characteristic&quot; to create one.
                </p>
              )}
            </div>
          )}

          {/* ---------------- LABELS ---------------- */}
          {/* CHANGE: whole labels UI replaced by LabelsForm (with position preview) */}
          {activeTab === "labels" && (
            <LabelsForm formData={formData} setFormData={setFormData} />
          )}

          {/* Packaging Tab */}
          {activeTab === "packaging" && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Packaging Information
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Length
                  </label>
                  <input
                    type="number"
                    value={formData.packaging?.length || ""}
                    onChange={(e) =>
                      setFormData((prev: typeof formData) => ({
                        ...prev,
                        packaging: {
                          ...prev.packaging,
                          length: parseFloat(e.target.value) || 0,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Width
                  </label>
                  <input
                    type="number"
                    value={formData.packaging?.width || ""}
                    onChange={(e) =>
                      setFormData((prev: typeof formData) => ({
                        ...prev,
                        packaging: {
                          ...prev.packaging,
                          width: parseFloat(e.target.value) || 0,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Height
                  </label>
                  <input
                    type="number"
                    value={formData.packaging?.height || ""}
                    onChange={(e) =>
                      setFormData((prev: typeof formData) => ({
                        ...prev,
                        packaging: {
                          ...prev.packaging,
                          height: parseFloat(e.target.value) || 0,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={handleUpdate}
            disabled={loading || !formData.name.trim() || !formData.slug.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditingModal;