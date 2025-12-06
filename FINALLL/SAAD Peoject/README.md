# University Management System

A modern web platform for managing university operations. Students register for courses and track grades. Instructors create courses and assign grades. Finance staff verify payments. Administrators oversee the system.

## Test Accounts

| Username | Password | Role |
|----------|----------|------|
| student | studentpass | Student |
| instructor | instructorpass | Instructor |
| admin | adminpass | Administrator |
| finance | financepass | Finance Staff |

## Features by Role

**Students:** Register for courses (max 7), choose payment method, switch courses, view grades, manage profile.

**Instructors:** Create and manage courses, enter student grades, view catalog.

**Finance Staff:** Review and approve/reject pending payments, view payment history.

**Administrators:** View enrollment reports, access system data, monitor the entire system.

## Payment Processing

**Cash:** Instant success — registration confirmed immediately.

**Visa:** May succeed or go pending. Finance staff approve or reject pending payments.

## How to Run

```bash
python3 -m http.server 8000
```

Open http://localhost:8000 in your browser and sign in with a test account.

## Data Storage

All data stored in browser localStorage. To reset:

1. Open Developer Tools (F12)
2. Go to Application → Local Storage
3. Delete `ums_data_v3` and `ums_curr_v3`
4. Reload page

## Technology

HTML5, CSS3, Vanilla JavaScript, LocalStorage API.

