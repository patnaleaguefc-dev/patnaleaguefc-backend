import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    teamName: { type: String, required: true, trim: true, unique: true },
    phone: { type: String, required: true, trim: true }, // 10 digits validated in frontend
    numPlayers: { type: Number, required: true, min: 7, max: 11 },
    paymentStatus: { type: String, enum: ["pending", "paid"], default: "pending" },
    uniqueCode: { type: String, required: true, unique: true },
    paymentRef: { type: String }, // Cashfree orderId or reference
  },
  { timestamps: true }
);

export default mongoose.model("Team", teamSchema);