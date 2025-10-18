// backend/models/Request.js
import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ["Nieuw", "Geaccepteerd", "Afgewezen", "Opgevolgd"],
    default: "Nieuw",
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  date: { type: Date, default: Date.now },
});

const Request = mongoose.models.Request || mongoose.model("Request", requestSchema);
export default Request;
