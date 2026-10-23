import { Schema, InferSchemaType, model, Types } from "mongoose";

const CharacteristicsSchema = new Schema({
  image: { type: String },
  name: { type: String },
  desc: { type: String },
});

const ProductSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    tagline: { type: String, required: true },

    categoryId: { type: Types.ObjectId, ref: "Category", required: true },
    sortOrder: { type: Number },

    price: { type: Number, required: true },
    images: [{ type: String }], // image URLs
    rating: { type: Number, default: 0, min: 0, max: 5 },
    keywords: [{type: String}],

    features: [
      {
        name: { type: String },
        weight: { type: String },
      },
    ],

    characteristics: {
      desc1: { type: String },
      desc2: { type: String },
      items: [CharacteristicsSchema],
    },

    labels: [
      {
        x: { type: Number },
        y: { type: Number },
        name: { type: String },
        desc: { type: String },
      },
    ],

    packaging: {
      length: { type: Number },
      width: { type: Number },
      height: { type: Number },
    },

    yt_video_url: { type: String },
    unboxing_yt_video_url: { type: String },
  },
  {
    timestamps: true,
  }
);

export type Product = InferSchemaType<typeof ProductSchema> & {
  _id: Types.ObjectId;
};

export const ProductModel = model<Product>("Product", ProductSchema);
