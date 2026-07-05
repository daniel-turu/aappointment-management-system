import mongoose from "mongoose";

const StaffSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    specialization: { type: String },
    workingDays: { 
        type: [String], 
        default: ["MON", "TUE", "WED", "THU", "FRI"] // Days of the week they are available
    },
    slotDuration: { type: Number, default: 30 }, // Appointment duration in minutes
  },
  { timestamps: true }
);

export default mongoose.models.Staff || mongoose.model("Staff", StaffSchema);
