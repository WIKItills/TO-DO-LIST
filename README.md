# Role-Based Task Tracking & Verification System

Welcome to the **Role-Based Task Tracking & Verification System**. This is a secure, full-stack web application designed for students to track daily tasks, assign verification teachers, and upload photo proofs of completion. Teachers can review assigned proofs in a queue and either approve or reject them with feedback, while Super-Admins have a read-only monitoring console to view all system activity.

---

## 🚀 Key Features

* **3 Distinct User Roles**: `student`, `teacher`, and `admin`.
* **JWT Authentication**: Secure registration and sign-in with authorization tokens.
* **Role-Based Access Control (RBAC)**: Custom middlewares protecting Express endpoints.
* **Verification Proof Uploads**: Handles photo proofs (JPEG, PNG, WEBP) using `multer` with a production-ready `Cloudinary` configuration.
* **Zero-Config Upload Fallback**: If Cloudinary API credentials are left empty in `.env`, the system automatically saves proofs locally on disk in `backend/uploads/` and serves them statically.
* **Super-Admin Monitor Panel**: Complete dashboard showing system analytics, active accounts registry, and global tasks audit log.
* **Premium Glassmorphic UI**: Translucent panels, smooth hover micro-animations, statistics widgets, modal proof previewers, and toast notifications.
* **Production-Grade Security**: Inputs are sanitized against NoSQL injection, API routes are rate-limited, and HTTP response headers are secured via `helmet`.

---

## 📁 Recommended Project Structure

```text
TO-DO-LIST-main/
├── backend/
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   └── cloudinary.js       # Cloudinary client initialization
│   ├── controllers/
│   │   ├── adminController.js  # Super Admin reports & analytics
│   │   ├── authController.js   # JWT registration & login
│   │   └── taskController.js   # Tasks creation, proofs & reviews
│   ├── middleware/
│   │   ├── authMiddleware.js   # Route guards & RBAC authorization
│   │   └── uploadMiddleware.js # Multer file upload configuration
│   ├── models/
│   │   ├── Task.js             # Mongoose Task Schema
│   │   └── User.js             # Mongoose User Schema
│   ├── routes/
│   │   ├── adminRoutes.js      # /api/admin/*
│   │   ├── authRoutes.js       # /api/auth/*
│   │   └── taskRoutes.js       # /api/tasks/*
│   ├── uploads/                # Local uploads fallback directory
│   ├── .env.example            # Environment variables template
│   ├── .env                    # Active local environment variables
│   └── server.js               # Express application entrypoint
├── frontend/
│   ├── css/
│   │   └── style.css           # Glassmorphism styling sheets
│   ├── js/
│   │   ├── api.js              # Token caching & dynamic fetch helper
│   │   ├── admin.js            # Admin panel script
│   │   ├── auth.js             # Login/Register tab coordinator
│   │   ├── student.js          # Student tasks creation & upload controls
│   │   └── teacher.js          # Teacher review & verification controller
│   ├── admin.html              # Super-Admin Dashboard
│   ├── index.html              # Login & Signup Landing Portal
│   ├── student.html            # Student Portal
│   └── teacher.html            # Teacher Review Portal
├── old-todo-app/               # Backup of original client-only todo app
├── package.json                # Project script manager
└── README.md                   # System configuration guide
```

---

## 🛠️ Installation & Setup

### 1. Prerequisite: Local MongoDB Database
Ensure that MongoDB is installed and running on your local machine:
* **Windows**: By default, MongoDB runs on `mongodb://localhost:27017/`. You can start it via Windows Services or run `mongod` in your command line.

### 2. Install Project Dependencies
Run `npm install` in the root project folder:
```bash
npm install
```

### 3. Setup Environment Configuration (`backend/.env`)
The system reads settings from `backend/.env`. A default template is pre-created:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/task-tracker
JWT_SECRET=supersecretjwtkey123456!
JWT_EXPIRE=30d

# Cloudinary Integration (Optional)
# Leave these fields empty to use the local disk upload fallback (saved in backend/uploads/)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## 💻 Running the Application

To spin up the Node.js development server (which utilizes Node's built-in file watcher):
```bash
npm run dev
```

For production start:
```bash
npm start
```

Once running, the application will console log:
* `MongoDB Connected: localhost` (If your local MongoDB server is active)
* `Cloudinary environment variables missing. System will store photo proofs locally...`
* `Server running in development mode on port 5000`

Open your web browser and navigate to: **`http://localhost:5000`**

---

## 🧪 Testing the Workflows (Step-by-Step)

Here is a recommended testing flow to demonstrate the system capabilities:

### Step 1: Create Accounts (Sign Up)
1. Navigate to `http://localhost:5000` and click the **Sign Up** tab.
2. Create **two Teachers**:
   * Name: `Teacher Alice`, Email: `alice@school.com`, Role: `Teacher`, Password: `password123`
   * Name: `Teacher Bob`, Email: `bob@school.com`, Role: `Teacher`, Password: `password123`
3. Create **one Student**:
   * Name: `Student Charlie`, Email: `charlie@school.com`, Role: `Student`, Password: `password123`
4. Create **one Admin**:
   * Name: `Admin Boss`, Email: `admin@school.com`, Role: `Admin`, Password: `password123`

### Step 2: Student Creates Tasks & Uploads Proof
1. Sign in as **Student Charlie** (`charlie@school.com` / `password123`).
2. On the left sidebar, type a **New Daily Task**:
   * Title: `Complete Science Homework`
   * Scope: `Read Chapter 3 and solve exercise questions 1-5.`
   * Assign Teacher: Select `Teacher Alice` from the dropdown list (populated dynamically from the database).
   * Click **Create Task**. It will appear in your list on the right as `pending`.
3. Locate the new task on the task stream and click **Submit Proof**.
4. In the modal, drag & drop or browse a photo file (e.g. any sample PNG/JPEG image). Click **Upload & Submit**.
5. The task status updates immediately to `submitted`.

### Step 3: Teacher Reviews Task Submissions
1. Logout as student, and sign in as **Teacher Alice** (`alice@school.com` / `password123`).
2. Under **Review Queue**, you will see Charlie's task: `Complete Science Homework`.
3. Click **View Proof** to expand the photo proof Charlie uploaded.
4. Input comments in the review feedback box (e.g. `Excellent work, Charlie! Answers are accurate.`).
5. Click **Approve Task**. The task disappears from your Review Queue and moves into your **Review History** tab.

### Step 4: Admin Monitors System
1. Logout and sign in as **Admin Boss** (`admin@school.com` / `password123`).
2. View global statistics dashboard (analytics cards displaying total users, completion rates, and ratio indexes).
3. Switch between:
   * **System Accounts**: View-only grid showing all registered profiles.
   * **Global Task Stream**: View-only audit log showing Charlie's task, assigned teachers, status, and direct buttons to inspect the uploaded image proofs.