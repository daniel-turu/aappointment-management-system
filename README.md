# FUTMinna Appointment Management System

A Next.js & MongoDB based appointment management system containerized to run locally with Docker and local file storage.

## 🚀 Running Locally with Docker

### Prerequisites
- Docker Engine & Docker Compose installed on your system.

### Quick Start (One Command)
Run the following command in the project root directory:

```bash
docker compose up --build
```

This will automatically:
1. Spin up a local **MongoDB 7.0** container (`futminna_ams_mongo`) on port `27017`.
2. Build and start the **Next.js Web Application** container (`futminna_ams_web`) on port `3000`.
3. Auto-seed all static accounts into local MongoDB on startup.
4. Mount persistent Docker volumes for database data (`mongo_data`) and local file uploads (`uploads_data`).

Access the web app at: **`http://localhost:3000`**

---

## 👥 Static Accounts (Reflected in Local DB)

All static accounts are seeded with password: **`password123`**

| Role | Email | Password | Description |
|---|---|---|---|
| **Admin** | `admin@futminna.edu.ng` | `password123` | System Administrator |
| **Staff** | `secretary@futminna.edu.ng` | `password123` | Clinic Secretary / Triage |
| **Patient** | `gideon.okoro@futminna.edu.ng` | `password123` | Student (Computer Science) |
| **Patient** | `zainab.abubakar@futminna.edu.ng` | `password123` | Student (Cyber Security) |
| **Patient** | `chinedu.okafor@futminna.edu.ng` | `password123` | Student (Electrical Eng.) |

---

## 📂 Local File Storage (Cloudinary Replacement)

File uploads are stored locally in `/public/uploads/` (backed by a persistent Docker volume `uploads_data`).
* **API Endpoint**: `POST /api/upload`
* **Server Action**: `uploadLocalFile(formData)` in `actions/upload.js`

---

## 🛠 Manual Local Running (Without Docker)

If you have MongoDB running locally on your machine:

1. Create a `.env.local` file:
   ```env
   MONGODB_URI=mongodb://localhost:27017/futminna_ams
   NEXTAUTH_SECRET=local_secret_key
   NEXTAUTH_URL=http://localhost:3000
   ```

2. Install dependencies & Seed database:
   ```bash
   npm install
   npm run seed:all
   ```

3. Start dev server:
   ```bash
   npm run dev
   ```
