import mongoose from "mongoose";

const PatientSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    studentId: { type: String, unique: true, sparse: true }, // For FUTMinna students/staff
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    age: { type: Number },
    address: { type: String },
    faculty: { type: String }, // e.g. "SICT", "SEET"
    department: { type: String }, // e.g. "Computer Science", "Cyber Security"
    emergencyContact: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Patient || mongoose.model("Patient", PatientSchema);
