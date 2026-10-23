"use client";

import { useState } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import {
  Edit2,
  Trash2,
  Star,
  IndianRupee,
  ChevronUp,
  ChevronDown,
  MoreVertical,
  Heart,
  Move,
} from "lucide-react";

import { ProductBackend, SearchAllProductProps } from "@/types";

const SearchAllProducts = ({
  products,
  categories,
  startEdit,
  handleDelete,
  onProductsChange,
}: SearchAllProductProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [moveProduct, setMoveProduct] = useState<ProductBackend | null>(null);
  const [moveCategoryId, setMoveCategoryId] = useState("");
  const [movePosition, setMovePosition] = useState("0");
  const [savingMove, setSavingMove] = useState(false);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(categoryId) ? next.delete(categoryId) : next.add(categoryId);
      return next;
    });
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 0; i < Math.floor(rating); i++) {
      stars.push(
        <Star
          key={`full-${i}`}
          className="w-3 h-3 fill-yellow-400 text-yellow-400"
        />
      );
    }
    for (let i = 0; i < 5 - Math.ceil(rating); i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-3 h-3 text-gray-300" />
      );
    }
    return stars;
  };

  const sortedProducts = (items: ProductBackend[]) => [...items].sort((a, b) => {
    if (typeof a.sortOrder === "number" && typeof b.sortOrder === "number" && a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return (a.createdAt || "").localeCompare(b.createdAt || "");
  });

  const openMove = (product: ProductBackend) => {
    setMoveProduct(product);
    setMoveCategoryId(product.categoryId?._id || categories[0]?._id || "");
    setMovePosition(String(sortedProducts(products.filter((p) => p.categoryId?._id === product.categoryId?._id)).findIndex((p) => p._id === product._id)));
    setActiveMenu(null);
  };

  const togglePriority = async (product: ProductBackend) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/products/priority`,
        { productId: product._id, isPriority: !product.isPriority },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const affectedProducts = response.data.products || [response.data.updatedProduct];
      const affectedIds = new Set(affectedProducts.map((item: ProductBackend) => item._id));
      onProductsChange([...products.filter((item) => !affectedIds.has(item._id)), ...affectedProducts]);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to update product priority");
    }
  };
  const saveMove = async () => {
    if (!moveProduct || !moveCategoryId) return;
    setSavingMove(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/products/reorder`, { productId: moveProduct._id, categoryId: moveCategoryId, position: Number(movePosition) }, { headers: { Authorization: `Bearer ${token}` } });
      const affectedProducts = response.data.products || [response.data.updatedProduct];
      const affectedIds = new Set(affectedProducts.map((product: ProductBackend) => product._id));
      onProductsChange([...products.filter((product) => !affectedIds.has(product._id)), ...affectedProducts]);
      setMoveProduct(null);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to move product");
    } finally { setSavingMove(false); }
  };
  /* ---------- GROUP PRODUCTS ---------- */

  const groupedProducts = categories
    .map((category) => ({
      category,
      products: sortedProducts(products.filter(
        (p) => p.categoryId && p.categoryId._id === category._id
      )),
    }))
    .filter((group) => group.products.length > 0);

  const uncategorizedProducts = products.filter(
    (p) => !categories.find((c) => c._id === p.categoryId?._id)
  );

  /* ---------- UI ---------- */

  return (
    <div className="space-y-4">
      {groupedProducts.map(({ category, products }) => (
        <div
          key={category._id}
          className="border rounded-md bg-white overflow-hidden"
        >
          {/* CATEGORY HEADER */}
          <button
            onClick={() => toggleCategory(category._id)}
            className="w-full flex items-center justify-between px-4 py-2 bg-linear-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-800">
                {category.name}
              </h2>
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-600 text-white font-medium">
                {products.length}
              </span>
            </div>

            {expandedCategories.has(category._id) ? (
              <ChevronUp className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            )}
          </button>

          {/* PRODUCTS */}
          {expandedCategories.has(category._id) && (
            <div className="p-3 bg-gray-50">
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <div
                    key={product._id}
                    className="relative bg-white border rounded-md p-3 hover:shadow transition"
                  >
                    <div className="absolute left-2 top-2 z-10">
                      <button onClick={() => togglePriority(product)} aria-label={product.isPriority ? `Remove priority from ${product.name}` : `Prioritize ${product.name}`} title={product.isPriority ? "Remove priority" : "Prioritize product"} className={`rounded-full bg-white p-1.5 shadow transition hover:bg-rose-50 ${product.isPriority ? "text-rose-500" : "text-slate-400"}`}><Heart className="h-4 w-4" fill={product.isPriority ? "currentColor" : "none"} /></button>
                    </div>
                    <div className="absolute right-2 top-2 z-10">
                      <button onClick={() => setActiveMenu(activeMenu === product._id ? null : product._id)} aria-label={`More actions for ${product.name}`} className="rounded-full bg-white p-1.5 text-gray-600 shadow hover:bg-gray-100"><MoreVertical className="h-4 w-4" /></button>
                      {activeMenu === product._id && <div className="absolute right-0 mt-1 w-36 rounded-md border bg-white py-1 shadow-lg"><button onClick={() => openMove(product)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"><Move className="h-3.5 w-3.5" />Move to...</button></div>}
                    </div>

                    {/* IMAGE */}
                    <div className="group relative mb-3 flex h-36 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50/60 p-3 shadow-inner sm:h-40">
                      {product.images?.[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          width={600}
                          height={400}
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="h-full w-full object-contain object-center transition duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <span className="text-xs font-medium text-slate-400">No image available</span>
                      )}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-slate-900/5 to-transparent" />
                    </div>

                    {/* NAME */}
                    <h3 className="text-sm font-medium text-gray-900 leading-tight">
                      {product.name}
                    </h3>

                    {/* TAGLINE */}
                    {product.tagline && (
                      <p className="text-xs text-gray-600 italic leading-snug">
                        {product.tagline}
                      </p>
                    )}

                    {/* SLUG */}
                    <p className="text-[11px] text-gray-500 mt-1 truncate">
                      Slug: <span className="font-mono">{product.slug}</span>
                    </p>

                    {/* LINK */}
                    <Link
                      href={`/${product.slug}`}
                      target="_blank"
                      className="block text-[11px] text-blue-600 truncate"
                    >
                      {process.env.NEXT_PUBLIC_FRONTEND_URL}/{product.slug}
                    </Link>

                    {/* PRICE */}
                    <div className="flex items-center gap-1 mt-1">
                      <IndianRupee className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-sm font-semibold text-green-600">
                        {formatPrice(product.price)}
                      </span>
                    </div>

                    {/* RATING */}
                    {product.rating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        {renderStars(product.rating)}
                        <span className="text-[11px] text-gray-500">
                          ({product.rating})
                        </span>
                      </div>
                    )}

                    {/* DESCRIPTION */}
                    {product.description && (
                      <p className="text-xs text-gray-700 mt-1 line-clamp-2 leading-snug">
                        {product.description}
                      </p>
                    )}

                    {/* ACTIONS */}
                    <div className="flex gap-2 mt-3 pt-2 border-t">
                      <button
                        onClick={() => startEdit(product)}
                        className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white py-1 rounded text-xs hover:bg-blue-700 transition cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(product._id)}
                        className="flex-1 flex items-center justify-center gap-1 bg-red-600 text-white py-1 rounded text-xs hover:bg-red-700 transition cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {moveProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setMoveProduct(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between"><h3 className="text-base font-semibold text-gray-900">Move product</h3><button onClick={() => setMoveProduct(null)} className="text-gray-500">×</button></div>
            <p className="mb-4 truncate text-sm text-gray-600">{moveProduct.name}</p>
            <label className="mb-3 block text-xs font-medium text-gray-700">Category<select value={moveCategoryId} onChange={(event) => { setMoveCategoryId(event.target.value); setMovePosition("0"); }} className="mt-1 w-full rounded-md border px-3 py-2 text-sm">{categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select></label>
            <label className="mb-5 block text-xs font-medium text-gray-700">Position<select value={movePosition} onChange={(event) => setMovePosition(event.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm">{Array.from({ length: products.filter((product) => product.categoryId?._id === moveCategoryId && product._id !== moveProduct._id).length + 1 }, (_, index) => <option key={index} value={index}>{index + 1}</option>)}</select></label>
            <div className="flex justify-end gap-2"><button onClick={() => setMoveProduct(null)} className="rounded-md border px-4 py-2 text-sm">Cancel</button><button onClick={saveMove} disabled={savingMove} className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50">{savingMove ? "Moving..." : "Move product"}</button></div>
          </div>
        </div>
      )}
      {/* UNCATEGORIZED */}
      {uncategorizedProducts.length > 0 && (
        <div className="border rounded-md bg-white p-3">
          <h2 className="text-sm font-semibold text-gray-800 mb-2">
            Uncategorized ({uncategorizedProducts.length})
          </h2>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {uncategorizedProducts.map((product) => (
              <div
                key={product._id}
                className="bg-white border rounded-md p-3"
              >
                <h3 className="text-sm font-medium">{product.name}</h3>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => startEdit(product)}
                    className="flex-1 bg-blue-600 text-white py-1 rounded text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="flex-1 bg-red-600 text-white py-1 rounded text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {products.length === 0 && (
        <div className="text-center py-10 text-sm text-gray-500">
          No products found
        </div>
      )}
    </div>
  );
};

export default SearchAllProducts;