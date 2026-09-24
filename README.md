# FUTMinna Appointment Management System

A Next.js 16 appointment management system running locally with Cloud MongoDB (Atlas) and local file storage.

---

## ⚡ Quick Setup Guide

### Step 1: Configure Your Online MongoDB URI
Open `.env.local` in the project root and add your online MongoDB URI (e.g. from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)):

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/futminna_ams?retryWrites=true&w=majority
NEXTAUTH_SECRET=futminna_ams_super_secret_local_key
NEXTAUTH_URL=http://localhost:3000
```

---

### Step 2: Seed Static Users to Online Database
Run the seed command to populate your online database with static users, departments, and sample queue data:

```bash
npm run seed:all
```

---

### Step 3: Run system locally
Start the Next.js local development server:

```bash
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

---

## 👥 Static Accounts (Populated in Online DB)

All static accounts are seeded with password: **`password123`**

| Role | Email | Password | Description |
|---|---|---|---|
| **Admin** | `admin@futminna.edu.ng` | `password123` | System Administrator |
| **Staff** | `secretary@futminna.edu.ng` | `password123` | Clinic Secretary / Triage |
| **Patient** | `gideon.okoro@futminna.edu.ng` | `password123` | Student (Computer Science) |
| **Patient** | `zainab.abubakar@futminna.edu.ng` | `password123` | Student (Cyber Security) |
| **Patient** | `chinedu.okafor@futminna.edu.ng` | `password123` | Student (Electrical Eng.) |

---

## 📂 Local File Storage

Uploaded files are saved locally in `/public/uploads/` on your computer.
* **API Handler**: `POST /api/upload` ([`app/api/upload/route.js`](file:///home/turu/Desktop/WorkingOn/Landlord%20Project/aappointment-management-system/app/api/upload/route.js))
* **Server Action**: `uploadLocalFile(formData)` in [`actions/upload.js`](file:///home/turu/Desktop/WorkingOn/Landlord%20Project/aappointment-management-system/actions/upload.js)
