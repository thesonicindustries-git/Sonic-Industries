import { Request, Response } from "express";
import { Category, CategoryModel } from "../models/categories.model";
import { Product, ProductModel } from "../models/products.model";
import axios from "axios";
import { startSession } from "mongoose";

export const getCategoryBySlug = async (
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

    const category = await CategoryModel.findOne({ slug });

    if (!category) {
      res.status(404).json({
        message: "Category not found.",
      });
      return;
    }

    res.status(200).json({
      message: "Category fetched successfully.",
      category,
    });
  } catch (error) {
    console.error("Error fetching category by slug:", error);
    res.status(500).json({
      message:
        "Something went wrong while fetching the category. Please try again later.",
      error,
    });
  }
};

export const getAllCategories = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const allCategories = await CategoryModel.find();

    if (!allCategories || allCategories.length === 0) {
      res.status(404).json({
        message: "No categories found.",
      });
      return;
    }

    res.status(200).json({
      message: "Categories fetched successfully.",
      categories: allCategories,
    });
  } catch (error) {
    console.error("Error fetching all categories:", error);
    res.status(500).json({
      message:
        "Something went wrong while fetching the categories. Please try again later.",
      error,
    });
  }
};

export const createCategory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const categoryData: Category = req.body;

    if (!categoryData || Object.keys(categoryData).length === 0) {
      res.status(400).json({
        message: "Category data is required.",
      });
      return;
    }

    // Trim important fields at backend level
    categoryData.name = categoryData.name?.trim();
    categoryData.slug = categoryData.slug?.trim();

    categoryData.keywords =
      categoryData.keywords
        ?.map((keyword) => keyword.trim())
        .filter((keyword) => keyword.length > 0) || [];

    if (!categoryData.name || !categoryData.slug) {
      res.status(400).json({
        message: "Category name and slug are required.",
      });
      return;
    }

    const newCategory = await CategoryModel.create(categoryData);

    await axios.get(`${process.env.FRONTEND_URL}/api/revalidate`, {
      params: {
        paths: JSON.stringify([`/${newCategory.slug}`]),
        secret: process.env.REVALIDATE_SECRET,
      },
    });

    res.status(201).json({
      message: "Category created successfully.",
      newCategory,
    });
    return;
  } catch (error: any) {
    console.error("Error creating category: ", error);

    // ✅ Handle duplicate slug error
    if (error.code === 11000 && error.keyPattern?.slug) {
      res.status(409).json({
        message: "Slug already exists. Please try a different name.",
      });
      return;
    }

    res.status(500).json({
      message:
        "Something went wrong while creating the category. Please try again later.",
    });
  }
};

export const updateCategory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { slug, ...rest } = req.body;

    if (!slug || Object.keys(rest).length === 0) {
      res.status(400).json({
        message: "Slug and category data are required.",
      });
      return;
    }

    if (rest.keywords) {
      rest.keywords = rest.keywords
        .map((keyword: string) => keyword.trim())
        .filter((keyword: string) => keyword.length > 0);
    }

    const updatedCategory = await CategoryModel.findOneAndUpdate(
      { slug },
      rest,
      { new: true, overwrite: true },
    );

    if (!updatedCategory) {
      res.status(404).json({
        message: "Category not found.",
      });
      return;
    }

    console.log(`${process.env.FRONTEND_URL}/api/revalidate`);
    await axios.get(`${process.env.FRONTEND_URL}/api/revalidate`, {
      params: {
        paths: JSON.stringify([`/${updatedCategory.slug}`]),
        secret: process.env.REVALIDATE_SECRET,
      },
    });
    console.log("done");

    res.status(200).json({
      message: "Category updated successfully.",
      updatedCategory,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      message:
        "Something went wrong while updating the category. Please try again later.",
      error,
    });
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const session = await startSession();
  session.startTransaction();

  try {
    const { slug } = req.params;

    if (!slug) {
      res.status(400).json({
        message: "Slug parameter is required.",
      });
      return;
    }

    const category = await CategoryModel.findOne({ slug }).session(session);

    if (!category) {
      res.status(404).json({ message: "Category not found." });
      return;
    }

    await ProductModel.deleteMany({ categoryId: category._id }, { session });

    const deletedCategory = await CategoryModel.findByIdAndDelete(
      category._id,
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    await axios.get(`${process.env.FRONTEND_URL}/api/revalidate`, {
      params: {
        paths: JSON.stringify([`/${deletedCategory?.slug}`]),
        secret: process.env.REVALIDATE_SECRET,
      },
    });

    res.status(200).json({
      message: "Category deleted successfully.",
      deletedCategory,
    });
    return;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error deleting category:", error);
    res.status(500).json({
      message:
        "Something went wrong while deleting the category. Please try again later.",
      error,
    });
  }
};

export const getCategoryImages = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await CategoryModel.findById(id);
    if (!category) {
      res.status(404).json({
        message: "Category not found",
      });
      return;
    }

    const allProducts: Product[] = await ProductModel.find({ categoryId: id }).sort({ sortOrder: 1, createdAt: 1, _id: 1 });
    const allImages = allProducts.flatMap((p) => p.images);

    const uniqueImages = Array.from(new Set<string>(allImages));
    res.status(201).json({
      message: `Found ${uniqueImages.length} images for category ${category.name}`,
      images: uniqueImages,
      products: allProducts,
    });
  } catch (error) {
    console.error("Error fetching category images: ", error);
    res.status(500).json({
      message:
        "Something went wrong while fetching the category images. Please try again later.",
      error,
    });
  }
};
