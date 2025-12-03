# University Management System

A modern, user-friendly web platform for managing university operations. Students register for courses, manage payments, and track grades. Instructors create courses and assign grades. Finance staff verify payments. Administrators oversee the entire system.

## Quick Start

### 1. Open the Project

Navigate to your project folder and start a local web server:

```bash
cd /home/human/SA_D-Project
python3 -m http.server 8000
```

Then open your browser and go to: **http://localhost:8000**

### 2. Sign In with a Test Account

Choose a role and explore the system:

| Username | Password | Role |
|----------|----------|------|
| student | studentpass | Student |
| instructor | instructorpass | Instructor |
| admin | adminpass | Administrator |
| finance | financepass | Finance Staff |

## What You Can Do

### For Students
- **Browse the course catalog** and search by name or credit hours
- **Register for up to 7 courses** with automatic seat availability checks
- **Choose your payment method** (Cash for instant success, Visa for testing payment approvals)
- **Switch courses** by dropping one and adding another in a single transaction
- **View your grades** once instructors enter them
- **Manage your profile** and change your password anytime

### For Instructors
- **Create and manage courses** with course codes, titles, credit hours, and seat counts
- **Edit or delete courses** you've created
- **Enter student grades** in a simple form
- **View the course catalog** and manage enrollment

### For Finance Staff
- **Review pending payments** from students who chose Visa
- **Approve or reject payments** with a single click
- **View payment history** and transaction details
- **Track which students have paid** for their courses

### For Administrators
- **View enrollment reports** showing course registrations and student counts
- **Access system data** in JSON format for advanced analysis
- **Monitor the entire system** and generate summaries

## How Payment Processing Works

**Cash Payment:**
- Instant success — your registration is confirmed immediately
- Best for testing the core registration flow

**Visa Payment:**
- May succeed or go pending (simulating real-world scenarios)
- Pending payments appear in the Finance queue
- Finance staff can approve or reject them
- Once approved, your registration is confirmed and the course seat is reserved

## File Structure

```
SA_D-Project/
├── index.html              # Home page
├── login.html              # Sign in page
├── dashboard.html          # User dashboard
├── courses.html            # Course catalog & management
├── register.html           # Course registration
├── grades.html             # Grade entry & viewing
├── admin.html              # Admin & Finance dashboards
├── about.html              # Meet the team
├── profile.html            # User profile & password change
├── help.html               # Help & troubleshooting
├── assets/
│   ├── style.css           # All styling (responsive design)
│   └── app.js              # Business logic & data management
└── README.md               # This file
```

## Data Storage

All data is stored locally