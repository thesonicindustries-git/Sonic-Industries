import mongoose, { Schema, Document } from "mongoose";

export interface Blog extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  author: string;
  category: string;
  tags: string[];
  published: boolean;
  scheduledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const blogSchema = new Schema<Blog>(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: { type: String, default: "" },
    content: { type: String, required: true, maxlength: 50000 },
    coverImageUrl: { type: String, required: true },
    author: { type: String, trim: true, default: "Sonic Industries", maxlength: 100 },
    category: { type: String, trim: true, default: "", maxlength: 80 },
    tags: {
      type: [{ type: String, trim: true, maxlength: 40 }],
      default: [],
      validate: {
        validator: (value: string[]) => value.length <= 10,
        message: "A blog can have a maximum of 10 tags.",
      },
    },
    published: { type: Boolean, default: true },
    scheduledAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

export const BlogModel = mongoose.model<Blog>("Blog", blogSchema);
