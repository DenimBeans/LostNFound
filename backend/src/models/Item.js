import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },               // e.g., "Black Backpack"
    description: { type: String, trim: true },                         // optional details
    category: { type: String, trim: true },                            // e.g., Electronics, Apparel
    imageUrl: { type: String, trim: true },                            // optional
    lostAt: { type: Date },                                            // when it was lost (optional)
    locationText: { type: String, trim: true },                        // free-form: "BA1, 2nd floor lobby"
    status: { type: String, enum: ["lost", "claimed", "returned"], default: "lost" },

    reporterName: { type: String, required: true },                    // who reported
    reporterEmail: { type: String, required: true },                   // (no auth yet)

    claimerName: { type: String },                                     // filled when someone claims
    claimerEmail: { type: String },

    // campus geo (optional; can add later)
    lat: { type: Number },
    lng: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.model("Item", itemSchema);
