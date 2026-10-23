import { Request, Response } from "express";
import { Product, ProductModel } from "../models/products.model";
import { UploadApiResponse } from "cloudinary";
import cloudinary from "../config/cloudinary";
import { Category, CategoryModel } from "../models/categories.model";
import axios from "axios";

export const createProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const productData: Product = {
      ...req.body,
      price: Number(req.body.price),
      rating: Number(req.body.rating),
      features: JSON.parse(req.body.features || "[]"),
      characteristics: JSON.parse(req.body.characteristics || "[]"),
      labels: JSON.parse(req.body.labels || "[]"),
      packaging: JSON.parse(req.body.packaging || "{}"),
      keywords: JSON.parse(req.body.keywords || "[]"),
    };
    if (!productData || Object.keys(productData).length === 0) {
      res.status(400).json({
        message: "Product data is required. Missing Fields.",
      });
      return;
    }

    productData.keywords =
      productData.keywords
        ?.map((keyword: string) => keyword.trim())
        .filter((keyword: string) => keyword.length > 0) || [];

    const categoryData: Category | null = await CategoryModel.findById(
      productData.categoryId,
    );
    if (!categoryData || Object.keys(categoryData).length === 0) {
      res.status(400).json({
        message: "   Id is not valid. Category not found.",
      });
      return;
    }

    const uploadedImages: string[] = [];

    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files as Express.Multer.File[]) {
        const uploadResult: UploadApiResponse = await new Promise(
          (resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: `category/${categoryData.name}/${productData.name}`,
                transformation: [
                  {
                    fetch_format: "auto",
                    quality: "auto",
                  },
                ],
              },
              (error, result) => {
                if (error) return reject(error);
                resolve(result as UploadApiResponse);
              },
            );
            stream.end(file.buffer);
          },
        );

        uploadedImages.push(uploadResult.secure_url);
      }
    }

    productData.images = uploadedImages;
    const newProduct = await ProductModel.create(productData);
    const populatedProduct = await newProduct.populate<{
      categoryId: Category;
    }>("categoryId");

    await axios.get(`${process.env.FRONTEND_URL}/api/revalidate`, {
      params: {
        paths: JSON.stringify([
          `/${productData.slug}`,
          `/${populatedProduct.categoryId.slug}`,
        ]),
        secret: process.env.REVALIDATE_SECRET,
      },
    });

    res.status(201).json({
      message: "Product created successfully.",
      newProduct,
    });
  } catch (error: any) {
    console.error("Error creating product:", error);

    if (error.code === 11000 && error.keyPattern?.slug) {
      res.status(409).json({
        message: "Slug already exists. Please try a different name.",
      });
      return;
    }

    res.status(500).json({
      message:
        "Something went wrong while creating the product. Please try again later.",
      error,
    });
  }
};

export const getProductBySlug = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { slug } = req.params;

    if (!slug) {
      res.status(400).json({
        message: "Slug parameter is required.",
      });
      return;
    }

    const product = await ProductModel.findOne({ slug }).populate("categoryId");

    if (!product) {
      res.status(404).json({
        message: "Product not found.",
      });
      return;
    }

    res.status(200).json({
      message: "Product fetched successfully.",
      product,
    });
  } catch (error) {
    console.error("Error fetching product by slug:", error);
    res.status(500).json({
      message:
        "Something went wrong while fetching the product. Please try again later.",
      error,
    });
  }
};

