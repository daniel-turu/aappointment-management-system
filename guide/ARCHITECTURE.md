# FUTMinna Health Centre — Appointment Management System
## Architecture & Developer Guide

> Stack: Next.js 15 (Full Stack) + MongoDB + Firebase Push Notifications

---

## Are You on the Right Track?

YES — This stack is clean, minimal, and fully sufficient for a final-year project.

| Service       | Cost  |
|---------------|-------|
| Next.js 15    | Free  |
| MongoDB Atlas | Free  |
| Firebase FCM  | Free  |
| Vercel        | Free  |

---

## System Architecture

```
Browser (Patient / Staff / Admin)
        │
        ▼
┌─────────────────────────────────┐
│        Next.js App (Vercel)     │
│                                 │
│  ┌──────────┐  ┌─────────────┐ │
│  │  Pages   │  │  API Routes │ │
│  │ (App     │  │  /api/...   │ │
│  │  Router) │  │             │ │
│  └──────────┘  └──────┬──────┘ │
│         Server Actions │       │
└────────────────────────┼───────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
    ┌──────────┐  ┌──────────┐  ┌──────────────┐
    │ MongoDB  │  │ Firebase │  │  Auth.js     │
    │  Atlas   │  │   FCM    │  │  (Sessions)  │
    │ (free)   │  │  Push    │  │              │
    └──────────┘  └──────────┘  └──────────────┘
```

**Flow:**
1. User opens browser → Next.js serves the page
2. User submits a form → Server Action hits MongoDB
3. On appointment events → Server calls Firebase Admin SDK → push sent to browser
4. Auth.js manages login sessions and reads roles from MongoDB

---

## Tech Stack

| Layer         | Tool                   | Why                                     |
|---------------|------------------------|-----------------------------------------|
| Framework     | Next.js 15 (App Router)| Frontend + Backend in one codebase      |
| Language      | JavaScript             | Simple, no TypeScript overhead          |
| Styling       | Tailwind CSS + shadcn/ui| Fast, professional UI                  |
| Auth          | Auth.js (NextAuth)     | Role-based sessions, easy to configure  |
| Database      | MongoDB Atlas          | Free, flexible, no rigid SQL schema     |
| ODM           | Mongoose               | Schema + validation for MongoDB         |
| Push Notifs   | Firebase FCM           | Free, browser push, no email needed     |
| Deployment    | Vercel                 | Free, Next.js native                    |

---

## User Roles & Dashboard Separation

```
/dashboard/patient/*   → Patient only
/dashboard/staff/*     → Staff only   (DIFFERENT from admin)
/dashboard/admin/*     → Admin only   (DIFFERENT from staff)
```

**Staff vs Admin Differences:**

| Feature                  | Staff (Doctor/Nurse) | Admin (Manager) |
|--------------------------|----------------------|-----------------|
| View appointments        | Their schedule only  | All appointments|
| Approve / Reject         | ✅ Yes               | ✅ Yes          |
| Manage users             | ❌ No                | ✅ Yes          |
| Manage departments       | ❌ No                | ✅ Yes          |
| Generate reports         | ❌ No                | ✅ Yes          |
| View patient records     | Limited              | Full access     |
| System settings          | ❌ No                | ✅ Yes          |

`middleware.js` enforces this — wrong role = redirect.

---

## MongoDB Collections

### users
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string (unique)",
  "phone": "string",
  "password": "string (bcrypt hashed)",
  "role": "patient | staff | admin",
  "isActive": true,
  "fcmToken": "string (Firebase push token)",
  "createdAt": "Date"
}
```

### patients
```json
{
  "_id": "ObjectId",
  "userId": "ref: users",
  "studentId": "string (unique)",
  "gender": "string",
  "age": "number",
  "address": "string",
  "faculty": "string",
  "emergencyContact": "string"
}
```

### staff
```json
{
  "_id": "ObjectId",
  "userId": "ref: users",
  "departmentId": "ref: departments",
  "specialization": "string",
  "workingDays": ["MON","TUE","WED","THU","FRI"],
  "slotDuration": 30
}
```

### departments
```json
{
  "_id": "ObjectId",
  "name": "string",
  "description": "string",
  "isActive": true
}
```

### appointments
```json
{
  "_id": "ObjectId",
  "patientId": "ref: patients",
  "staffId": "ref: staff",
  "departmentId": "ref: departments",
  "date": "string (YYYY-MM-DD)",
  "time": "string (HH:mm)",
  "status": "pending | approved | rejected | completed | cancelled | no_show",
  "reason": "string",
  "rejectionReason": "string",
  "createdAt": "Date"
}
```

### notifications
```json
{
  "_id": "ObjectId",
  "userId": "ref: users",
  "appointmentId": "ref: appointments",
  "title": "string",
  "message": "string",
  "isRead": false,
  "createdAt": "Date"
}
```

---

## Firebase Push Notification Flow

```
1. User opens app → browser asks "Allow Notifications?"
2. User clicks Allow → Firebase gives browser a unique FCM Token
3. App POSTs FCM Token → /api/notifications/fcm-token → saved to MongoDB user doc
4. Appointment is approved (Server Action):
      → Firebase Admin SDK called
      → firebase-admin.messaging().send({ token, notification })
      → Push appears on patient's screen
