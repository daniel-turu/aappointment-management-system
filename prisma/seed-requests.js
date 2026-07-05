import connectDB from "../lib/mongodb.js";
import User from "../models/User.js";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";

async function seedRequests() {
  await connectDB();

  console.log("Seeding pending appointment requests...");

  // 1. Delete any existing pending appointments to prevent cluttering
  await Appointment.deleteMany({ status: "pending" });
  console.log("Cleared existing pending appointments.");

  // 2. Fetch seeded patients (skipping first 7 to get fresh students)
  const patients = await Patient.find().populate("userId").skip(7).limit(9);
  if (patients.length < 9) {
    console.error("Not enough patients found! Please run npm run seed first.");
    process.exit(1);
  }

  const sampleReasons = [
    "Experiencing dry cough, sore throat, and slight breathing difficulty since yesterday.",
    "Need to consult a doctor regarding a persistent skin rash on my left arm.",
    "Requesting a routine medical checkup and clearance form for my industrial attachment.",
    "Suffering from sharp abdominal pains after meals, lasting for about three days.",
    "I need a prescription refill for my allergy medication and a quick checkup.",
    "Chronic lower back pain after lifting heavy equipment during workshop practice.",
    "Sprained my ankle playing football at the school sports complex this morning.",
    "Experiencing severe migraine headaches and blurry vision under bright light.",
    "Need blood pressure checkup and doctor consultation for recurring dizziness."
  ];

  for (let i = 0; i < 9; i++) {
    const p = patients[i];
    await Appointment.create({
      patientId: p._id,
      reason: sampleReasons[i],
      status: "pending",
      departmentName: "Pending Review",
      doctorName: "Pending Assignment",
      date: null,
      time: null
    });
    console.log(`Created pending request for student: ${p.userId?.name || "Unknown"}`);
  }

  console.log("Successfully seeded 9 pending appointment requests!");
  process.exit(0);
}

seedRequests().catch(console.error);