export const updateProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      originalSlug,
      name,
      slug,
      description,
      tagline,
      price,
      rating,
      features,
      characteristics,
      categoryId,
      labels,
      packaging,
      yt_video_url,
      existingImages,
      keywords,
    } = req.body;

    if (!originalSlug) {
      res.status(400).json({ message: "Original slug is required." });
      return;
    }

    // Fetch existing product with its category
    const existingProduct = await ProductModel.findOne({
      slug: originalSlug,
    }).populate<{ categoryId: Category }>("categoryId");

    if (!existingProduct) {
      res.status(404).json({ message: "Product not found." });
      return;
    }

    if (categoryId) {
      const categoryExists = await CategoryModel.findById(categoryId);
      if (!categoryExists) {
        res.status(400).json({ message: "Invalid categoryId." });
        return;
      }
    }

    let categoryName = existingProduct.categoryId.name;

    if (categoryId) {
      const newCategory = await CategoryModel.findById(categoryId);
      if (newCategory) {
        categoryName = newCategory.name;
      }
    }

    // Parse incoming JSON fields
    const parsedFeatures = features
      ? JSON.parse(features)
      : existingProduct.features;
    const parsedPackaging = packaging
      ? JSON.parse(packaging)
      : existingProduct.packaging;
    const parsedCharacteristics = characteristics
      ? JSON.parse(characteristics)
      : existingProduct.characteristics;
    const parsedLabels = labels ? JSON.parse(labels) : existingProduct.labels;
    const parsedKeywords = keywords
      ? JSON.parse(keywords)
          .map((keyword: string) => keyword.trim())
          .filter((keyword: string) => keyword.length > 0)
      : existingProduct.keywords;

    let parsedExistingImages: string[] = [];
    if (existingImages) {
      parsedExistingImages = JSON.parse(existingImages);
    }

    // Upload NEW files only
    const uploadedFiles = req.files as Express.Multer.File[];
    const newImageUrls: string[] = [];

    if (uploadedFiles && uploadedFiles.length > 0) {
      for (const file of uploadedFiles) {
        const uploadResult: UploadApiResponse = await new Promise(
          (resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: `category/${categoryName}/${name || existingProduct.name}`,
                transformation: [
                  {
                    fetch_format: "auto",
                    quality: "auto",
                  },
                ],
              },
              (error, result) => {
                if (error) return reject(error);
                resolve(result as UploadApiResponse);
              },
            );
            stream.end(file.buffer);
          },
        );
        newImageUrls.push(uploadResult.secure_url);
      }
    }

    // ❗ CRITICAL FIX:
    // If no new images uploaded AND existingImages is empty -> DO NOT touch images
    let finalImages: string[] | undefined = undefined;

    if (parsedExistingImages.length > 0 || newImageUrls.length > 0) {
      finalImages = [...parsedExistingImages, ...newImageUrls];
    }

    // Prepare update data (images added only if finalImages exists)
    const updateData: any = {
      slug,
      name,
      price,
      rating,
      tagline,
      description,
      yt_video_url,
      features: parsedFeatures,
      packaging: parsedPackaging,
      characteristics: parsedCharacteristics,
      labels: parsedLabels,
      keywords: parsedKeywords,
      categoryId,
    };

    if (finalImages !== undefined) {
      updateData.images = finalImages; // Only update if user touched images
    }

    // Remove undefined fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updatedProduct = await ProductModel.findOneAndUpdate(
      { slug: originalSlug },
      updateData,
      { new: true },
    );

    if (!updatedProduct) {
      res.status(404).json({ message: "Product not found." });
      return;
    }

    const populatedProduct = await updatedProduct.populate<{
      categoryId: Category;
    }>("categoryId");

    await axios.get(`${process.env.FRONTEND_URL}/api/revalidate`, {
      params: {
        paths: JSON.stringify([
          `/${populatedProduct.slug}`,
          `/${populatedProduct.categoryId.slug}`,
        ]),
        secret: process.env.REVALIDATE_SECRET,
      },
    });

    res.status(200).json({
      message: "Product updated successfully.",
      updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      message:
        "Something went wrong while updating the product. Please try again later.",
      error,
    });
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { slug } = req.params;

    if (!slug) {
      res.status(400).json({
        message: "Slug parameter is required.",
      });
      return;
    }

    const deletedProduct = await ProductModel.findOneAndDelete({ slug });

    if (!deletedProduct) {
      res.status(404).json({
        message: "Product not found.",
      });
      return;
    }

    const populatedProduct = await deletedProduct.populate<{
      categoryId: Category;
    }>("categoryId");

    await axios.get(`${process.env.FRONTEND_URL}/api/revalidate`, {
      params: {
        paths: JSON.stringify([
          `/${populatedProduct.slug}`,
          `/${populatedProduct.categoryId.slug}`,
        ]),
        secret: process.env.REVALIDATE_SECRET,
      },
    });

    res.status(200).json({
      message: "Product deleted successfully.",
      deletedProduct,
    });
    return;
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      message:
        "Something went wrong while deleting the product. Please try again later.",
      error,
    });
  }
};

export const getAllProducts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const allProducts = await ProductModel.find().populate("categoryId").sort({ categoryId: 1, sortOrder: 1, createdAt: 1 });

    if (!allProducts || allProducts.length === 0) {
      res.status(404).json({
        message: "No products found.",
      });
      return;
    }

    res.status(200).json({
      message: "Products fetched successfully.",
      products: allProducts,
    });
  } catch (error) {
    console.error("Error fetching all products:", error);
    res.status(500).json({
      message:
        "Something went wrong while fetching all the products. Please try again later.",
      error,
    });
  }
};

export const getProductByCategory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { categoryId } = req.body;

    if (!categoryId) {
      res.status(400).json({
        message: "Category Id is required.",
      });
      return;
    }

    const products = await ProductModel.find({ categoryId: categoryId }).sort({ sortOrder: 1, createdAt: 1 });

    if (!products || products.length === 0) {
      res.status(404).json({
        message: "No products found for this category.",
      });
      return;
    }

    res.status(200).json({
      message: "Products fetched successfully.",
      products,
    });
  } catch (error) {
    console.error("Error fetching products by category:", error);
    res.status(500).json({
      message:
        "Something went wrong while fetching the products. Please try again later.",
      error,
    });
  }
};

