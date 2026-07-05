import connectDB from "../lib/mongodb.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import Staff from "../models/Staff.js";
import Patient from "../models/Patient.js";

async function seed() {
  await connectDB();

  console.log("Seeding database...");

  // 1. Create Admin User
  const adminExists = await User.findOne({ email: "admin@futminna.edu.ng" });
  if (!adminExists) {
    await User.create({
      name: "System Admin",
      email: "admin@futminna.edu.ng",
      password: "password123", // Will be hashed by pre-save hook
      role: "admin",
    });
    console.log("Admin user created.");
  } else {
    console.log("Admin user already exists.");
  }

  // 2. Create Default Departments
  const departments = [
    { name: "General Clinic", description: "General consultations and primary care." },
    { name: "Dental Unit", description: "Dental care and oral hygiene." },
    { name: "Laboratory", description: "Medical tests and diagnostics." },
    { name: "Pharmacy", description: "Drug dispensing and consultation." },
  ];

  const deptMap = {};
  for (const dep of departments) {
    let doc = await Department.findOne({ name: dep.name });
    if (!doc) {
      doc = await Department.create(dep);
      console.log(`Department '${dep.name}' created.`);
    }
    deptMap[dep.name] = doc._id;
  }

  // Cleanup old doctor account if it exists
  const oldDoctor = await User.findOne({ email: "doctor@futminna.edu.ng" });
  if (oldDoctor) {
    await Staff.deleteOne({ userId: oldDoctor._id });
    await User.deleteOne({ _id: oldDoctor._id });
    console.log("Cleaned up old doctor@futminna.edu.ng account.");
  }

  // 3. Create Default Staff User (Clinic Secretary for triage & scheduling)
  const staffExists = await User.findOne({ email: "secretary@futminna.edu.ng" });
  if (!staffExists) {
    const staffUser = await User.create({
      name: "Clinic Secretary",
      email: "secretary@futminna.edu.ng",
      password: "password123",
      role: "staff",
    });

    await Staff.create({
      userId: staffUser._id,
      departmentId: deptMap["General Clinic"],
      specialization: "Clinic Reception / Triage",
      workingDays: ["MON", "TUE", "WED", "THU", "FRI"],
      slotDuration: 30
    });

    console.log("Staff secretary user created and linked.");
  } else {
    console.log("Staff secretary user already exists.");
  }

  // 4. Create 15 Patient Student Accounts
  const studentAccounts = [
    { name: "Gideon Okoro", email: "gideon.okoro@futminna.edu.ng", studentId: "2021/1/65842CS", phone: "08012345678", gender: "Male", age: 21, faculty: "SICT", department: "Computer Science" },
    { name: "Zainab Abubakar", email: "zainab.abubakar@futminna.edu.ng", studentId: "2022/2/74185CY", phone: "08087654321", gender: "Female", age: 20, faculty: "SICT", department: "Cyber Security Science" },
    { name: "Chinedu Okafor", email: "chinedu.okafor@futminna.edu.ng", studentId: "2020/1/41235EE", phone: "09011223344", gender: "Male", age: 23, faculty: "SEET", department: "Electrical Engineering" },
    { name: "Fatima Yusuf", email: "fatima.yusuf@futminna.edu.ng", studentId: "2021/2/55698IT", phone: "07033445566", gender: "Female", age: 22, faculty: "SICT", department: "Information Technology" },
    { name: "Tunde Balogun", email: "tunde.balogun@futminna.edu.ng", studentId: "2020/1/88965ME", phone: "08055667788", gender: "Male", age: 24, faculty: "SEET", department: "Mechanical Engineering" },
    { name: "Chioma Nnaji", email: "chioma.nnaji@futminna.edu.ng", studentId: "2022/1/66987BC", phone: "08199887766", gender: "Female", age: 19, faculty: "SLS", department: "Biochemistry" },
    { name: "Musa Ibrahim", email: "musa.ibrahim@futminna.edu.ng", studentId: "2021/1/44785CV", phone: "09077665544", gender: "Male", age: 22, faculty: "SEES", department: "Civil Engineering" },
    { name: "Blessing David", email: "blessing.david@futminna.edu.ng", studentId: "2021/2/22369MB", phone: "08099887744", gender: "Female", age: 21, faculty: "SLS", department: "Microbiology" },
    { name: "Emeka Obi", email: "emeka.obi@futminna.edu.ng", studentId: "2020/2/33587AR", phone: "09122334455", gender: "Male", age: 23, faculty: "SEES", department: "Architecture" },
    { name: "Aishat Bello", email: "aishat.bello@futminna.edu.ng", studentId: "2022/1/11458QS", phone: "08022334466", gender: "Female", age: 20, faculty: "SEES", department: "Quantity Surveying" },
    { name: "Oluwaseun Adewale", email: "seun.adewale@futminna.edu.ng", studentId: "2021/1/88542TS", phone: "07066778899", gender: "Male", age: 22, faculty: "SICT", department: "Telecommunication Science" },
    { name: "Mary Johnson", email: "mary.johnson@futminna.edu.ng", studentId: "2020/1/77485MT", phone: "08144556677", gender: "Female", age: 24, faculty: "SEET", department: "Mechatronics Engineering" },
    { name: "Abubakar Sadiq", email: "sadiq.abubakar@futminna.edu.ng", studentId: "2021/2/11258CS", phone: "08088990011", gender: "Male", age: 21, faculty: "SICT", department: "Computer Science" },
    { name: "Funmilayo Alao", email: "funmi.alao@futminna.edu.ng", studentId: "2022/2/88963CY", phone: "09055443322", gender: "Female", age: 19, faculty: "SICT", department: "Cyber Security Science" },
    { name: "Joshua Daniel", email: "joshua.daniel@futminna.edu.ng", studentId: "2020/1/99854EE", phone: "08122334499", gender: "Male", age: 23, faculty: "SEET", department: "Electrical Engineering" },
  ];

  for (const s of studentAccounts) {
    const studentExists = await User.findOne({ email: s.email });
    if (!studentExists) {
      const user = await User.create({
        name: s.name,
        email: s.email,
        phone: s.phone,
        password: "password123",
        role: "patient",
        isActive: true
      });

      await Patient.create({
        userId: user._id,
        studentId: s.studentId,
        gender: s.gender,
        age: s.age,
        address: "Minna, Niger State",
        faculty: s.faculty,
        department: s.department,
        emergencyContact: "08099887766"
      });

      console.log(`Student account for '${s.name}' created.`);
    } else {
      console.log(`Student account for '${s.name}' already exists.`);
    }
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch(console.error);
