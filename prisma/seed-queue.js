import connectDB from "../lib/mongodb.js";
import User from "../models/User.js";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";

async function seedQueue() {
  await connectDB();

  console.log("Seeding today's queue appointments...");

  const todayStr = new Date().toISOString().split("T")[0];

  // 1. Delete any existing appointments for today first to avoid duplication
  await Appointment.deleteMany({ date: todayStr });
  console.log("Cleared today's existing appointments.");

  // 2. Fetch some seeded patient profiles
  const patients = await Patient.find().populate("userId").limit(7);
  if (patients.length < 7) {
    console.error("Not enough patients found! Please run npm run seed first.");
    process.exit(1);
  }

  const sampleReasons = [
    "Severe headache and fever symptoms",
    "Request for medical certificate clearance for registration",
    "Routine optical checkup and prescription lens update",
    "Dental consultation for toothache",
    "General medical checkup and vitals assessment",
    "Severe stomach pains and nauseous feelings",
    "Allergies and chest congestion symptoms"
  ];

  const sampleDepts = [
    "General Clinic",
    "General Clinic",
    "Laboratory",
    "Dental Unit",
    "General Clinic",
    "Pharmacy",
    "General Clinic"
  ];

  const times = ["08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];
  const statuses = ["completed", "completed", "serving", "approved", "approved", "approved", "no_show"];

  for (let i = 0; i < 7; i++) {
    const p = patients[i];
    await Appointment.create({
      patientId: p._id,
      reason: sampleReasons[i],
      departmentName: sampleDepts[i],
      date: todayStr,
      time: times[i],
      status: statuses[i],
      doctorName: "Clinic Staff"
    });
    console.log(`Created queue appointment today at ${times[i]} for student: ${p.userId?.name || "Unknown"} (${statuses[i]})`);
  }

  console.log("Successfully seeded 7 queue entries for today!");
  process.exit(0);
}

seedQueue().catch(console.error);
