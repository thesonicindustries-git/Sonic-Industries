import mongoose, { Schema, Document, Types } from "mongoose";

export interface BlogLike extends Document {
  blogId: Types.ObjectId;
  ipHash: string;
}

export interface BlogComment extends Document {
  blogId: Types.ObjectId;
  ipHash: string;
  name: string;
  text: string;
  createdAt: Date;
}

const likeSchema = new Schema<BlogLike>(
  {
    blogId: { type: Schema.Types.ObjectId, ref: "Blog", required: true },
    ipHash: { type: String, required: true },
  },
  { timestamps: true }
);

// One like per IP per post (the database itself enforces this)
likeSchema.index({ blogId: 1, ipHash: 1 }, { unique: true });

const commentSchema = new Schema<BlogComment>(
  {
    blogId: { type: Schema.Types.ObjectId, ref: "Blog", required: true },
    ipHash: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 50 },
    text: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

// One comment per IP per post
commentSchema.index({ blogId: 1, ipHash: 1 }, { unique: true });

export const BlogLikeModel = mongoose.model<BlogLike>("BlogLike", likeSchema);
export const BlogCommentModel = mongoose.model<BlogComment>(
  "BlogComment",
  commentSchema
);
