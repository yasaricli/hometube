import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const channelSchema = new mongoose.Schema(
  {
    ytId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    url: { type: String, default: "" },
    avatar: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 40 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const videoSchema = new mongoose.Schema(
  {
    ytId: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    duration: { type: Number, default: 0 },
    uploadedAt: Date,
    channel: { type: ObjectId, ref: "Channel", required: true },
    category: { type: ObjectId, ref: "Category" },
    // waiting: lost the connection, retried automatically at retryAt
    status: { type: String, enum: ["queued", "downloading", "waiting", "ready", "failed"], default: "queued" },
    retryAt: Date,
    // added from a channel list with just a title; the full details are read before downloading
    needsProbe: { type: Boolean, default: false },
    error: { type: String, default: "" },
    size: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// One document holding the download settings.
const settingsSchema = new mongoose.Schema({
  key: { type: String, default: "app", unique: true },
  // highest video height to download; 0 = the best available
  quality: { type: Number, default: 1080 },
  // H.264 + AAC plays in every browser; YouTube only offers it up to 1080p
  compatible: { type: Boolean, default: true },
  // MB/s; 0 = unlimited
  rateLimit: { type: Number, default: 0 },
});

export const Channel = mongoose.model("Channel", channelSchema);
export const Category = mongoose.model("Category", categorySchema);
export const Video = mongoose.model("Video", videoSchema);
export const Settings = mongoose.model("Settings", settingsSchema);

export const QUALITIES = [0, 2160, 1440, 1080, 720, 480, 360];
export const RATE_LIMITS = [0, 1, 2, 5, 10, 20, 50];

export async function getSettings() {
  const doc = await Settings.findOneAndUpdate({ key: "app" }, {}, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
  return { quality: doc.quality, compatible: doc.compatible, rateLimit: doc.rateLimit };
}
