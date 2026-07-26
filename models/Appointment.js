import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" }, // Optional
    doctorName: { type: String }, // Custom name of doctor or nurse assigned
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" }, // Assigned by admin/staff later
    departmentName: { type: String }, // Custom department name typed by staff
    date: { type: String }, // Format: YYYY-MM-DD or custom text (Assigned by admin/staff later)
    time: { type: String }, // Format: HH:mm or custom text (Assigned by admin/staff later)
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed", "cancelled", "no_show", "serving"],
      default: "pending",
    },
    reason: { type: String }, // Reason for visit
    rejectionReason: { type: String }, // Provided if status becomes "rejected"
    // Time Shift / Late Request Fields
    shiftRequested: { type: Boolean, default: false },
    requestedTime: { type: String },
    requestedDate: { type: String },
    shiftReason: { type: String },
    shiftStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    // Arrival Check System Fields
    arrivalStatus: {
      type: String,
      enum: ["none", "checking", "arrived", "delayed", "no_show_reported", "flagged_late", "completed"],
      default: "none",
    },
    arrivalCheckCount: { type: Number, default: 0 },
    arrivalEta: { type: String },
    etaExpiresAt: { type: Date },
    checkoutTime: { type: Date },
  },
  { timestamps: true }
);

if (mongoose.models.Appointment) {
  delete mongoose.models.Appointment;
}

const Appointment = mongoose.model("Appointment", AppointmentSchema);
export default Appointment;