```

**When notifications fire:**

| Event                   | Notified       |
|-------------------------|----------------|
| Appointment booked      | Assigned staff |
| Appointment approved    | Patient        |
| Appointment rejected    | Patient        |
| Appointment rescheduled | Patient        |
| Appointment cancelled   | Patient + Staff|
| New pending booking     | Admin          |

---

## Full Folder Structure

```
futminna-ams/
├── app/
│   ├── (auth)/
│   │   ├── login/page.jsx
│   │   └── register/page.jsx
│   ├── dashboard/
│   │   ├── patient/
│   │   │   ├── page.jsx
│   │   │   ├── appointments/
│   │   │   │   ├── page.jsx
│   │   │   │   └── new/page.jsx
│   │   │   └── profile/page.jsx
│   │   ├── staff/
│   │   │   ├── page.jsx
│   │   │   ├── appointments/page.jsx
│   │   │   └── patients/page.jsx
│   │   └── admin/
│   │       ├── page.jsx
│   │       ├── users/page.jsx
│   │       ├── departments/page.jsx
│   │       ├── appointments/page.jsx
│   │       └── reports/page.jsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.js
│   │   ├── appointments/route.js
│   │   ├── users/route.js
│   │   ├── departments/route.js
│   │   └── notifications/fcm-token/route.js
│   ├── layout.jsx
│   └── page.jsx
├── lib/
│   ├── mongodb.js
│   ├── auth.js
│   ├── firebase-admin.js
│   └── firebase-client.js
├── models/
│   ├── User.js
│   ├── Patient.js
│   ├── Staff.js
│   ├── Department.js
│   ├── Appointment.js
│   └── Notification.js
├── components/
│   ├── ui/
│   ├── appointments/
│   │   ├── BookingForm.jsx
│   │   ├── AppointmentCard.jsx
│   │   └── StatusBadge.jsx
│   ├── dashboard/
│   │   └── StatsCard.jsx
│   └── NotificationBell.jsx
├── actions/
│   ├── appointments.js
│   ├── users.js
│   └── notifications.js
├── middleware.js
├── .env.local
└── next.config.js
```

---

## Environment Variables

Create `.env.local` in the project root:

```env
# MongoDB
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/futminna-ams

# Auth.js
NEXTAUTH_SECRET=some_random_32_char_string
NEXTAUTH_URL=http://localhost:3000

# Firebase Admin (Server-side)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Firebase Client (Browser-side)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
```

---

## Development Phases

### Phase 1 — Setup & Auth (Week 1)
- [ ] Next.js project scaffolded
- [ ] MongoDB Atlas connected (Mongoose)
- [ ] Register + Login pages built
- [ ] Auth.js with Credentials provider + role sessions
- [ ] middleware.js route protection
- [ ] Database seed: admin + departments + sample staff + sample patient

### Phase 2 — Patient Booking (Week 2)
- [ ] Landing page
- [ ] Patient dashboard
- [ ] Book appointment wizard: department → doctor → date → time → confirm
- [ ] Slot availability check (no double booking)
- [ ] View / Cancel / Reschedule appointments
- [ ] Patient profile page

### Phase 3 — Staff Dashboard (Week 3)
- [ ] Staff home: today's schedule
- [ ] Approve / Reject / Complete / No-Show actions
- [ ] Patient lookup
- [ ] Staff profile

### Phase 4 — Admin Dashboard (Week 3–4)
- [ ] Admin overview with stats + charts (Recharts)
- [ ] User management (CRUD)
- [ ] Department management (CRUD)
- [ ] All appointments view with filters
- [ ] Basic reports (daily/weekly counts)

### Phase 5 — Firebase Notifications (Week 4)
- [ ] Firebase project created (free)
- [ ] Browser: request permission → get FCM token → save to MongoDB
- [ ] Server: Firebase Admin sends push on appointment events
- [ ] In-app notification bell + notification list

### Phase 6 — Testing & Deploy (Week 5)
- [ ] Full flow testing (all 3 roles)
- [ ] Mobile responsiveness
- [ ] Deploy to Vercel
- [ ] Write Chapter 4 (Implementation)

---

## Install Commands

```bash
# Core
npm install mongoose next-auth@beta @auth/mongodb-adapter

# Firebase
npm install firebase firebase-admin

# Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# Charts (for admin reports)
npm install recharts

# shadcn/ui components
npx shadcn@latest add button card input form table badge calendar dialog tabs select
```

---

## Academic Note

> For your Chapter 3 update: Replace PHP with Next.js (App Router),
> MySQL with MongoDB, and note that notifications are handled via
> Firebase Cloud Messaging (FCM). The three-tier architecture,
> all functional/non-functional requirements, and system diagrams
> remain valid and unchanged.
