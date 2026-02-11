import mongoose from "mongoose";

const FavoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    url: { type: String, required: true, trim: true }, // original article URL (unique per user)
    title: { type: String },
    source: { type: String },
    urlToImage: { type: String },
    publishedAt: { type: Date },
    description: { type: String }, // Article description/summary
    content: { type: String }, // Article content snippet
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Ensure one favorite per URL per user
FavoriteSchema.index({ userId: 1, url: 1 }, { unique: true });

export const Favorite = mongoose.model("Favorite", FavoriteSchema);