export const reorderProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { productId, categoryId, position } = req.body;
    const targetPosition = Number(position);
    if (!productId || !categoryId || !Number.isInteger(targetPosition) || targetPosition < 0) {
      res.status(400).json({ message: "productId, categoryId and a valid position are required." });
      return;
    }

    const [product, targetCategory] = await Promise.all([
      ProductModel.findById(productId),
      CategoryModel.findById(categoryId),
    ]);
    if (!product) { res.status(404).json({ message: "Product not found." }); return; }
    if (!targetCategory) { res.status(400).json({ message: "Invalid categoryId." }); return; }

    const sourceCategoryId = product.categoryId.toString();
    const sourceCategory = await CategoryModel.findById(sourceCategoryId);
    const targetCategoryId = categoryId.toString();
    const categoryIds = sourceCategoryId === targetCategoryId
      ? [sourceCategoryId]
      : [sourceCategoryId, targetCategoryId];
    const categoryProducts = await ProductModel.find({ categoryId: { $in: categoryIds } })
      .sort({ sortOrder: 1, createdAt: 1, _id: 1 });
    const sourceProducts = categoryProducts.filter((item) =>
      item.categoryId.toString() === sourceCategoryId && item._id.toString() !== productId.toString(),
    );
    const targetProducts = sourceCategoryId === targetCategoryId
      ? sourceProducts
      : categoryProducts.filter((item) => item.categoryId.toString() === targetCategoryId);
    const nextTargetProducts = [...targetProducts];
    nextTargetProducts.splice(Math.min(targetPosition, nextTargetProducts.length), 0, product);

    await ProductModel.bulkWrite([
      ...sourceProducts.map((item, index) => ({ updateOne: { filter: { _id: item._id }, update: { $set: { sortOrder: index } } } })),
      ...nextTargetProducts.map((item, index) => ({ updateOne: { filter: { _id: item._id }, update: { $set: { categoryId: targetCategory._id, sortOrder: index } } } })),
    ]);
    const updatedProduct = await ProductModel.findById(productId).populate("categoryId");
    const affectedProducts = await ProductModel.find({ categoryId: { $in: categoryIds } }).populate("categoryId").sort({ sortOrder: 1, createdAt: 1, _id: 1 });
    try {
      const paths = [`/${targetCategory.slug}`, `/${updatedProduct?.slug}`];
      if (sourceCategory && sourceCategory.slug !== targetCategory.slug) paths.push(`/${sourceCategory.slug}`);
      await axios.get(`${process.env.FRONTEND_URL}/api/revalidate`, { params: { paths: JSON.stringify(paths), secret: process.env.REVALIDATE_SECRET } });
    } catch (revalidationError) {
      console.error("Failed to revalidate product pages:", revalidationError);
    }
    res.status(200).json({ message: "Product moved successfully.", updatedProduct, products: affectedProducts });
  } catch (error) {
    console.error("Error reordering product:", error);
    res.status(500).json({ message: "Something went wrong while moving the product.", error });
  }
};
export const toggleProductPriority = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { productId, isPriority } = req.body;
    if (!productId || typeof isPriority !== "boolean") {
      res.status(400).json({ message: "productId and isPriority are required." });
      return;
    }

    const selectedProduct = await ProductModel.findById(productId);
    if (!selectedProduct) {
      res.status(404).json({ message: "Product not found." });
      return;
    }

    // Priority is exclusive within a category: selecting one clears the old one.
    if (isPriority) {
      await ProductModel.updateMany(
        { categoryId: selectedProduct.categoryId, _id: { $ne: productId } },
        { $set: { isPriority: false } },
      );
    }

    const product = await ProductModel.findByIdAndUpdate(
      productId,
      { isPriority },
      { new: true },
    ).populate("categoryId");
    if (!product) {
      res.status(404).json({ message: "Product not found." });
      return;
    }

    try {
      const category = product.categoryId as unknown as { slug?: string };
      const paths = ["/", `/${product.slug}`];
      if (category?.slug) paths.push(`/${category.slug}`);
      await axios.get(`${process.env.FRONTEND_URL}/api/revalidate`, {
        params: { paths: JSON.stringify(paths), secret: process.env.REVALIDATE_SECRET },
      });
    } catch (revalidationError) {
      console.error("Failed to revalidate priority pages:", revalidationError);
    }

    const affectedProducts = await ProductModel.find({ categoryId: selectedProduct.categoryId }).populate("categoryId").sort({ sortOrder: 1, createdAt: 1, _id: 1 });
    res.status(200).json({ message: "Product priority updated.", updatedProduct: product, products: affectedProducts });
  } catch (error) {
    console.error("Error updating product priority:", error);
    res.status(500).json({ message: "Something went wrong while updating product priority.", error });
  }
};